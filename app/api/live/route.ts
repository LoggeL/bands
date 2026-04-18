import { getDb } from '@/lib/db';
import { getSessionUserFromRequest } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const currentUser = getSessionUserFromRequest(req);
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const {
    artist_name,
    artist_img,
    album_cover_url,
    genre,
    venue,
    event_date,
    note,
    track_title,
    preview_url,
  } = body;

  if (!artist_name) {
    return NextResponse.json({ error: 'Missing artist_name' }, { status: 400 });
  }

  const db = getDb();
  const result = db
    .prepare(
      `INSERT INTO live_events (user_id, artist_name, artist_img, album_cover_url, genre, venue, event_date, note, track_title, preview_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      currentUser.id,
      artist_name,
      artist_img || null,
      album_cover_url || null,
      genre || null,
      venue || null,
      event_date || null,
      note || null,
      track_title || null,
      preview_url || null
    );

  const entry = db.prepare('SELECT * FROM live_events WHERE id = ?').get(result.lastInsertRowid);
  return NextResponse.json(entry, { status: 201 });
}
