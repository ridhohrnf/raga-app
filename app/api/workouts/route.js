import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';

// GET: Fetch all workouts for the authenticated user with nested exercises and sets
export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sql = await getDb();

    // Check if user has any workouts; if 0, seed a default workout (Thursday 18:00 - 20:00)
    const countResult = await sql`
      SELECT COUNT(id)::int AS count FROM workouts WHERE user_id = ${user.id}
    `;

    if (countResult[0].count === 0) {
      // Seeding a default workout on Thursday (June 4th, 2026) from 18:00 to 20:00
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
      
      console.log(`Successfully seeded default Thursday workout for user ${user.id}`);
    }

    // Query to pull all workouts, exercises, and sets in a single joined request
    const rows = await sql`
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
    `;

    // Process flat database rows into nested JSON structure
    const workoutsMap = {};
    for (const row of rows) {
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

    return NextResponse.json({ success: true, workouts });
  } catch (error) {
    console.error('Fetch workouts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Save a new workout session (or update if an ID is provided)
export async function POST(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, date, notes, completed, exercises } = body;

    if (!name) {
      return NextResponse.json({ error: 'Workout name is required' }, { status: 400 });
    }

    const sql = await getDb();
    let workoutId = id;

    if (workoutId) {
      // UPDATE: Existing Workout
      // First ensure the user owns the workout
      const existing = await sql`
        SELECT id FROM workouts WHERE id = ${workoutId} AND user_id = ${user.id} LIMIT 1
      `;
      if (existing.length === 0) {
        return NextResponse.json({ error: 'Workout not found or unauthorized' }, { status: 404 });
      }

      // Update workout details
      await sql`
        UPDATE workouts 
        SET name = ${name}, date = ${date || new Date()}, notes = ${notes || ''}, completed = ${completed || false}
        WHERE id = ${workoutId}
      `;

      // Simple sync approach: delete existing exercises and sets, then re-insert
      // This avoids complex differential sync logic.
      await sql`
        DELETE FROM exercises WHERE workout_id = ${workoutId}
      `;
    } else {
      // INSERT: New Workout
      const workoutResult = await sql`
        INSERT INTO workouts (user_id, name, date, notes, completed)
        VALUES (${user.id}, ${name}, ${date || new Date()}, ${notes || ''}, ${completed || false})
        RETURNING id
      `;
      workoutId = workoutResult[0].id;
    }

    // Insert Exercises and Sets
    if (exercises && Array.isArray(exercises)) {
      for (const ex of exercises) {
        if (!ex.name) continue;

        const exResult = await sql`
          INSERT INTO exercises (workout_id, name, category, notes)
          VALUES (${workoutId}, ${ex.name}, ${ex.category || 'General'}, ${ex.notes || ''})
          RETURNING id
        `;
        const exerciseId = exResult[0].id;

        if (ex.sets && Array.isArray(ex.sets)) {
          for (const set of ex.sets) {
            await sql`
              INSERT INTO sets (exercise_id, set_number, weight, reps, rpe, completed)
              VALUES (${exerciseId}, ${set.set_number}, ${set.weight || 0}, ${set.reps || 0}, ${set.rpe || null}, ${set.completed || false})
            `;
          }
        }
      }
    }

    return NextResponse.json({ success: true, workoutId });
  } catch (error) {
    console.error('Save workout error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Delete a workout session
export async function DELETE(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Workout ID is required' }, { status: 400 });
    }

    const sql = await getDb();

    // Verify ownership and delete
    const result = await sql`
      DELETE FROM workouts 
      WHERE id = ${id} AND user_id = ${user.id}
      RETURNING id
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Workout not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Workout deleted successfully' });
  } catch (error) {
    console.error('Delete workout error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
