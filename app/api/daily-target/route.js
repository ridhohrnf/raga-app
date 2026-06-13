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
    const dateStr = searchParams.get('date');

    if (!dateStr) {
      return NextResponse.json({ error: 'Tanggal wajib diisi' }, { status: 400 });
    }

    const sql = await getDb();
    const result = await sql`
      SELECT * FROM daily_targets 
      WHERE user_id = ${user.id} AND logged_date = ${dateStr}
    `;

    return NextResponse.json({ success: true, target: result[0] || null });
  } catch (error) {
    console.error('Daily target GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { date, target_calories, target_protein, target_carbs, target_fat } = await request.json();

    if (!date || !target_calories) {
      return NextResponse.json({ error: 'Tanggal dan target kalori wajib diisi' }, { status: 400 });
    }

    const sql = await getDb();

    // Default calculations if macros are not sent
    let protein = target_protein;
    let carbs = target_carbs;
    let fat = target_fat;

    if (protein === undefined || carbs === undefined || fat === undefined) {
      const weight = user.weight ? parseFloat(user.weight) : 70; // fallback weight
      protein = Math.round(weight * 2.0);
      fat = Math.round(weight * 1.0);
      const remaining = Math.max(0, target_calories - (protein * 4) - (fat * 9));
      carbs = Math.round(remaining / 4);
    }

    const result = await sql`
      INSERT INTO daily_targets (user_id, logged_date, target_calories, target_protein, target_carbs, target_fat)
      VALUES (${user.id}, ${date}, ${target_calories}, ${protein}, ${carbs}, ${fat})
      ON CONFLICT (user_id, logged_date) 
      DO UPDATE SET 
        target_calories = EXCLUDED.target_calories,
        target_protein = EXCLUDED.target_protein,
        target_carbs = EXCLUDED.target_carbs,
        target_fat = EXCLUDED.target_fat
      RETURNING *
    `;

    return NextResponse.json({ success: true, target: result[0] });
  } catch (error) {
    console.error('Daily target POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request) {
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
    await sql`
      DELETE FROM daily_targets 
      WHERE user_id = ${user.id} AND logged_date = ${dateStr}
    `;

    return NextResponse.json({ success: true, message: 'Target harian berhasil direset.' });
  } catch (error) {
    console.error('Daily target DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
