import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get('date') || new Date().toISOString().split('T')[0];

    const sql = await getDb();

    // 1. Check and seed default workout if user has none
    const countResult = await sql`
      SELECT COUNT(id)::int AS count FROM workouts WHERE user_id = ${user.id}
    `;

    if (countResult[0].count === 0) {
      const seedDate = new Date('2026-06-04T18:00:00+07:00');
      const workoutResult = await sql`
        INSERT INTO workouts (user_id, name, date, notes, completed)
        VALUES (
          ${user.id}, 
          'Latihan Kamis (Dada, Kaki & Punggung)', 
          ${seedDate}, 
          'Waktu Latihan: 18:00 - 20:00. Sesi awal dengan fokus kekuatan utama.', 
          true
        )
        RETURNING id
      `;
      const workoutId = workoutResult[0].id;

      // Exercise 1: Bench Press
      const ex1Result = await sql`
        INSERT INTO exercises (workout_id, name, category, notes)
        VALUES (${workoutId}, 'Bench Press', 'Chest', 'Fokus pada progressive overload')
        RETURNING id
      `;
      const ex1Id = ex1Result[0].id;
      await sql`INSERT INTO sets (exercise_id, set_number, weight, reps, rpe, completed) VALUES (${ex1Id}, 1, 60, 10, 8, true)`;
      await sql`INSERT INTO sets (exercise_id, set_number, weight, reps, rpe, completed) VALUES (${ex1Id}, 2, 65, 8, 9, true)`;
      await sql`INSERT INTO sets (exercise_id, set_number, weight, reps, rpe, completed) VALUES (${ex1Id}, 3, 70, 6, 10, true)`;

      // Exercise 2: Squat
      const ex2Result = await sql`
        INSERT INTO exercises (workout_id, name, category, notes)
        VALUES (${workoutId}, 'Squat', 'Leg', 'ROM penuh')
        RETURNING id
      `;
      const ex2Id = ex2Result[0].id;
      await sql`INSERT INTO sets (exercise_id, set_number, weight, reps, rpe, completed) VALUES (${ex2Id}, 1, 80, 8, 8, true)`;
      await sql`INSERT INTO sets (exercise_id, set_number, weight, reps, rpe, completed) VALUES (${ex2Id}, 2, 90, 6, 9, true)`;
      await sql`INSERT INTO sets (exercise_id, set_number, weight, reps, rpe, completed) VALUES (${ex2Id}, 3, 100, 4, 10, true)`;

      // Exercise 3: Pull Up
      const ex3Result = await sql`
        INSERT INTO exercises (workout_id, name, category, notes)
        VALUES (${workoutId}, 'Pull Up', 'Back', 'Grip lebar')
        RETURNING id
      `;
      const ex3Id = ex3Result[0].id;
      await sql`INSERT INTO sets (exercise_id, set_number, weight, reps, rpe, completed) VALUES (${ex3Id}, 1, 0, 10, 8, true)`;
      await sql`INSERT INTO sets (exercise_id, set_number, weight, reps, rpe, completed) VALUES (${ex3Id}, 2, 0, 8, 9, true)`;
      await sql`INSERT INTO sets (exercise_id, set_number, weight, reps, rpe, completed) VALUES (${ex3Id}, 3, 0, 8, 9, true)`;
      
      console.log(`Successfully seeded default Thursday workout for user ${user.id} in init-data`);
    }

    // 2. Fetch everything concurrently using Promise.all
    const [
      workoutsRows,
      templatesRows,
      foodItems,
      activities,
      dailyTargetRow,
      meals,
      images,
      prs,
      recentWorkouts,
      summaryStats,
      nutritionLogs,
      dailyRecords,
      dailyActivities,
      dailyTargets,
      weightLogs,
      fullUserRow
    ] = await Promise.all([
      // A. Workouts with nested Exercises and Sets
      sql`
        SELECT 
          w.id AS workout_id, w.name AS workout_name, w.date AS workout_date, 
          w.notes AS workout_notes, w.completed AS workout_completed,
          e.id AS exercise_id, e.name AS exercise_name, e.category AS exercise_category,
          s.id AS set_id, s.set_number, s.weight, s.reps, s.rpe, s.completed AS set_completed
        FROM workouts w
        LEFT JOIN exercises e ON e.workout_id = w.id
        LEFT JOIN sets s ON s.exercise_id = e.id
        WHERE w.user_id = ${user.id}
        ORDER BY w.date DESC, w.id DESC, e.id ASC, s.set_number ASC
      `,
      // B. Workout templates with nested template exercises
      sql`
        SELECT 
          t.id AS template_id, t.name AS template_name, t.created_at AS template_created_at,
          e.id AS exercise_id, e.name AS exercise_name, e.category AS exercise_category,
          e.order_index, e.sets AS exercise_sets
        FROM workout_templates t
        LEFT JOIN template_exercises e ON e.template_id = t.id
        WHERE t.user_id = ${user.id}
        ORDER BY t.name ASC, t.id DESC, e.order_index ASC, e.id ASC
      `,
      // C. Food library items
      sql`
        SELECT * FROM food_items 
        WHERE user_id IS NULL OR user_id = ${user.id} 
        ORDER BY user_id DESC, name ASC
      `,
      // D. Daily activities (steps, calories, distance)
      sql`
        SELECT 
          id, 
          date::text AS date, 
          steps::int AS steps, 
          calories::int AS calories, 
          distance::float AS distance,
          created_at
        FROM daily_activities
        WHERE user_id = ${user.id}
        ORDER BY date DESC, id DESC
        LIMIT 30
      `,
      // E. Daily Target for dateStr
      sql`
        SELECT * FROM daily_targets 
        WHERE user_id = ${user.id} AND logged_date = ${dateStr}
      `,
      // F. Logged meals for dateStr
      sql`
        SELECT * FROM logged_meals 
        WHERE user_id = ${user.id} AND logged_date = ${dateStr}
        ORDER BY created_at DESC
      `,
      // G. Progress Images
      sql`
        SELECT id, notes, created_at, image_data
        FROM progress_images
        WHERE user_id = ${user.id}
        ORDER BY created_at DESC
      `,
      // H1. Analytics - PRs
      sql`
        SELECT 
          e.name AS exercise_name,
          MAX(s.weight)::float AS max_weight,
          MAX(s.weight * (1 + s.reps::numeric / 30.0))::float AS max_est_1rm,
          MAX(w.date) AS last_done
        FROM sets s
        JOIN exercises e ON s.exercise_id = e.id
        JOIN workouts w ON e.workout_id = w.id
        WHERE w.user_id = ${user.id}
          AND s.completed = TRUE
        GROUP BY e.name
        ORDER BY max_weight DESC
      `,
      // H2. Analytics - Recent workouts (last 12 weeks)
      sql`
        SELECT 
          w.id, 
          w.date, 
          w.name AS workout_name,
          COALESCE(COUNT(s.id), 0)::int AS workout_volume
        FROM workouts w
        LEFT JOIN exercises e ON e.workout_id = w.id
        LEFT JOIN sets s ON s.exercise_id = e.id AND s.completed = TRUE
        WHERE w.user_id = ${user.id}
          AND w.completed = TRUE
          AND w.date >= NOW() - INTERVAL '12 weeks'
        GROUP BY w.id, w.date, w.name
        ORDER BY w.date ASC
      `,
      // H3. Analytics - Summary stats
      sql`
        SELECT 
          COUNT(id) FILTER (WHERE completed = TRUE)::int AS total_workouts,
          COUNT(id)::int AS total_sessions
        FROM workouts 
        WHERE user_id = ${user.id}
      `,
      // H4. Analytics - Nutrition logs (last 7 days)
      sql`
        SELECT 
          logged_date::text AS logged_date,
          COALESCE(SUM(calories), 0)::float AS total_calories,
          COALESCE(SUM(protein), 0)::float AS total_protein,
          COALESCE(SUM(carbs), 0)::float AS total_carbs,
          COALESCE(SUM(fat), 0)::float AS total_fat
        FROM logged_meals
        WHERE user_id = ${user.id}
          AND logged_date >= CURRENT_DATE - INTERVAL '7 days'
        GROUP BY logged_date
        ORDER BY logged_date ASC
      `,
      // H5. Daily records (last 7 days)
      sql`
        SELECT date::text AS date, weight::float AS weight, fitness_goal, tdee::int AS tdee, target_calories::int AS target_calories
        FROM daily_records
        WHERE user_id = ${user.id} AND date >= CURRENT_DATE - INTERVAL '7 days'
      `,
      // H6. Daily activities (last 7 days)
      sql`
        SELECT date::text AS date, COALESCE(SUM(calories), 0)::int AS calories
        FROM daily_activities
        WHERE user_id = ${user.id} AND date >= CURRENT_DATE - INTERVAL '7 days'
        GROUP BY date
      `,
      // H7. Daily targets (last 7 days)
      sql`
        SELECT logged_date::text AS date, target_calories::int AS target_calories
        FROM daily_targets
        WHERE user_id = ${user.id} AND logged_date >= CURRENT_DATE - INTERVAL '7 days'
      `,
      // H8. Weight logs (last 30 days)
      sql`
        SELECT date::text AS date, weight::float AS weight
        FROM daily_records
        WHERE user_id = ${user.id}
          AND date >= CURRENT_DATE - INTERVAL '30 days'
          AND weight IS NOT NULL
        ORDER BY date ASC
      `,
      // H9. Full user profile
      sql`
        SELECT * FROM users WHERE id = ${user.id} LIMIT 1
      `
    ]);

    // 3. Process Flat Workouts rows into nested structure
    const workoutsMap = {};
    for (const row of workoutsRows) {
      if (!workoutsMap[row.workout_id]) {
        workoutsMap[row.workout_id] = {
          id: row.workout_id,
          name: row.workout_name,
          date: row.workout_date,
          notes: row.workout_notes,
          completed: row.workout_completed,
          exercises: []
        };
      }

      if (row.exercise_id) {
        let exercise = workoutsMap[row.workout_id].exercises.find(e => e.id === row.exercise_id);
        if (!exercise) {
          exercise = {
            id: row.exercise_id,
            name: row.exercise_name,
            category: row.exercise_category,
            sets: []
          };
          workoutsMap[row.workout_id].exercises.push(exercise);
        }

        if (row.set_id) {
          exercise.sets.push({
            id: row.set_id,
            set_number: row.set_number,
            weight: parseFloat(row.weight),
            reps: row.reps,
            rpe: row.rpe,
            completed: row.set_completed
          });
        }
      }
    }
    const workouts = Object.values(workoutsMap).sort((a, b) => new Date(b.date) - new Date(a.date));

    // 4. Process Flat Templates rows into nested structure
    const templatesMap = {};
    for (const row of templatesRows) {
      if (!templatesMap[row.template_id]) {
        templatesMap[row.template_id] = {
          id: row.template_id,
          name: row.template_name,
          created_at: row.template_created_at,
          exercises: []
        };
      }

      if (row.exercise_id) {
        let parsedSets = [];
        try {
          parsedSets = row.exercise_sets ? JSON.parse(row.exercise_sets) : [];
        } catch (e) {
          parsedSets = [];
        }

        templatesMap[row.template_id].exercises.push({
          id: row.exercise_id,
          name: row.exercise_name,
          category: row.exercise_category,
          order_index: row.order_index,
          sets: parsedSets
        });
      }
    }
    const templates = Object.values(templatesMap).sort((a, b) => a.name.localeCompare(b.name));

    // 5. Process Analytics weekly trends
    const weeklyStats = {};
    for (let i = 7; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i * 7);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d.setDate(diff));
      const label = monday.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });
      weeklyStats[label] = { weekLabel: label, workoutsCount: 0, totalVolume: 0 };
    }

    recentWorkouts.forEach(w => {
      const workoutDate = new Date(w.date);
      const day = workoutDate.getDay();
      const diff = workoutDate.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(workoutDate.setDate(diff));
      const label = monday.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });
      
      if (weeklyStats[label]) {
        weeklyStats[label].workoutsCount += 1;
        weeklyStats[label].totalVolume += w.workout_volume;
      } else {
        weeklyStats[label] = {
          weekLabel: label,
          workoutsCount: 1,
          totalVolume: w.workout_volume
        };
      }
    });
    const weeklyTrend = Object.values(weeklyStats);

    // 6. Process Analytics nutrition trends
    const dailyRecordsMap = {};
    dailyRecords.forEach(r => {
      dailyRecordsMap[r.date] = r;
    });

    const dailyActivitiesMap = {};
    dailyActivities.forEach(a => {
      dailyActivitiesMap[a.date] = a;
    });

    const dailyTargetsMap = {};
    dailyTargets.forEach(t => {
      dailyTargetsMap[t.date] = t;
    });

    const fullUser = fullUserRow[0] || {};

    const nutritionTrend = [];
    const logMap = {};
    nutritionLogs.forEach(log => {
      logMap[log.logged_date] = log;
    });

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' });
      const log = logMap[dateString] || { total_calories: 0, total_protein: 0, total_carbs: 0, total_fat: 0 };
      
      const record = dailyRecordsMap[dateString];
      const activity = dailyActivitiesMap[dateString];
      const customTarget = dailyTargetsMap[dateString];

      const weight = (record && record.weight) ? parseFloat(record.weight) : (fullUser.weight ? parseFloat(fullUser.weight) : 70);
      const height = fullUser.height ? parseFloat(fullUser.height) : 170;
      const age = fullUser.age ? parseInt(fullUser.age) : 25;
      const gender = fullUser.gender || 'male';
      const fitnessGoal = (record && record.fitness_goal) ? record.fitness_goal : (fullUser.fitness_goal || 'maintenance');

      let bmr = (10 * weight) + (6.25 * height) - (5 * age);
      if (gender === 'male') bmr += 5;
      else bmr -= 161;

      const activeCalories = activity ? activity.calories : 0;
      const tdee = Math.round((bmr * 1.2) + activeCalories);

      let targetCalories = tdee;
      if (customTarget) {
        targetCalories = customTarget.target_calories;
      } else if (record && record.target_calories) {
        targetCalories = record.target_calories;
      } else {
        if (fitnessGoal === 'cutting') targetCalories = tdee - 500;
        else if (fitnessGoal === 'bulking') targetCalories = tdee + 500;
      }

      nutritionTrend.push({
        date: dateString,
        label: dayLabel,
        calories: Math.round(log.total_calories),
        protein: Math.round(log.total_protein),
        carbs: Math.round(log.total_carbs),
        fat: Math.round(log.total_fat),
        targetCalories: targetCalories,
        tdee: tdee
      });
    }

    // Process Weight trend for past 30 days
    const weightTrend = weightLogs.map(log => {
      const d = new Date(log.date);
      return {
        date: log.date,
        label: d.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' }),
        weight: log.weight
      };
    });

    // 7. Compile final response payload matching expected state interfaces
    return NextResponse.json({
      success: true,
      workouts,
      templates,
      foodLibrary: foodItems,
      activities,
      dailyTarget: dailyTargetRow[0] || null,
      loggedMeals: meals,
      images,
      analytics: {
        summary: {
          totalWorkouts: summaryStats[0]?.total_workouts || 0,
          totalSessions: summaryStats[0]?.total_sessions || 0,
          prsCount: prs.length
        },
        prs,
        weeklyTrend,
        nutritionTrend,
        weightTrend
      }
    });

  } catch (error) {
    console.error('Init data error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
