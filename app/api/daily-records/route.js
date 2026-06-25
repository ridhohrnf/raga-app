import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';

// Helper function to calculate BMR, TDEE, and targets
async function calculateDailyMetrics(sql, userId, fullUser, dateStr, specificWeight = null) {
  // 1. Get the weight to use (specificWeight logged, or fallback to existing daily_records.weight, or user profile weight)
  let weight = specificWeight;
  
  if (weight === null || weight === undefined) {
    const existingRecord = await sql`
      SELECT weight FROM daily_records 
      WHERE user_id = ${userId} AND date = ${dateStr}
      LIMIT 1
    `;
    if (existingRecord.length > 0 && existingRecord[0].weight !== null) {
      weight = parseFloat(existingRecord[0].weight);
    } else {
      weight = fullUser.weight ? parseFloat(fullUser.weight) : 70;
    }
  }

  // 2. Fetch the sum of logged daily activities calories for this date
  const activities = await sql`
    SELECT COALESCE(SUM(calories), 0)::int AS active_calories 
    FROM daily_activities 
    WHERE user_id = ${userId} AND date = ${dateStr}
  `;
  const activeCalories = activities[0]?.active_calories || 0;

  // 3. Calculate BMR
  const height = fullUser.height ? parseFloat(fullUser.height) : 170;
  const age = fullUser.age ? parseInt(fullUser.age) : 25;
  const gender = fullUser.gender || 'male';
  const fitnessGoal = fullUser.fitness_goal || 'maintenance';

  let bmr = (10 * weight) + (6.25 * height) - (5 * age);
  if (gender === 'male') {
    bmr += 5;
  } else {
    bmr -= 161;
  }

  // 4. Calculate dynamic TDEE (Base TDEE is sedentary 1.2 + logged active calories)
  const tdee = Math.round((bmr * 1.2) + activeCalories);

  // 5. Calculate Target Calories based on Fitness Goal
  let targetCalories = tdee;
  if (fitnessGoal === 'cutting') {
    targetCalories = tdee - 500;
  } else if (fitnessGoal === 'bulking') {
    targetCalories = tdee + 500;
  }

  return {
    weight,
    fitnessGoal,
    tdee,
    targetCalories
  };
}

// GET: Fetch daily records for the authenticated user and specified date
export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get('date');

    if (!dateStr) {
      return NextResponse.json({ error: 'Tanggal wajib diisi' }, { status: 400 });
    }

    const sql = await getDb();
    
    // Fetch direct database record
    const records = await sql`
      SELECT 
        id, 
        date::text AS date, 
        weight::float AS weight, 
        body_fat::float AS body_fat,
        neck::float AS neck,
        waist::float AS waist,
        hip::float AS hip,
        fitness_goal, 
        tdee::int AS tdee, 
        target_calories::int AS target_calories
      FROM daily_records
      WHERE user_id = ${user.id} AND date = ${dateStr}
      LIMIT 1
    `;

    if (records.length > 0) {
      return NextResponse.json({ success: true, record: records[0] });
    }

    // Fallback: If no record in DB, calculate dynamic defaults on the fly
    const userRows = await sql`SELECT * FROM users WHERE id = ${user.id} LIMIT 1`;
    if (userRows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const metrics = await calculateDailyMetrics(sql, user.id, userRows[0], dateStr);

    return NextResponse.json({
      success: true,
      record: {
        id: null,
        date: dateStr,
        weight: null,
        body_fat: null,
        neck: null,
        waist: null,
        hip: null,
        fitness_goal: metrics.fitnessGoal,
        tdee: metrics.tdee,
        target_calories: metrics.targetCalories
      }
    });

  } catch (error) {
    console.error('Fetch daily record error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Add or update daily weight (recalculates and stores TDEE/target)
export async function POST(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { date, weight, body_fat, bodyFat, neck, waist, hip } = body;

    if (!date) {
      return NextResponse.json({ error: 'Tanggal wajib diisi' }, { status: 400 });
    }

    const parsedWeight = weight ? parseFloat(weight) : null;
    const rawBodyFat = body_fat !== undefined ? body_fat : bodyFat;
    const parsedBodyFat = rawBodyFat ? parseFloat(rawBodyFat) : null;
    const parsedNeck = neck ? parseFloat(neck) : null;
    const parsedWaist = waist ? parseFloat(waist) : null;
    const parsedHip = hip ? parseFloat(hip) : null;
    const sql = await getDb();

    // Fetch user details
    const userRows = await sql`SELECT * FROM users WHERE id = ${user.id} LIMIT 1`;
    if (userRows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const metrics = await calculateDailyMetrics(sql, user.id, userRows[0], date, parsedWeight);

    // Upsert daily_records
    const result = await sql`
      INSERT INTO daily_records (user_id, date, weight, body_fat, neck, waist, hip, fitness_goal, tdee, target_calories)
      VALUES (${user.id}, ${date}, ${parsedWeight}, ${parsedBodyFat}, ${parsedNeck}, ${parsedWaist}, ${parsedHip}, ${metrics.fitnessGoal}, ${metrics.tdee}, ${metrics.targetCalories})
      ON CONFLICT (user_id, date)
      DO UPDATE SET
        weight = EXCLUDED.weight,
        body_fat = EXCLUDED.body_fat,
        neck = EXCLUDED.neck,
        waist = EXCLUDED.waist,
        hip = EXCLUDED.hip,
        fitness_goal = EXCLUDED.fitness_goal,
        tdee = EXCLUDED.tdee,
        target_calories = EXCLUDED.target_calories
      RETURNING id, date::text AS date, weight::float AS weight, body_fat::float AS body_fat, neck::float AS neck, waist::float AS waist, hip::float AS hip, fitness_goal, tdee::int AS tdee, target_calories::int AS target_calories
    `;

    return NextResponse.json({ success: true, record: result[0] });

  } catch (error) {
    console.error('Save daily record error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
