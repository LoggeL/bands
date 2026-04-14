import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data.db');

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');
    initSchema(_db);
  }
  return _db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      display_name TEXT,
      bio TEXT,
      avatar_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

    CREATE TABLE IF NOT EXISTS diary_entries (
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

    CREATE TABLE IF NOT EXISTS live_events (
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

    CREATE TABLE IF NOT EXISTS wishlist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      artist_name TEXT NOT NULL,
      artist_img TEXT,
      genre TEXT,
      track_title TEXT,
      preview_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      diary_entry_id INTEGER NOT NULL REFERENCES diary_entries(id) ON DELETE CASCADE,
      emoji TEXT NOT NULL,
      reactor_name TEXT DEFAULT 'anonymous',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_diary_user ON diary_entries(user_id);
    CREATE INDEX IF NOT EXISTS idx_diary_date ON diary_entries(listened_at DESC);
    CREATE INDEX IF NOT EXISTS idx_live_user ON live_events(user_id);
    CREATE INDEX IF NOT EXISTS idx_wishlist_user ON wishlist(user_id);
    CREATE INDEX IF NOT EXISTS idx_reactions_entry ON reactions(diary_entry_id);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_reactions_unique ON reactions(diary_entry_id, reactor_name);
  `);

  // Add password_hash column if it doesn't exist (migration for existing DBs)
  const cols = db.prepare("PRAGMA table_info(users)").all() as { name: string }[];
  if (!cols.some((c) => c.name === 'password_hash')) {
    db.exec('ALTER TABLE users ADD COLUMN password_hash TEXT');
  }
}

export type User = {
  id: number;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  password_hash: string | null;
  created_at: string;
};

export type Session = {
  id: number;
  user_id: number;
  token: string;
  created_at: string;
  expires_at: string;
};

export type DiaryEntry = {
  id: number;
  user_id: number;
  artist_name: string;
  artist_img: string | null;
  track_title: string;
  genre: string | null;
  preview_url: string | null;
  note: string | null;
  mood: string | null;
  listened_at: string;
  created_at: string;
};

export type LiveEvent = {
  id: number;
  user_id: number;
  artist_name: string;
  artist_img: string | null;
  genre: string | null;
  venue: string | null;
  event_date: string | null;
  note: string | null;
  track_title: string | null;
  preview_url: string | null;
  created_at: string;
};

export type WishlistItem = {
  id: number;
  user_id: number;
  artist_name: string;
  artist_img: string | null;
  genre: string | null;
  track_title: string | null;
  preview_url: string | null;
  created_at: string;
};

export type Reaction = {
  id: number;
  diary_entry_id: number;
  emoji: string;
  reactor_name: string;
  created_at: string;
};
