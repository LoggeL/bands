import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'data.db');

if (fs.existsSync(DB_PATH)) {
  fs.unlinkSync(DB_PATH);
  const walPath = DB_PATH + '-wal';
  const shmPath = DB_PATH + '-shm';
  if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
  if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);
}

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT,
    bio TEXT,
    avatar_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE diary_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    artist_name TEXT NOT NULL,
    artist_img TEXT,
    track_title TEXT NOT NULL,
    genre TEXT,
    preview_url TEXT,
    note TEXT,
    mood TEXT,
    listened_at DATE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE live_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    artist_name TEXT NOT NULL,
    artist_img TEXT,
    genre TEXT,
    venue TEXT,
    event_date TEXT,
    note TEXT,
    track_title TEXT,
    preview_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE wishlist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    artist_name TEXT NOT NULL,
    artist_img TEXT,
    genre TEXT,
    track_title TEXT,
    preview_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE reactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    diary_entry_id INTEGER NOT NULL REFERENCES diary_entries(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL,
    reactor_name TEXT DEFAULT 'anonymous',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX idx_diary_user ON diary_entries(user_id);
  CREATE INDEX idx_diary_date ON diary_entries(listened_at DESC);
  CREATE INDEX idx_live_user ON live_events(user_id);
  CREATE INDEX idx_wishlist_user ON wishlist(user_id);
  CREATE INDEX idx_reactions_entry ON reactions(diary_entry_id);
`);

const bandsJson = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'bands.json'), 'utf-8')
);

const insertUser = db.prepare(
  `INSERT INTO users (username, display_name, bio) VALUES (?, ?, ?)`
);
const { lastInsertRowid: userId } = insertUser.run(
  'logge',
  'Logge',
  'Music lover. Punk, Indie, Rap & everything in between.'
);

const insertWishlist = db.prepare(
  `INSERT INTO wishlist (user_id, artist_name, artist_img, genre, track_title, preview_url) VALUES (?, ?, ?, ?, ?, ?)`
);
for (const band of bandsJson.want) {
  insertWishlist.run(
    userId,
    band.name,
    band.img || null,
    band.genre || null,
    band.trackTitle || null,
    band.preview || null
  );
}
console.log(`Seeded ${bandsJson.want.length} wishlist items`);

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

const insertLive = db.prepare(
  `INSERT INTO live_events (user_id, artist_name, artist_img, genre, venue, event_date, note, track_title, preview_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
);
for (const band of bandsJson.seen) {
  const { venue, eventDate } = parseNote(band.note || '');
  insertLive.run(
    userId,
    band.name,
    band.img || null,
    band.genre || null,
    venue,
    eventDate,
    band.note || null,
    band.trackTitle || null,
    band.preview || null
  );
}
console.log(`Seeded ${bandsJson.seen.length} live events`);

const moods = ['energized', 'nostalgic', 'chill', 'melancholic', 'hyped', 'reflective'];
const diaryNotes = [
  'Had this on repeat all day',
  'Discovered this gem randomly',
  'Perfect for the morning commute',
  'This track hits different at night',
  'Brings back festival memories',
  'Cannot stop listening',
  'The energy in this track is unreal',
  'Such a vibe',
  'This one grew on me',
  'Instant classic for me',
];

const insertDiary = db.prepare(
  `INSERT INTO diary_entries (user_id, artist_name, artist_img, track_title, genre, preview_url, note, mood, listened_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
);
const insertReaction = db.prepare(
  `INSERT INTO reactions (diary_entry_id, emoji, reactor_name) VALUES (?, ?, ?)`
);

const allBands = [...bandsJson.want, ...bandsJson.seen].filter(
  (b: { trackTitle?: string; preview?: string }) => b.trackTitle && b.preview
);
const diaryBands = allBands.sort(() => Math.random() - 0.5).slice(0, 20);

const baseDate = new Date('2026-04-14');
for (let i = 0; i < diaryBands.length; i++) {
  const band = diaryBands[i];
  const date = new Date(baseDate);
  date.setDate(date.getDate() - i * 2 - Math.floor(Math.random() * 3));
  const dateStr = date.toISOString().split('T')[0];
  const mood = moods[Math.floor(Math.random() * moods.length)];
  const note = diaryNotes[Math.floor(Math.random() * diaryNotes.length)];

  const { lastInsertRowid: entryId } = insertDiary.run(
    userId,
    band.name,
    band.img || null,
    band.trackTitle,
    band.genre || null,
    band.preview || null,
    note,
    mood,
    dateStr
  );

  const reactionEmojis = ['🔥', '❤️', '🎸', '🤘', '💜', '🎵'];
  const numReactions = Math.floor(Math.random() * 4);
  for (let j = 0; j < numReactions; j++) {
    const emoji = reactionEmojis[Math.floor(Math.random() * reactionEmojis.length)];
    insertReaction.run(entryId, emoji, 'anonymous');
  }
}
console.log(`Seeded ${diaryBands.length} diary entries with reactions`);

db.close();
console.log('Database seeded successfully!');
