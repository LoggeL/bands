import { getDb } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { username, artist_name, artist_img, track_title, genre, preview_url, note, mood, listened_at } = body;

  if (!username || !artist_name || !track_title || !listened_at) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const db = getDb();
  const user = db.prepare('SELECT id FROM users WHERE username = ?').get(username) as { id: number } | undefined;
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const result = db.prepare(
    `INSERT INTO diary_entries (user_id, artist_name, artist_img, track_title, genre, preview_url, note, mood, listened_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(user.id, artist_name, artist_img || null, track_title, genre || null, preview_url || null, note || null, mood || null, listened_at);

  const entry = db.prepare('SELECT * FROM diary_entries WHERE id = ?').get(result.lastInsertRowid);
  return NextResponse.json(entry, { status: 201 });
}
