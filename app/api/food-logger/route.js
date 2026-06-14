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
    const meals = await sql`
      SELECT * FROM logged_meals 
      WHERE user_id = ${user.id} AND logged_date = ${dateStr}
      ORDER BY created_at DESC
    `;

    return NextResponse.json({ success: true, meals });
  } catch (error) {
    console.error('Food logger GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { food_name, weight_g, calories, protein, carbs, fat, date, image_data, meal_time } = await request.json();

    if (!food_name || !weight_g) {
      return NextResponse.json({ error: 'Nama makanan dan berat wajib diisi' }, { status: 400 });
    }

    const dateStr = date || new Date().toISOString().split('T')[0];

    const sql = await getDb();
    const result = await sql`
      INSERT INTO logged_meals (user_id, food_name, weight_g, calories, protein, carbs, fat, logged_date, image_data, meal_time)
      VALUES (${user.id}, ${food_name.trim()}, ${weight_g}, ${calories || 0}, ${protein || 0}, ${carbs || 0}, ${fat || 0}, ${dateStr}, ${image_data || null}, ${meal_time || 'Camilan'})
      RETURNING *
    `;

    return NextResponse.json({ success: true, meal: result[0] });
  } catch (error) {
    console.error('Food logger POST error:', error);
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
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID makanan wajib diisi' }, { status: 400 });
    }

    const sql = await getDb();
    const result = await sql`
      DELETE FROM logged_meals 
      WHERE id = ${id} AND user_id = ${user.id}
      RETURNING id
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Catatan makanan tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Catatan makanan berhasil dihapus.' });
  } catch (error) {
    console.error('Food logger DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, weight_g, calories, protein, carbs, fat, meal_time } = await request.json();

    if (!id || !weight_g) {
      return NextResponse.json({ error: 'ID makanan dan berat wajib diisi' }, { status: 400 });
    }

    const sql = await getDb();
    const result = await sql`
      UPDATE logged_meals 
      SET weight_g = ${weight_g}, 
          calories = ${calories || 0}, 
          protein = ${protein || 0}, 
          carbs = ${carbs || 0}, 
          fat = ${fat || 0},
          meal_time = ${meal_time || 'Camilan'}
      WHERE id = ${id} AND user_id = ${user.id}
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Catatan makanan tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, meal: result[0] });
  } catch (error) {
    console.error('Food logger PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

