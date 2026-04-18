import { getDb } from '@/lib/db';
import { getSessionUserFromRequest } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import type { Visibility } from '@/lib/db';

const ALLOWED_VISIBILITY: readonly Visibility[] = ['public', 'friends', 'private'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function PATCH(req: NextRequest) {
  const me = getSessionUserFromRequest(req);
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await req.json()) as {
    display_name?: string;
    bio?: string;
    visibility?: Visibility;
    email?: string | null;
    notify_email?: boolean;
  };

  const sets: string[] = [];
  const vals: (string | number | null)[] = [];

  if ('display_name' in body) {
    sets.push('display_name = ?');
    vals.push(body.display_name?.trim() || null);
  }
  if ('bio' in body) {
    sets.push('bio = ?');
    vals.push(body.bio?.trim() || null);
  }
  if ('visibility' in body) {
    if (!body.visibility || !ALLOWED_VISIBILITY.includes(body.visibility)) {
      return NextResponse.json({ error: 'Invalid visibility' }, { status: 400 });
    }
    sets.push('visibility = ?');
    vals.push(body.visibility);
  }
  if ('email' in body) {
    const normalized = body.email?.trim().toLowerCase() || null;
    if (normalized && !EMAIL_RE.test(normalized)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }
    if (normalized) {
      const db = getDb();
      const taken = db
        .prepare('SELECT id FROM users WHERE email = ? AND id != ?')
        .get(normalized, me.id);
      if (taken) return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
    }
    sets.push('email = ?');
    vals.push(normalized);
  }
  if ('notify_email' in body) {
    sets.push('notify_email = ?');
    vals.push(body.notify_email ? 1 : 0);
  }

  if (sets.length === 0) {
    return NextResponse.json({ error: 'No fields' }, { status: 400 });
  }

  const db = getDb();
  db.prepare(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`).run(...vals, me.id);

  return NextResponse.json({ ok: true });
}
