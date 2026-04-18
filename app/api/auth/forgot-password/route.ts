import { createHash, randomBytes } from 'crypto';
import { getDb } from '@/lib/db';
import { sendPasswordResetEmail } from '@/lib/email';
import { NextRequest, NextResponse } from 'next/server';
import type { User } from '@/lib/db';

const TTL_MS = 60 * 60 * 1000; // 1 hour

export async function POST(req: NextRequest) {
  const { email } = (await req.json()) as { email?: string };
  const normalized = email?.trim().toLowerCase();

  // Always return ok — no enumeration.
  const response = NextResponse.json({ ok: true });
  if (!normalized) return response;

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(normalized) as User | undefined;
  if (!user) return response;

  const token = randomBytes(32).toString('hex');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + TTL_MS).toISOString();

  db.prepare(
    'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)'
  ).run(user.id, tokenHash, expiresAt);

  sendPasswordResetEmail({
    to: user.email!,
    username: user.username,
    token,
  });

  return response;
}
