import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sql = await getDb();
    // Fetch both global food items (user_id IS NULL) and user-specific food items
    const items = await sql`
      SELECT * FROM food_items 
      WHERE user_id IS NULL OR user_id = ${user.id} 
      ORDER BY user_id DESC, name ASC
    `;

    return NextResponse.json({ success: true, items });
  } catch (error) {
    console.error('Food library GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, calories, protein, carbs, fat, serving_g } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Nama makanan wajib diisi' }, { status: 400 });
    }

    const sql = await getDb();

    // Check if food already exists for this user (or globally)
    const existing = await sql`
      SELECT id FROM food_items 
      WHERE (user_id = ${user.id} OR user_id IS NULL) AND LOWER(name) = LOWER(${name.trim()})
      LIMIT 1
    `;

    if (existing.length > 0) {
      return NextResponse.json({ error: 'Makanan dengan nama ini sudah ada di pustaka Anda.' }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO food_items (user_id, name, calories, protein, carbs, fat, serving_g)
      VALUES (${user.id}, ${name.trim()}, ${calories || 0}, ${protein || 0}, ${carbs || 0}, ${fat || 0}, ${serving_g || 100})
      RETURNING *
    `;

    return NextResponse.json({ success: true, item: result[0] });
  } catch (error) {
    console.error('Food library POST error:', error);
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

    // Ensure user only deletes their own items, not global ones
    const result = await sql`
      DELETE FROM food_items 
      WHERE id = ${id} AND user_id = ${user.id}
      RETURNING id
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Makanan tidak ditemukan atau tidak dapat dihapus.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Makanan berhasil dihapus dari pustaka.' });
  } catch (error) {
    console.error('Food library DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
