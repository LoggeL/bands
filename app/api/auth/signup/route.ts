import { getDb } from '@/lib/db';
import { hashPassword, createSession, buildSessionCookie } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { username, display_name, password } = body as {
    username?: string;
    display_name?: string;
    password?: string;
  };

  if (!username || !password) {
    return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
  }

  if (username.length < 2 || username.length > 32) {
    return NextResponse.json({ error: 'Username must be 2–32 characters' }, { status: 400 });
  }

  if (!/^[a-z0-9_-]+$/.test(username)) {
    return NextResponse.json(
      { error: 'Username may only contain lowercase letters, numbers, hyphens, and underscores' },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
  }

  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
  }

  const passwordHash = hashPassword(password);
  const result = db
    .prepare(
      'INSERT INTO users (username, display_name, password_hash) VALUES (?, ?, ?)'
    )
    .run(username, display_name?.trim() || null, passwordHash);

  const userId = result.lastInsertRowid as number;
  const token = createSession(userId);

  return NextResponse.json(
    { ok: true, username },
    {
      status: 201,
      headers: { 'Set-Cookie': buildSessionCookie(token) },
    }
  );
}
