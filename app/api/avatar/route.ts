import { writeFile, unlink, mkdir } from 'fs/promises';
import path from 'path';
import { getDb } from '@/lib/db';
import { getSessionUserFromRequest } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB — fits most gifs

const MIME_EXT: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

const AVATARS_DIR = path.join(process.cwd(), 'public', 'avatars');

async function removeOldAvatar(url: string | null) {
  if (!url || !url.startsWith('/avatars/')) return;
  const filename = url.replace(/^\/avatars\//, '');
  if (!/^[a-z0-9._-]+$/i.test(filename)) return;
  try {
    await unlink(path.join(AVATARS_DIR, filename));
  } catch {
    // file already gone — fine
  }
}

export async function POST(req: NextRequest) {
  const me = getSessionUserFromRequest(req);
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Missing file' }, { status: 400 });
  }

  const ext = MIME_EXT[file.type];
  if (!ext) {
    return NextResponse.json(
      { error: 'Nur PNG, JPEG, WEBP oder GIF erlaubt' },
      { status: 415 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Datei zu groß (max. 8 MB)' }, { status: 413 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const filename = `${me.id}-${Date.now()}.${ext}`;
  await mkdir(AVATARS_DIR, { recursive: true });
  await writeFile(path.join(AVATARS_DIR, filename), bytes);

  const db = getDb();
  const prev = db.prepare('SELECT avatar_url FROM users WHERE id = ?').get(me.id) as
    | { avatar_url: string | null }
    | undefined;

  const newUrl = `/avatars/${filename}`;
  db.prepare('UPDATE users SET avatar_url = ? WHERE id = ?').run(newUrl, me.id);

  await removeOldAvatar(prev?.avatar_url ?? null);

  return NextResponse.json({ avatar_url: newUrl });
}

export async function DELETE(req: NextRequest) {
  const me = getSessionUserFromRequest(req);
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const prev = db.prepare('SELECT avatar_url FROM users WHERE id = ?').get(me.id) as
    | { avatar_url: string | null }
    | undefined;

  db.prepare('UPDATE users SET avatar_url = NULL WHERE id = ?').run(me.id);
  await removeOldAvatar(prev?.avatar_url ?? null);

  return NextResponse.json({ ok: true });
}
