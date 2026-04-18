import { getDb } from '@/lib/db';
import { getSessionUserFromRequest } from '@/lib/auth';
import { friendState } from '@/lib/queries';
import { sendFriendRequestEmail, sendFriendAcceptedEmail } from '@/lib/email';
import { NextRequest, NextResponse } from 'next/server';
import type { User } from '@/lib/db';

/** POST /api/friends — send friend request to { username }. */
export async function POST(req: NextRequest) {
  const me = getSessionUserFromRequest(req);
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { username } = (await req.json()) as { username?: string };
  if (!username) return NextResponse.json({ error: 'Missing username' }, { status: 400 });

  const db = getDb();
  const target = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as User | undefined;
  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  if (target.id === me.id) return NextResponse.json({ error: 'Cannot friend yourself' }, { status: 400 });

  const current = friendState(me.id, target.id);

  if (current === 'friends') {
    return NextResponse.json({ state: 'friends' });
  }

  if (current === 'incoming_pending') {
    // They already asked us; a POST from us treats as accept.
    db.prepare(
      `UPDATE friendships SET status='accepted', accepted_at=CURRENT_TIMESTAMP
       WHERE requester_id=? AND addressee_id=?`
    ).run(target.id, me.id);

    if (target.email && target.notify_email) {
      sendFriendAcceptedEmail({
        to: target.email,
        accepterDisplay: me.display_name || me.username,
        accepterUsername: me.username,
      });
    }
    return NextResponse.json({ state: 'friends' });
  }

  if (current === 'outgoing_pending') {
    return NextResponse.json({ state: 'outgoing_pending' });
  }

  db.prepare(
    `INSERT INTO friendships (requester_id, addressee_id, status) VALUES (?, ?, 'pending')`
  ).run(me.id, target.id);

  if (target.email && target.notify_email) {
    sendFriendRequestEmail({
      to: target.email,
      requesterDisplay: me.display_name || me.username,
      requesterUsername: me.username,
    });
  }

  return NextResponse.json({ state: 'outgoing_pending' });
}

/** DELETE /api/friends — cancel outgoing request OR unfriend accepted. */
export async function DELETE(req: NextRequest) {
  const me = getSessionUserFromRequest(req);
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { username } = (await req.json()) as { username?: string };
  if (!username) return NextResponse.json({ error: 'Missing username' }, { status: 400 });

  const db = getDb();
  const target = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as User | undefined;
  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  db.prepare(
    `DELETE FROM friendships
     WHERE (requester_id=? AND addressee_id=?) OR (requester_id=? AND addressee_id=?)`
  ).run(me.id, target.id, target.id, me.id);

  return NextResponse.json({ state: 'none' });
}
