import { getDb } from '@/lib/db';
import { verifyPassword, createSession, buildSessionCookie } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import type { User } from '@/lib/db';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { username, password } = body as { username?: string; password?: string };

  if (!username || !password) {
    return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
  }

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as User | undefined;

  if (!user || !user.password_hash || !verifyPassword(password, user.password_hash)) {
    return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
  }

  const token = createSession(user.id);

  return NextResponse.json(
    { ok: true, username: user.username },
    {
      status: 200,
      headers: { 'Set-Cookie': buildSessionCookie(token) },
    }
  );
}
