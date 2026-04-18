/**
 * Idempotent bulk import of bands.json entries into an existing user's
 * wishlist + live_events. Used to seed the logge account on prod without
 * touching auth / avatar / diary data that was already created.
 *
 * Usage: npx tsx scripts/bulk-import-bands.ts [username=logge]
 */
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

function resolveDbPath(): string {
  if (process.env.DB_PATH) return process.env.DB_PATH;
  const dir = process.env.DATA_DIR || process.cwd();
  return path.join(dir, 'data.db');
}
const DB_PATH = resolveDbPath();
const USERNAME = process.argv[2] || 'logge';

console.log('[import] DB =', DB_PATH);
console.log('[import] user =', USERNAME);

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const user = db.prepare('SELECT id FROM users WHERE username = ?').get(USERNAME) as
  | { id: number }
  | undefined;

if (!user) {
  console.error(`User "${USERNAME}" not found. Aborting.`);
  process.exit(1);
}

const bandsJson = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'bands.json'), 'utf-8')
) as {
  want: {
    name: string;
    genre?: string;
    img?: string;
    trackTitle?: string;
    preview?: string;
  }[];
  seen: {
    name: string;
    genre?: string;
    img?: string;
    trackTitle?: string;
    preview?: string;
    note?: string;
  }[];
};

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

// Build sets of already-present artists per user to skip duplicates (case-insensitive)
const existingWish = new Set(
  (db
    .prepare('SELECT LOWER(artist_name) AS n FROM wishlist WHERE user_id = ?')
    .all(user.id) as { n: string }[]).map((r) => r.n)
);
const existingLive = new Set(
  (db
    .prepare('SELECT LOWER(artist_name) AS n FROM live_events WHERE user_id = ?')
    .all(user.id) as { n: string }[]).map((r) => r.n)
);

const wishInsert = db.prepare(
  `INSERT INTO wishlist (user_id, artist_name, artist_img, genre, track_title, preview_url)
   VALUES (?, ?, ?, ?, ?, ?)`
);
const liveInsert = db.prepare(
  `INSERT INTO live_events (user_id, artist_name, artist_img, genre, venue, event_date, note, track_title, preview_url)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
);

let wAdded = 0;
let wSkipped = 0;
const tx = db.transaction(() => {
  for (const b of bandsJson.want) {
    const key = b.name.toLowerCase();
    if (existingWish.has(key)) {
      wSkipped++;
      continue;
    }
    wishInsert.run(
      user.id,
      b.name,
      b.img || null,
      b.genre || null,
      b.trackTitle || null,
      b.preview || null
    );
    wAdded++;
  }

  let lAdded = 0;
  let lSkipped = 0;
  for (const b of bandsJson.seen) {
    const key = b.name.toLowerCase();
    if (existingLive.has(key)) {
      lSkipped++;
      continue;
    }
    const { venue, eventDate } = parseNote(b.note || '');
    liveInsert.run(
      user.id,
      b.name,
      b.img || null,
      b.genre || null,
      venue,
      eventDate,
      b.note || null,
      b.trackTitle || null,
      b.preview || null
    );
    lAdded++;
  }
  console.log(`live_events: +${lAdded}, skipped ${lSkipped} (already present)`);
});
tx();
console.log(`wishlist:    +${wAdded}, skipped ${wSkipped} (already present)`);
console.log(`done for user @${USERNAME}`);
db.close();
