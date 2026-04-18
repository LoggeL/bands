import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'data.db');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const USERNAME = 'jonas';
const DISPLAY = 'Jonas';
const BIO = 'Immer irgendwo am Moshen. Punk, Rap, alles laut.';
const PASSWORD = 'jonas1234';

const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(USERNAME) as
  | { id: number }
  | undefined;

if (existing) {
  console.log(`User "${USERNAME}" existiert bereits (id=${existing.id}). Nichts zu tun.`);
  process.exit(0);
}

const hash = bcrypt.hashSync(PASSWORD, 12);

const { lastInsertRowid } = db
  .prepare(
    `INSERT INTO users (username, display_name, bio, password_hash, visibility, notify_email)
     VALUES (?, ?, ?, ?, 'public', 0)`
  )
  .run(USERNAME, DISPLAY, BIO, hash);

const userId = Number(lastInsertRowid);
console.log(`Angelegt: user_id=${userId}, username=${USERNAME}, password=${PASSWORD}`);

// Seed a little content so the profile isn't empty
const bandsJson = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'bands.json'), 'utf-8')
) as {
  want: { name: string; genre: string; img?: string; trackTitle?: string; preview?: string }[];
  seen: {
    name: string;
    genre: string;
    img?: string;
    trackTitle?: string;
    preview?: string;
    note?: string;
  }[];
};

function pick<T>(arr: T[], n: number): T[] {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, n);
}

// Wishlist: 5 artists from the "want" list
const wishInsert = db.prepare(
  `INSERT INTO wishlist (user_id, artist_name, artist_img, genre, track_title, preview_url)
   VALUES (?, ?, ?, ?, ?, ?)`
);
for (const b of pick(bandsJson.want.filter((b) => b.preview), 5)) {
  wishInsert.run(userId, b.name, b.img || null, b.genre || null, b.trackTitle || null, b.preview || null);
}

// Live: 3 past shows from the "seen" list
function parseNote(note: string): { venue: string | null; eventDate: string | null } {
  if (!note) return { venue: null, eventDate: null };
  const dateMatch = note.match(/(\d{2})\.(\d{2})\.(\d{4})/);
  if (dateMatch) {
    const eventDate = `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`;
    const venue = note.replace(/,?\s*\d{2}\.\d{2}\.\d{4}/, '').trim();
    return { venue: venue || null, eventDate };
  }
  const yearMatch = note.match(/,?\s*(\d{4})$/);
  if (yearMatch) {
    const venue = note.replace(/,?\s*\d{4}$/, '').trim();
    return { venue: venue || null, eventDate: yearMatch[1] };
  }
  return { venue: note, eventDate: null };
}

const liveInsert = db.prepare(
  `INSERT INTO live_events (user_id, artist_name, artist_img, genre, venue, event_date, note, track_title, preview_url)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
);
for (const b of pick(bandsJson.seen.filter((b) => b.preview), 3)) {
  const { venue, eventDate } = parseNote(b.note || '');
  liveInsert.run(
    userId,
    b.name,
    b.img || null,
    b.genre || null,
    venue,
    eventDate,
    b.note || null,
    b.trackTitle || null,
    b.preview || null
  );
}

// Diary: 6 recent entries from any band with a preview
const moods = ['voller energie', 'nostalgisch', 'chill', 'melancholisch', 'hyped', 'nachdenklich'];
const diaryNotes = [
  'Den ganzen Tag in Dauerschleife',
  'Hängt immer noch im Kopf vom Konzert',
  'Perfekt für den Weg zur Arbeit',
  'Nachts hört sich das anders an',
  'Dieser Song zieht mich jedes Mal rein',
  'Krieg den Track einfach nicht raus',
];

const allBands = [...bandsJson.want, ...bandsJson.seen].filter((b) => b.trackTitle && b.preview);
const diaryInsert = db.prepare(
  `INSERT INTO diary_entries (user_id, artist_name, artist_img, track_title, genre, preview_url, note, mood, listened_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
);
const base = new Date();
const chosen = pick(allBands, 6);
for (let i = 0; i < chosen.length; i++) {
  const b = chosen[i];
  const d = new Date(base);
  d.setDate(d.getDate() - i * 2 - Math.floor(Math.random() * 2));
  diaryInsert.run(
    userId,
    b.name,
    b.img || null,
    b.trackTitle!,
    b.genre || null,
    b.preview!,
    diaryNotes[Math.floor(Math.random() * diaryNotes.length)],
    moods[Math.floor(Math.random() * moods.length)],
    d.toISOString().split('T')[0]
  );
}

// Auto-friend with "logge" if that user exists
const logge = db.prepare('SELECT id FROM users WHERE username = ?').get('logge') as
  | { id: number }
  | undefined;
if (logge) {
  db.prepare(
    `INSERT OR IGNORE INTO friendships (requester_id, addressee_id, status, accepted_at)
     VALUES (?, ?, 'accepted', datetime('now'))`
  ).run(logge.id, userId);
  console.log('Freundschaft mit logge hergestellt.');
}

console.log('Seed: 5 Wunschliste · 3 Live · 6 Tagebuch');
db.close();
