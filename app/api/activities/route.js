import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';

async function syncDailyRecordTdee(sql, userId, dateStr) {
  const userRows = await sql`SELECT * FROM users WHERE id = ${userId} LIMIT 1`;
  if (userRows.length === 0) return;
  const fullUser = userRows[0];

  let weight;
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

  const activities = await sql`
    SELECT COALESCE(SUM(calories), 0)::int AS active_calories 
    FROM daily_activities 
    WHERE user_id = ${userId} AND date = ${dateStr}
  `;
  const activeCalories = activities[0]?.active_calories || 0;

  const height = fullUser.height ? parseFloat(fullUser.height) : 170;
  const age = fullUser.age ? parseInt(fullUser.age) : 25;
  const gender = fullUser.gender || 'male';
  const fitnessGoal = fullUser.fitness_goal || 'maintenance';

  let bmr = (10 * weight) + (6.25 * height) - (5 * age);
  if (gender === 'male') bmr += 5;
  else bmr -= 161;

  const tdee = Math.round((bmr * 1.2) + activeCalories);

  let targetCalories = tdee;
  if (fitnessGoal === 'cutting') {
    targetCalories = tdee - 500;
  } else if (fitnessGoal === 'bulking') {
    targetCalories = tdee + 500;
  }

  const weightToSave = (existingRecord.length > 0 && existingRecord[0].weight !== null) ? existingRecord[0].weight : null;

  await sql`
    INSERT INTO daily_records (user_id, date, weight, fitness_goal, tdee, target_calories)
    VALUES (${userId}, ${dateStr}, ${weightToSave}, ${fitnessGoal}, ${tdee}, ${targetCalories})
    ON CONFLICT (user_id, date)
    DO UPDATE SET
      tdee = EXCLUDED.tdee,
      target_calories = EXCLUDED.target_calories,
      fitness_goal = EXCLUDED.fitness_goal
  `;
}

// GET: Fetch all daily activities for the authenticated user
export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sql = await getDb();
    const activities = await sql`
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
    `;

    return NextResponse.json({ success: true, activities });
  } catch (error) {
    console.error('Fetch activities error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Add a new daily activity log
export async function POST(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { steps, calories, date } = body;

    const stepsVal = parseInt(steps) || 0;
    const caloriesVal = parseInt(calories) || 0;
    // Calculate distance (stride average is ~0.75m or 0.00075 km)
    const distanceVal = parseFloat((stepsVal * 0.00075).toFixed(2));
    const logDate = date || new Date().toISOString().split('T')[0];

    const sql = await getDb();

    // Check if an activity for this date already exists for the user
    // If it does, we can choose to add/update it or insert as a separate log.
    // Let's check and update to avoid cluttering, or just insert new ones.
    // Usually, updating step logs for the same day is standard.
    const existing = await sql`
      SELECT id, steps, calories FROM daily_activities 
      WHERE user_id = ${user.id} AND date = ${logDate}
      LIMIT 1
    `;

    let result;
    if (existing.length > 0) {
      // Update: add the steps and calories to the existing day's logs
      const newSteps = existing[0].steps + stepsVal;
      const newCalories = existing[0].calories + caloriesVal;
      const newDistance = parseFloat((newSteps * 0.00075).toFixed(2));

      result = await sql`
        UPDATE daily_activities
        SET steps = ${newSteps}, calories = ${newCalories}, distance = ${newDistance}
        WHERE id = ${existing[0].id}
        RETURNING id, date::text AS date, steps, calories, distance
      `;
    } else {
      // Insert new entry
      result = await sql`
        INSERT INTO daily_activities (user_id, date, steps, calories, distance)
        VALUES (${user.id}, ${logDate}, ${stepsVal}, ${caloriesVal}, ${distanceVal})
        RETURNING id, date::text AS date, steps, calories, distance
      `;
    }

    // Sync TDEE to daily_records
    await syncDailyRecordTdee(sql, user.id, logDate);

    return NextResponse.json({ success: true, activity: result[0] });
  } catch (error) {
    console.error('Save activity error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Delete an activity log entry
export async function DELETE(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Activity ID is required' }, { status: 400 });
    }

    const sql = await getDb();
    const result = await sql`
      DELETE FROM daily_activities
      WHERE id = ${id} AND user_id = ${user.id}
      RETURNING id, date::text AS date
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Activity not found or unauthorized' }, { status: 404 });
    }

    // Sync TDEE to daily_records
    await syncDailyRecordTdee(sql, user.id, result[0].date);

    return NextResponse.json({ success: true, message: 'Activity deleted successfully' });
  } catch (error) {
    console.error('Delete activity error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
