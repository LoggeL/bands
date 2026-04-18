import { getDb } from '@/lib/db';
import { getSessionUserFromRequest } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import type { User } from '@/lib/db';

export async function POST(req: NextRequest) {
  const me = getSessionUserFromRequest(req);
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { username } = (await req.json()) as { username?: string };
  if (!username) return NextResponse.json({ error: 'Missing username' }, { status: 400 });

  const db = getDb();
  const other = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as User | undefined;
  if (!other) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  db.prepare(
    `DELETE FROM friendships WHERE requester_id=? AND addressee_id=? AND status='pending'`
  ).run(other.id, me.id);

  return NextResponse.json({ state: 'none' });
}
