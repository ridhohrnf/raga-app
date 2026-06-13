import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-super-secret-key-12345';

export function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

export function comparePassword(password, hashedPassword) {
  return bcrypt.compareSync(password, hashedPassword);
}

export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Extracts and verifies JWT token from request cookies.
 * Works inside Next.js Route Handlers.
 */
export async function getAuthenticatedUser(request) {
  const cookieHeader = request.headers.get('cookie') || '';
  const tokenCookie = cookieHeader
    .split(';')
    .find(c => c.trim().startsWith('session_token='));
    
  if (!tokenCookie) return null;
  
  const token = tokenCookie.split('=')[1];
  if (!token) return null;
  
  const decoded = verifyToken(token);
  return decoded; // returns { id, username }
}
