import { getDb } from '@/lib/db';
import { getSessionUserFromRequest } from '@/lib/auth';
import { sendFriendAcceptedEmail } from '@/lib/email';
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

  const result = db
    .prepare(
      `UPDATE friendships SET status='accepted', accepted_at=CURRENT_TIMESTAMP
       WHERE requester_id=? AND addressee_id=? AND status='pending'`
    )
    .run(other.id, me.id);

  if (result.changes === 0) {
    return NextResponse.json({ error: 'No pending request' }, { status: 404 });
  }

  if (other.email && other.notify_email) {
    sendFriendAcceptedEmail({
      to: other.email,
      accepterDisplay: me.display_name || me.username,
      accepterUsername: me.username,
    });
  }

  return NextResponse.json({ state: 'friends' });
}
