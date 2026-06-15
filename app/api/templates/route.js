import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';

// GET: Retrieve all templates for the user with exercises
export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sql = await getDb();

    // Query templates and exercises in a single JOIN query to prevent fetch failed connection issues
    const rows = await sql`
      SELECT 
        t.id AS template_id, t.name AS template_name, t.created_at AS template_created_at,
        e.id AS exercise_id, e.name AS exercise_name, e.category AS exercise_category,
        e.order_index, e.sets AS exercise_sets
      FROM workout_templates t
      LEFT JOIN template_exercises e ON e.template_id = t.id
      WHERE t.user_id = ${user.id}
      ORDER BY t.name ASC, t.id DESC, e.order_index ASC, e.id ASC
    `;

    const templatesMap = {};
    for (const row of rows) {
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

    const result = Object.values(templatesMap).sort((a, b) => a.name.localeCompare(b.name));
    return NextResponse.json({ success: true, templates: result });
  } catch (error) {
    console.error('Fetch templates error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create or Update a workout template
export async function POST(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, name, exercises } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Nama program wajib diisi' }, { status: 400 });
    }

    if (!exercises || !Array.isArray(exercises) || exercises.length === 0) {
      return NextResponse.json({ error: 'Pilih minimal satu gerakan latihan' }, { status: 400 });
    }

    const sql = await getDb();
    let templateId = id;

    if (templateId) {
      // UPDATE: Verify ownership first
      const existing = await sql`
        SELECT id FROM workout_templates 
        WHERE id = ${templateId} AND user_id = ${user.id} 
        LIMIT 1
      `;
      if (existing.length === 0) {
        return NextResponse.json({ error: 'Template tidak ditemukan atau tidak berizin' }, { status: 404 });
      }

      // Update name
      await sql`
        UPDATE workout_templates 
        SET name = ${name.trim()} 
        WHERE id = ${templateId}
      `;

      // Clean existing exercises
      await sql`
        DELETE FROM template_exercises 
        WHERE template_id = ${templateId}
      `;
    } else {
      // INSERT: Create template
      const insertResult = await sql`
        INSERT INTO workout_templates (user_id, name)
        VALUES (${user.id}, ${name.trim()})
        RETURNING id
      `;
      templateId = insertResult[0].id;
    }

    // Bulk insert exercises using UNNEST to avoid N+1 query loop
    const validExercises = exercises.filter(ex => ex.name && ex.name.trim());
    if (validExercises.length > 0) {
      const names = validExercises.map(ex => ex.name.trim());
      const categories = validExercises.map(ex => ex.category || 'General');
      const orderIndexes = validExercises.map((_, i) => i);
      const sets = validExercises.map(ex => ex.sets ? JSON.stringify(ex.sets) : '[]');

      await sql`
        INSERT INTO template_exercises (template_id, name, category, order_index, sets)
        SELECT 
          ${templateId}, 
          u.name, 
          u.category, 
          u.order_index, 
          u.sets
        FROM UNNEST(
          ${names}::text[], 
          ${categories}::text[], 
          ${orderIndexes}::integer[], 
          ${sets}::text[]
        ) AS u(name, category, order_index, sets)
      `;
    }

    return NextResponse.json({ success: true, templateId });
  } catch (error) {
    console.error('Save template error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Delete a workout template
export async function DELETE(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID Program wajib diisi' }, { status: 400 });
    }

    const sql = await getDb();

    // Verify ownership and delete template
    const result = await sql`
      DELETE FROM workout_templates 
      WHERE id = ${id} AND user_id = ${user.id}
      RETURNING id
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Template tidak ditemukan atau tidak berizin' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Program latihan berhasil dihapus' });
  } catch (error) {
    console.error('Delete template error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
