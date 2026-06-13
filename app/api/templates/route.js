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

    // Query templates
    const templates = await sql`
      SELECT id, name, created_at 
      FROM workout_templates 
      WHERE user_id = ${user.id}
      ORDER BY name ASC
    `;

    // Process each template to fetch nested exercises
    const result = [];
    for (const temp of templates) {
      const exercises = await sql`
        SELECT id, name, category, order_index, sets 
        FROM template_exercises 
        WHERE template_id = ${temp.id}
        ORDER BY order_index ASC
      `;
      
      const parsedExercises = exercises.map(ex => {
        let parsedSets = [];
        try {
          parsedSets = ex.sets ? JSON.parse(ex.sets) : [];
        } catch (e) {
          parsedSets = [];
        }
        return {
          id: ex.id,
          name: ex.name,
          category: ex.category,
          order_index: ex.order_index,
          sets: parsedSets
        };
      });

      result.push({
        ...temp,
        exercises: parsedExercises
      });
    }

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

    // Insert new exercises
    let index = 0;
    for (const ex of exercises) {
      if (!ex.name) continue;
      const setsStr = ex.sets ? JSON.stringify(ex.sets) : '[]';
      await sql`
        INSERT INTO template_exercises (template_id, name, category, order_index, sets)
        VALUES (${templateId}, ${ex.name.trim()}, ${ex.category || 'General'}, ${index}, ${setsStr})
      `;
      index++;
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
