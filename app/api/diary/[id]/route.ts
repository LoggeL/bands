import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSessionUserFromRequest } from '@/lib/auth';
import type { DiaryEntry } from '@/lib/db';

async function loadEntry(req: NextRequest, idStr: string) {
  const me = getSessionUserFromRequest(req);
  if (!me) return { error: 'Unauthorized', status: 401 } as const;
  const id = parseInt(idStr, 10);
  if (!id) return { error: 'Bad id', status: 400 } as const;
  const db = getDb();
  const entry = db.prepare('SELECT * FROM diary_entries WHERE id = ?').get(id) as
    | DiaryEntry
    | undefined;
  if (!entry) return { error: 'Not found', status: 404 } as const;
  if (entry.user_id !== me.id) return { error: 'Forbidden', status: 403 } as const;
  return { db, entry } as const;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const loaded = await loadEntry(req, id);
  if ('error' in loaded) {
    return NextResponse.json({ error: loaded.error }, { status: loaded.status });
  }
  const { db, entry } = loaded;
  const body = await req.json().catch(() => ({}));

  const next = {
    track_title:
      typeof body.track_title === 'string' && body.track_title.trim()
        ? body.track_title.trim()
        : entry.track_title,
    artist_name:
      typeof body.artist_name === 'string' && body.artist_name.trim()
        ? body.artist_name.trim()
        : entry.artist_name,
    artist_img: 'artist_img' in body ? (body.artist_img || null) : entry.artist_img,
    album_cover_url:
      'album_cover_url' in body ? (body.album_cover_url || null) : entry.album_cover_url,
    preview_url: 'preview_url' in body ? (body.preview_url || null) : entry.preview_url,
    genre: 'genre' in body ? (body.genre || null) : entry.genre,
    note: 'note' in body ? (body.note || null) : entry.note,
    listened_at:
      typeof body.listened_at === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.listened_at)
        ? body.listened_at
        : entry.listened_at,
  };

  db.prepare(
    `UPDATE diary_entries
     SET track_title = ?, artist_name = ?, artist_img = ?, album_cover_url = ?,
         preview_url = ?, genre = ?, note = ?, listened_at = ?
     WHERE id = ?`
  ).run(
    next.track_title,
    next.artist_name,
    next.artist_img,
    next.album_cover_url,
    next.preview_url,
    next.genre,
    next.note,
    next.listened_at,
    entry.id
  );

  const updated = db.prepare('SELECT * FROM diary_entries WHERE id = ?').get(entry.id);
  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const loaded = await loadEntry(req, id);
  if ('error' in loaded) {
    return NextResponse.json({ error: loaded.error }, { status: loaded.status });
  }
  loaded.db.prepare('DELETE FROM diary_entries WHERE id = ?').run(loaded.entry.id);
  return NextResponse.json({ ok: true });
}
