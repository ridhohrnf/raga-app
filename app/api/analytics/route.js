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
    const exercise = searchParams.get('exercise');

    const sql = await getDb();

    if (exercise) {
      // 1. ANALSIS SPESIFIK GERAKAN (Untuk Chart Grafik Progress per Gerakan)
      const history = await sql`
        SELECT 
          w.date,
          MAX(s.weight)::float AS max_weight,
          COUNT(s.id)::int AS total_volume,
          MAX(s.reps)::int AS max_reps,
          MAX(s.weight * (1 + s.reps::numeric / 30.0))::float AS max_est_1rm
        FROM sets s
        JOIN exercises e ON s.exercise_id = e.id
        JOIN workouts w ON e.workout_id = w.id
        WHERE w.user_id = ${user.id} 
          AND LOWER(e.name) = LOWER(${exercise.trim()})
          AND s.completed = TRUE
          AND w.completed = TRUE
        GROUP BY w.date, w.id
        ORDER BY w.date ASC
      `;

      // Get last workout for comparative analysis (Progressive Overload helper)
      // To see if there's overload, we can compare the last two sessions
      let progressiveOverload = { status: 'neutral', message: 'Latihan pertama terdeteksi.' };
      if (history.length >= 2) {
        const current = history[history.length - 1];
        const previous = history[history.length - 2];
        
        const weightDiff = current.max_weight - previous.max_weight;
        const volumeDiff = current.total_volume - previous.total_volume;
        const est1rmDiff = current.max_est_1rm - previous.max_est_1rm;

        if (weightDiff > 0 || volumeDiff > 0 || est1rmDiff > 0) {
          let msgParts = [];
          if (weightDiff > 0) msgParts.push(`Beban Naik (+${weightDiff.toFixed(1)} kg)`);
          if (volumeDiff > 0) msgParts.push(`Volume Naik (+${volumeDiff.toFixed(0)} kg)`);
          
          progressiveOverload = {
            status: 'overloaded',
            message: `🔥 Progressive Overload! ${msgParts.join(', ')} dibanding sesi sebelumnya.`
          };
        } else {
          progressiveOverload = {
            status: 'maintained',
            message: 'Beban/Volume sama dengan sesi sebelumnya. Pertahankan konsistensi!'
          };
        }
      }

      return NextResponse.json({
        success: true,
        exercise,
        history,
        progressiveOverload
      });
    } else {
      // 2. ANALISIS GLOBAL (Dashboard Overview)
      
      // A. Ambil semua PR (Personal Record) per gerakan
      const prs = await sql`
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
      `;

      // B. Ambil volume (jumlah set selesai) & frekuensi per minggu (12 minggu terakhir)
      const recentWorkouts = await sql`
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
      `;

      // Kelompokkan data ke dalam format mingguan di sisi server
      const weeklyStats = {};
      
      // Inisialisasi 8 minggu terakhir agar grafik tidak kosong
      for (let i = 7; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i * 7);
        // Mendapatkan awal minggu (Senin)
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
          // Jika di luar inisialisasi awal tapi masih dalam 12 minggu
          weeklyStats[label] = {
            weekLabel: label,
            workoutsCount: 1,
            totalVolume: w.workout_volume
          };
        }
      });

      const weeklyTrend = Object.values(weeklyStats);

      // C. Ringkasan umum
      const summaryStats = await sql`
        SELECT 
          COUNT(id) FILTER (WHERE completed = TRUE)::int AS total_workouts,
          COUNT(id)::int AS total_sessions
        FROM workouts 
        WHERE user_id = ${user.id}
      `;

      // D. Tren Nutrisi (7 Hari Terakhir)
      const nutritionLogs = await sql`
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
      `;

      // Get daily records for the 7 days range to calculate dynamic limits
      const dailyRecords = await sql`
        SELECT date::text AS date, weight::float AS weight, fitness_goal, tdee::int AS tdee, target_calories::int AS target_calories
        FROM daily_records
        WHERE user_id = ${user.id} AND date >= CURRENT_DATE - INTERVAL '7 days'
      `;
      const dailyRecordsMap = {};
      dailyRecords.forEach(r => {
        dailyRecordsMap[r.date] = r;
      });

      // Get daily activities for the 7 days range
      const dailyActivities = await sql`
        SELECT date::text AS date, COALESCE(SUM(calories), 0)::int AS calories
        FROM daily_activities
        WHERE user_id = ${user.id} AND date >= CURRENT_DATE - INTERVAL '7 days'
        GROUP BY date
      `;
      const dailyActivitiesMap = {};
      dailyActivities.forEach(a => {
        dailyActivitiesMap[a.date] = a;
      });

      // Get custom daily targets for the 7 days range
      const dailyTargets = await sql`
        SELECT logged_date::text AS date, target_calories::int AS target_calories
        FROM daily_targets
        WHERE user_id = ${user.id} AND logged_date >= CURRENT_DATE - INTERVAL '7 days'
      `;
      const dailyTargetsMap = {};
      dailyTargets.forEach(t => {
        dailyTargetsMap[t.date] = t;
      });

      // Get user profile fallback settings
      const userRows = await sql`SELECT * FROM users WHERE id = ${user.id} LIMIT 1`;
      const fullUser = userRows[0] || {};

      // Buat data untuk 7 hari terakhir secara berurutan
      const nutritionTrend = [];
      const logMap = {};
      nutritionLogs.forEach(log => {
        logMap[log.logged_date] = log;
      });

      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayLabel = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' });
        
        const log = logMap[dateStr] || { total_calories: 0, total_protein: 0, total_carbs: 0, total_fat: 0 };
        
        // Dynamic target calories calculation for the day
        const record = dailyRecordsMap[dateStr];
        const activity = dailyActivitiesMap[dateStr];
        const customTarget = dailyTargetsMap[dateStr];

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
          date: dateStr,
          label: dayLabel,
          calories: Math.round(log.total_calories),
          protein: Math.round(log.total_protein),
          carbs: Math.round(log.total_carbs),
          fat: Math.round(log.total_fat),
          targetCalories: targetCalories,
          tdee: tdee
        });
      }

      // E. Tren Berat Badan (30 Hari Terakhir)
      const weightLogs = await sql`
        SELECT 
          date::text AS logged_date,
          weight::float AS weight,
          body_fat::float AS body_fat
        FROM daily_records
        WHERE user_id = ${user.id}
          AND date >= CURRENT_DATE - INTERVAL '30 days'
          AND (weight IS NOT NULL OR body_fat IS NOT NULL)
        ORDER BY date ASC
      `;

      const weightTrend = weightLogs.map(log => {
        const d = new Date(log.logged_date);
        return {
          date: log.logged_date,
          label: d.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' }),
          weight: log.weight,
          bodyFat: log.body_fat !== null ? parseFloat(log.body_fat) : null
        };
      });

      return NextResponse.json({
        success: true,
        summary: {
          totalWorkouts: summaryStats[0]?.total_workouts || 0,
          totalSessions: summaryStats[0]?.total_sessions || 0,
          prsCount: prs.length
        },
        prs,
        weeklyTrend,
        nutritionTrend,
        weightTrend
      });
    }
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
