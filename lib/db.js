import { neon } from '@neondatabase/serverless';

// Singleton instance of database connection
let sql;

if (process.env.DATABASE_URL) {
  sql = neon(process.env.DATABASE_URL);
} else {
  console.warn("DATABASE_URL is not set. Database operations will fail.");
}

let dbInitialized = false;

export async function getDb() {
  if (!sql) {
    throw new Error("DATABASE_URL is missing in environment variables.");
  }
  
  if (!dbInitialized) {
    try {
      // 1. Create Users Table
      await sql`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `;

      // 2. Create Workouts Table
      await sql`
        CREATE TABLE IF NOT EXISTS workouts (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          notes TEXT,
          completed BOOLEAN DEFAULT FALSE
        )
      `;

      // 3. Create Exercises Table
      await sql`
        CREATE TABLE IF NOT EXISTS exercises (
          id SERIAL PRIMARY KEY,
          workout_id INTEGER REFERENCES workouts(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          category VARCHAR(100),
          notes TEXT
        )
      `;

      // 4. Create Sets Table
      await sql`
        CREATE TABLE IF NOT EXISTS sets (
          id SERIAL PRIMARY KEY,
          exercise_id INTEGER REFERENCES exercises(id) ON DELETE CASCADE,
          set_number INTEGER NOT NULL,
          weight NUMERIC(6, 2) NOT NULL,
          reps INTEGER NOT NULL,
          rpe INTEGER,
          completed BOOLEAN DEFAULT FALSE
        )
      `;

      // 5. Create Progress Images Table
      await sql`
        CREATE TABLE IF NOT EXISTS progress_images (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          image_data TEXT NOT NULL,
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `;

      // 6. Create Daily Activities Table
      await sql`
        CREATE TABLE IF NOT EXISTS daily_activities (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          date DATE NOT NULL DEFAULT CURRENT_DATE,
          steps INTEGER NOT NULL DEFAULT 0,
          calories INTEGER NOT NULL DEFAULT 0,
          distance NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `;

      // 7. Create Password Resets Table
      await sql`
        CREATE TABLE IF NOT EXISTS password_resets (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          token VARCHAR(255) UNIQUE NOT NULL,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL
        )
      `;

      // 8. Safe Alter User Table (Columns migration)
      try {
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS weight NUMERIC(5, 2)`;
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS height NUMERIC(5, 2)`;
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS age INTEGER`;
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(50)`;
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS activity_level VARCHAR(100)`;
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS fitness_goal VARCHAR(100) DEFAULT 'maintenance'`;
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS workout_program VARCHAR(255) DEFAULT 'Upper, Lower'`;
      } catch (migrationErr) {
        console.warn("Migration warning for user columns:", migrationErr.message);
      }

      // 9. Create Food Items Table (Food library)
      await sql`
        CREATE TABLE IF NOT EXISTS food_items (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          calories NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
          protein NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
          carbs NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
          fat NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
          serving_g NUMERIC(6, 2) NOT NULL DEFAULT 100.00,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `;

      // Run rename migrations if the old columns exist
      try {
        await sql`ALTER TABLE food_items RENAME COLUMN calories_per_100g TO calories`;
      } catch (e) {
        // Safe to ignore if column already renamed or doesn't exist
      }
      try {
        await sql`ALTER TABLE food_items RENAME COLUMN protein_per_100g TO protein`;
      } catch (e) {}
      try {
        await sql`ALTER TABLE food_items RENAME COLUMN carbs_per_100g TO carbs`;
      } catch (e) {}
      try {
        await sql`ALTER TABLE food_items RENAME COLUMN fat_per_100g TO fat`;
      } catch (e) {}

      // Safe Alter for columns to ensure they exist with default values
      try {
        await sql`ALTER TABLE food_items ADD COLUMN IF NOT EXISTS calories NUMERIC(6, 2) NOT NULL DEFAULT 0.00`;
        await sql`ALTER TABLE food_items ADD COLUMN IF NOT EXISTS protein NUMERIC(6, 2) NOT NULL DEFAULT 0.00`;
        await sql`ALTER TABLE food_items ADD COLUMN IF NOT EXISTS carbs NUMERIC(6, 2) NOT NULL DEFAULT 0.00`;
        await sql`ALTER TABLE food_items ADD COLUMN IF NOT EXISTS fat NUMERIC(6, 2) NOT NULL DEFAULT 0.00`;
        await sql`ALTER TABLE food_items ADD COLUMN IF NOT EXISTS serving_g NUMERIC(6, 2) NOT NULL DEFAULT 100.00`;
      } catch (err) {
        console.warn("Migration warning for food_items columns:", err.message);
      }

      // 10. Create Logged Meals Table (Daily calorie diary)
      await sql`
        CREATE TABLE IF NOT EXISTS logged_meals (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          food_name VARCHAR(255) NOT NULL,
          weight_g NUMERIC(6, 2) NOT NULL,
          calories NUMERIC(6, 2) NOT NULL,
          protein NUMERIC(6, 2) NOT NULL,
          carbs NUMERIC(6, 2) NOT NULL,
          fat NUMERIC(6, 2) NOT NULL,
          logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `;

      // Safe Alter for logged_meals to ensure image_data exists
      try {
        await sql`ALTER TABLE logged_meals ADD COLUMN IF NOT EXISTS image_data TEXT`;
      } catch (err) {
        console.warn("Migration warning for logged_meals image_data:", err.message);
      }

      // Safe Alter for logged_meals to ensure meal_time exists
      try {
        await sql`ALTER TABLE logged_meals ADD COLUMN IF NOT EXISTS meal_time VARCHAR(50) DEFAULT 'Camilan'`;
      } catch (err) {
        console.warn("Migration warning for logged_meals meal_time:", err.message);
      }

      // 11. Seed default food items if empty
      const foodCount = await sql`SELECT COUNT(id)::int AS count FROM food_items WHERE user_id IS NULL`;
      if (foodCount[0].count === 0) {
        const defaultFoods = [
          { name: 'Nasi Putih', calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
          { name: 'Dada Ayam (Panggang)', calories: 165, protein: 31, carbs: 0, fat: 3.6 },
          { name: 'Telur Rebus', calories: 155, protein: 13, carbs: 1.1, fat: 11 },
          { name: 'Tempe Goreng', calories: 225, protein: 19, carbs: 14, fat: 11 },
          { name: 'Tahu Goreng', calories: 271, protein: 17, carbs: 10, fat: 20 },
          { name: 'Susu Whey Protein', calories: 384, protein: 80, carbs: 6, fat: 4 },
          { name: 'Pisang', calories: 89, protein: 1.1, carbs: 23, fat: 0.3 },
          { name: 'Daging Sapi (Masak)', calories: 250, protein: 26, carbs: 0, fat: 15 },
          { name: 'Roti Gandum', calories: 247, protein: 13, carbs: 41, fat: 3.4 },
          { name: 'Oatmeal', calories: 389, protein: 16.9, carbs: 66, fat: 6.9 }
        ];
        for (const food of defaultFoods) {
          await sql`
            INSERT INTO food_items (user_id, name, calories, protein, carbs, fat, serving_g)
            VALUES (NULL, ${food.name}, ${food.calories}, ${food.protein}, ${food.carbs}, ${food.fat}, 100.00)
          `;
        }
        console.log("Seeded default food items successfully.");
      }

      // 12. Create Daily Targets Table (Override target calories per day)
      await sql`
        CREATE TABLE IF NOT EXISTS daily_targets (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          logged_date DATE NOT NULL,
          target_calories INTEGER NOT NULL,
          target_protein INTEGER NOT NULL,
          target_carbs INTEGER NOT NULL,
          target_fat INTEGER NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          UNIQUE (user_id, logged_date)
        )
      `;

      // 13. Create Workout Templates Table
      await sql`
        CREATE TABLE IF NOT EXISTS workout_templates (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `;

      // 14. Create Template Exercises Table
      await sql`
        CREATE TABLE IF NOT EXISTS template_exercises (
          id SERIAL PRIMARY KEY,
          template_id INTEGER REFERENCES workout_templates(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          category VARCHAR(100) NOT NULL,
          order_index INTEGER DEFAULT 0
        )
      `;

      // Migration: Add sets column if not exists
      try {
        await sql`ALTER TABLE template_exercises ADD COLUMN IF NOT EXISTS sets TEXT`;
      } catch (err) {
        console.warn("Migration warning for template_exercises sets column:", err.message);
      }

      dbInitialized = true;
      console.log("NeonDB tables verified/created successfully.");
    } catch (error) {
      console.error("Database schema initialization failed:", error);
      throw error;
    }
  }

  return sql;
}
