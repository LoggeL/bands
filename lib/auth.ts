import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { getDb } from './db';
import type { User } from './db';

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 12);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function createSession(userId: number): string {
  const token = randomBytes(32).toString('hex');
  const db = getDb();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  db.prepare(
    'INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)'
  ).run(userId, token, expiresAt);
  return token;
}

export function deleteSession(token: string): void {
  const db = getDb();
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

export function getUserByToken(token: string): User | null {
  if (!token) return null;
  const db = getDb();
  const session = db.prepare(
    `SELECT user_id FROM sessions WHERE token = ? AND expires_at > datetime('now')`
  ).get(token) as { user_id: number } | undefined;
  if (!session) return null;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(session.user_id) as User | undefined;
  return user ?? null;
}

/** Parse a cookie header string and return the value for a given key. */
function parseCookieHeader(header: string, key: string): string | undefined {
  for (const part of header.split(';')) {
    const [k, ...rest] = part.trim().split('=');
    if (k.trim() === key) return decodeURIComponent(rest.join('='));
  }
  return undefined;
}

/** Read session user from a Next.js API Request (reads cookie header directly). */
export function getSessionUserFromRequest(req: Request): User | null {
  const cookieHeader = req.headers.get('cookie') || '';
  const token = parseCookieHeader(cookieHeader, 'session-token');
  if (!token) return null;
  return getUserByToken(token);
}

/** Build a Set-Cookie header value for the session token. */
export function buildSessionCookie(token: string): string {
  const maxAge = 30 * 24 * 60 * 60; // 30 days in seconds
  return `session-token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;
}

/** Build a Set-Cookie header that clears the session cookie. */
export function clearSessionCookie(): string {
  return `session-token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
