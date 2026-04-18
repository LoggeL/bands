import { createHash } from 'crypto';
import { getDb } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { token, password } = (await req.json()) as { token?: string; password?: string };
  if (!token || !password) {
    return NextResponse.json({ error: 'Missing token or password' }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
  }

  const tokenHash = createHash('sha256').update(token).digest('hex');
  const db = getDb();

  const row = db
    .prepare(
      `SELECT id, user_id, expires_at, used_at FROM password_reset_tokens WHERE token_hash = ?`
    )
    .get(tokenHash) as
    | { id: number; user_id: number; expires_at: string; used_at: string | null }
    | undefined;

  if (!row || row.used_at || new Date(row.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: 'Token is invalid or expired' }, { status: 400 });
  }

  const hash = hashPassword(password);
  const now = new Date().toISOString();

  const tx = db.transaction(() => {
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, row.user_id);
    db.prepare('UPDATE password_reset_tokens SET used_at = ? WHERE id = ?').run(now, row.id);
    // Invalidate all sessions for this user.
    db.prepare('DELETE FROM sessions WHERE user_id = ?').run(row.user_id);
  });
  tx();

  return NextResponse.json({ ok: true });
}
