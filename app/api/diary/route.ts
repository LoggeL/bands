import { getDb } from '@/lib/db';
import { getSessionUserFromRequest } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const currentUser = getSessionUserFromRequest(req);
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { artist_name, artist_img, album_cover_url, track_title, genre, preview_url, note, mood, listened_at } = body;

  if (!artist_name || !track_title || !listened_at) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const db = getDb();
  const result = db.prepare(
    `INSERT INTO diary_entries (user_id, artist_name, artist_img, album_cover_url, track_title, genre, preview_url, note, mood, listened_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    currentUser.id,
    artist_name,
    artist_img || null,
    album_cover_url || null,
    track_title,
    genre || null,
    preview_url || null,
    note || null,
    mood || null,
    listened_at
  );

  const entry = db.prepare('SELECT * FROM diary_entries WHERE id = ?').get(result.lastInsertRowid);
  return NextResponse.json(entry, { status: 201 });
}
