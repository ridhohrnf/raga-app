import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function POST(request) {
  try {
    const { token, newPassword } = await request.json();

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: 'Token dan password baru wajib diisi' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password baru minimal harus 6 karakter' },
        { status: 400 }
      );
    }

    const sql = await getDb();

    // Check if token is valid and not expired
    const resets = await sql`
      SELECT * FROM password_resets 
      WHERE token = ${token} AND expires_at > NOW() 
      LIMIT 1
    `;

    if (resets.length === 0) {
      return NextResponse.json(
        { error: 'Token reset tidak valid atau sudah kedaluwarsa' },
        { status: 400 }
      );
    }

    const resetInfo = resets[0];
    const hashedPassword = hashPassword(newPassword);

    // Update the password in users table
    await sql`
      UPDATE users 
      SET password = ${hashedPassword} 
      WHERE id = ${resetInfo.user_id}
    `;

    // Delete the token so it cannot be reused
    await sql`
      DELETE FROM password_resets WHERE id = ${resetInfo.id}
    `;

    return NextResponse.json({
      success: true,
      message: 'Password berhasil diperbarui. Silakan login kembali.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server internal' },
      { status: 500 }
    );
  }
}
