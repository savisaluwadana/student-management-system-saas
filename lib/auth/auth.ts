import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function getJwtSecret(): string | null {
  return process.env.JWT_SECRET || null;
}

export interface JWTPayload {
  id: string;
  email: string;
  role: 'admin' | 'teacher';
  full_name: string;
}

/**
 * Sign a JWT token for a user
 */
export function signToken(payload: JWTPayload): string {
  const secret = getJwtSecret();
  if (!secret) {
    throw new Error('Server misconfiguration: JWT_SECRET is not set');
  }
  return jwt.sign(payload, secret, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
}

/**
 * Verify a JWT token and return the payload, or null if invalid
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const secret = getJwtSecret();
    if (!secret) return null;
    return jwt.verify(token, secret) as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * Get the current user from the auth_token cookie (Server Components / Server Actions)
 */
export async function getCurrentUser(): Promise<JWTPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}

/**
 * Get the auth token from the cookie store
 */
export async function getToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    return cookieStore.get('auth_token')?.value || null;
  } catch {
    return null;
  }
}
