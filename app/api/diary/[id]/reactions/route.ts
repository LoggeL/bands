import { getDb } from '@/lib/db';
import { getSessionUserFromRequest } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const entryId = parseInt(id, 10);
  if (isNaN(entryId)) {
    return NextResponse.json({ error: 'Invalid entry ID' }, { status: 400 });
  }

  const currentUser = getSessionUserFromRequest(req);
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { emoji } = body;

  const allowedEmojis = ['🔥', '❤️', '🎸', '🤘', '💜', '🎵'];
  if (!emoji || !allowedEmojis.includes(emoji)) {
    return NextResponse.json({ error: 'Invalid emoji' }, { status: 400 });
  }

  const db = getDb();
  const entry = db.prepare('SELECT id FROM diary_entries WHERE id = ?').get(entryId);
  if (!entry) {
    return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
  }

  const reactorName = currentUser.username;
  const existing = db.prepare(
    'SELECT id, emoji FROM reactions WHERE diary_entry_id = ? AND reactor_name = ?'
  ).get(entryId, reactorName) as { id: number; emoji: string } | undefined;

  if (existing) {
    if (existing.emoji === emoji) {
      db.prepare('DELETE FROM reactions WHERE id = ?').run(existing.id);
    } else {
      db.prepare('UPDATE reactions SET emoji = ? WHERE id = ?').run(emoji, existing.id);
    }
  } else {
    db.prepare(
      'INSERT INTO reactions (diary_entry_id, emoji, reactor_name) VALUES (?, ?, ?)'
    ).run(entryId, emoji, reactorName);
  }

  const reactions = db
    .prepare('SELECT * FROM reactions WHERE diary_entry_id = ?')
    .all(entryId);

  return NextResponse.json(reactions, { status: 201 });
}
