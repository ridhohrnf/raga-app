import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const sql = await getDb();
    const users = await sql`
      SELECT id, username, weight, height, age, gender, activity_level, fitness_goal, workout_program 
      FROM users 
      WHERE id = ${user.id} 
      LIMIT 1
    `;

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: users[0]
    });
  } catch (error) {
    console.error('Auth-Me error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { weight, height, age, gender, activity_level, fitness_goal, workout_program } = await request.json();
    const sql = await getDb();

    const result = await sql`
      UPDATE users 
      SET 
        weight = ${weight},
        height = ${height},
        age = ${age},
        gender = ${gender},
        activity_level = ${activity_level},
        fitness_goal = ${fitness_goal},
        workout_program = ${workout_program}
      WHERE id = ${user.id}
      RETURNING id, username, weight, height, age, gender, activity_level, fitness_goal, workout_program
    `;

    return NextResponse.json({
      success: true,
      user: result[0]
    });
  } catch (error) {
    console.error('Auth-Me update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
