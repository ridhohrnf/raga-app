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
      const schemaSql = `
        -- 1. Create Users Table
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- 2. Create Workouts Table
        CREATE TABLE IF NOT EXISTS workouts (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          notes TEXT,
          completed BOOLEAN DEFAULT FALSE
        );

        -- 3. Create Exercises Table
        CREATE TABLE IF NOT EXISTS exercises (
          id SERIAL PRIMARY KEY,
          workout_id INTEGER REFERENCES workouts(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          category VARCHAR(100),
          notes TEXT
        );

        -- 4. Create Sets Table
        CREATE TABLE IF NOT EXISTS sets (
          id SERIAL PRIMARY KEY,
          exercise_id INTEGER REFERENCES exercises(id) ON DELETE CASCADE,
          set_number INTEGER NOT NULL,
          weight NUMERIC(6, 2) NOT NULL,
          reps INTEGER NOT NULL,
          rpe INTEGER,
          completed BOOLEAN DEFAULT FALSE
        );

        -- 5. Create Progress Images Table
        CREATE TABLE IF NOT EXISTS progress_images (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          image_data TEXT NOT NULL,
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- 6. Create Daily Activities Table
        CREATE TABLE IF NOT EXISTS daily_activities (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          date DATE NOT NULL DEFAULT CURRENT_DATE,
          steps INTEGER NOT NULL DEFAULT 0,
          calories INTEGER NOT NULL DEFAULT 0,
          distance NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- 7. Create Password Resets Table
        CREATE TABLE IF NOT EXISTS password_resets (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          token VARCHAR(255) UNIQUE NOT NULL,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL
        );

        -- 8. Alter User Table (Columns migration)
        ALTER TABLE users ADD COLUMN IF NOT EXISTS weight NUMERIC(5, 2);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS height NUMERIC(5, 2);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS age INTEGER;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(50);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS activity_level VARCHAR(100);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS fitness_goal VARCHAR(100) DEFAULT 'maintenance';
        ALTER TABLE users ADD COLUMN IF NOT EXISTS workout_program VARCHAR(255) DEFAULT 'Upper, Lower';

        -- 9. Create Food Items Table (Food library)
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
        );

        -- 10. Create Logged Meals Table (Daily calorie diary)
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
        );

        -- Safe Alter for logged_meals image_data and meal_time
        ALTER TABLE logged_meals ADD COLUMN IF NOT EXISTS image_data TEXT;
        ALTER TABLE logged_meals ADD COLUMN IF NOT EXISTS meal_time VARCHAR(50) DEFAULT 'Camilan';

        -- 11. Create Daily Targets Table
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
        );

        -- 12. Create Workout Templates Table
        CREATE TABLE IF NOT EXISTS workout_templates (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- 13. Create Template Exercises Table
        CREATE TABLE IF NOT EXISTS template_exercises (
          id SERIAL PRIMARY KEY,
          template_id INTEGER REFERENCES workout_templates(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          category VARCHAR(100) NOT NULL,
          order_index INTEGER DEFAULT 0
        );

        -- Alter template_exercises to add sets
        ALTER TABLE template_exercises ADD COLUMN IF NOT EXISTS sets TEXT;

        -- 14. Create Daily Records Table
        CREATE TABLE IF NOT EXISTS daily_records (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          date DATE NOT NULL,
          weight NUMERIC(5, 2),
          fitness_goal VARCHAR(100),
          tdee INTEGER,
          target_calories INTEGER,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          UNIQUE (user_id, date)
        );
      `;

      // Split statements by semicolon, strip comments, and filter out empty items
      const statements = schemaSql
        .split(';')
        .map(stmt => stmt.replace(/--.*$/gm, '').trim())
        .filter(stmt => stmt.length > 0);

      // Execute each statement sequentially using sql.query
      for (const stmt of statements) {
        await sql.query(stmt);
      }

      // Legacy rename migrations (wrapped separately to avoid batch failures)
      try {
        await sql`ALTER TABLE food_items RENAME COLUMN calories_per_100g TO calories`;
      } catch (e) {}
      try {
        await sql`ALTER TABLE food_items RENAME COLUMN protein_per_100g TO protein`;
      } catch (e) {}
      try {
        await sql`ALTER TABLE food_items RENAME COLUMN carbs_per_100g TO carbs`;
      } catch (e) {}
      try {
        await sql`ALTER TABLE food_items RENAME COLUMN fat_per_100g TO fat`;
      } catch (e) {}

      // Seed default food items in a single insert query
      const foodCount = await sql`SELECT COUNT(id)::int AS count FROM food_items WHERE user_id IS NULL`;
      if (foodCount[0].count === 0) {
        await sql`
          INSERT INTO food_items (user_id, name, calories, protein, carbs, fat, serving_g)
          VALUES 
            (NULL, 'Nasi Putih', 130, 2.7, 28, 0.3, 100.00),
            (NULL, 'Dada Ayam (Panggang)', 165, 31, 0, 3.6, 100.00),
            (NULL, 'Telur Rebus', 155, 13, 1.1, 11, 100.00),
            (NULL, 'Tempe Goreng', 225, 19, 14, 11, 100.00),
            (NULL, 'Tahu Goreng', 271, 17, 10, 20, 100.00),
            (NULL, 'Susu Whey Protein', 384, 80, 6, 4, 100.00),
            (NULL, 'Pisang', 89, 1.1, 23, 0.3, 100.00),
            (NULL, 'Daging Sapi (Masak)', 250, 26, 0, 15, 100.00),
            (NULL, 'Roti Gandum', 247, 13, 41, 3.4, 100.00),
            (NULL, 'Oatmeal', 389, 16.9, 66, 6.9, 100.00)
        `;
        console.log("Seeded default food items successfully in a single batch.");
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
