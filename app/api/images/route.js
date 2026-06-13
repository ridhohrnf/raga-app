import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';

// GET: Fetch all progress photos for the authenticated user
export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sql = await getDb();
    const images = await sql`
      SELECT id, notes, created_at, image_data
      FROM progress_images
      WHERE user_id = ${user.id}
      ORDER BY created_at DESC
    `;

    return NextResponse.json({ success: true, images });
  } catch (error) {
    console.error('Fetch progress images error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Save a new progress photo (Base64 string)
export async function POST(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { image_data, notes } = await request.json();

    if (!image_data) {
      return NextResponse.json({ error: 'Image data is required' }, { status: 400 });
    }

    // Quick validation of Base64 format
    if (!image_data.startsWith('data:image/')) {
      return NextResponse.json({ error: 'Invalid image format. Must be base64 data URL.' }, { status: 400 });
    }

    const sql = await getDb();
    const result = await sql`
      INSERT INTO progress_images (user_id, image_data, notes)
      VALUES (${user.id}, ${image_data}, ${notes || ''})
      RETURNING id, created_at
    `;

    return NextResponse.json({
      success: true,
      image: {
        id: result[0].id,
        created_at: result[0].created_at,
        notes: notes || ''
      }
    });
  } catch (error) {
    console.error('Upload progress image error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Delete a progress photo
export async function DELETE(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Image ID is required' }, { status: 400 });
    }

    const sql = await getDb();

    // Verify ownership and delete
    const result = await sql`
      DELETE FROM progress_images 
      WHERE id = ${id} AND user_id = ${user.id}
      RETURNING id
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Image not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Delete progress image error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
