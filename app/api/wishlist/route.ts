import { getDb } from '@/lib/db';
import { getSessionUserFromRequest } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const currentUser = getSessionUserFromRequest(req);
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { artist_name, artist_img, genre, track_title, preview_url } = body;

  if (!artist_name) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const db = getDb();
  const existing = db.prepare(
    'SELECT id FROM wishlist WHERE user_id = ? AND artist_name = ?'
  ).get(currentUser.id, artist_name);

  if (existing) {
    return NextResponse.json({ error: 'Already in wishlist' }, { status: 409 });
  }

  const result = db.prepare(
    `INSERT INTO wishlist (user_id, artist_name, artist_img, genre, track_title, preview_url)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(
    currentUser.id,
    artist_name,
    artist_img || null,
    genre || null,
    track_title || null,
    preview_url || null
  );

  const item = db.prepare('SELECT * FROM wishlist WHERE id = ?').get(result.lastInsertRowid);
  return NextResponse.json(item, { status: 201 });
}
