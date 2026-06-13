import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { hashPassword, generateToken } from '@/lib/auth';

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const trimmedUsername = username.trim().toLowerCase();
    if (trimmedUsername.length < 3) {
      return NextResponse.json(
        { error: 'Username must be at least 3 characters long' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    const sql = await getDb();

    // Check if username already exists
    const existingUsers = await sql`
      SELECT id FROM users WHERE username = ${trimmedUsername} LIMIT 1
    `;

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { error: 'Username already taken' },
        { status: 400 }
      );
    }

    // Hash password and insert user
    const hashedPassword = hashPassword(password);
    const result = await sql`
      INSERT INTO users (username, password)
      VALUES (${trimmedUsername}, ${hashedPassword})
      RETURNING id, username
    `;

    const user = result[0];

    // Generate JWT token
    const token = generateToken({ id: user.id, username: user.username });

    // Set cookie
    const response = NextResponse.json(
      { success: true, user: { id: user.id, username: user.username } },
      { status: 201 }
    );

    response.headers.set(
      'Set-Cookie',
      `session_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}`
    );

    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
