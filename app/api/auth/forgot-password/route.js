import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import crypto from 'crypto';

export async function POST(request) {
  try {
    const { username } = await request.json();

    if (!username) {
      return NextResponse.json(
        { error: 'Username wajib diisi' },
        { status: 400 }
      );
    }

    const trimmedUsername = username.trim().toLowerCase();
    const sql = await getDb();

    // Fetch user by username
    const users = await sql`
      SELECT id, username FROM users WHERE username = ${trimmedUsername} LIMIT 1
    `;

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'Username tidak ditemukan' },
        { status: 404 }
      );
    }

    const user = users[0];

    // Generate token and expiration time (15 minutes from now)
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Delete any existing tokens for this user to avoid clutter
    await sql`
      DELETE FROM password_resets WHERE user_id = ${user.id}
    `;

    // Insert new token
    await sql`
      INSERT INTO password_resets (user_id, token, expires_at)
      VALUES (${user.id}, ${token}, ${expiresAt})
    `;

    return NextResponse.json({
      success: true,
      message: 'Simulasi: Tautan reset password berhasil dibuat.',
      token,
      username: user.username
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server internal' },
      { status: 500 }
    );
  }
}
