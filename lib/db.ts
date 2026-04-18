import Database from 'better-sqlite3';
import path from 'path';
import { mkdirSync } from 'fs';

// Prefer an explicit DB_PATH (e.g. "/data/data.db" on Docker volume).
// Otherwise store in DATA_DIR or cwd so the file never ends up in an
// image layer that's wiped on redeploy.
function resolveDbPath(): string {
  if (process.env.DB_PATH) return process.env.DB_PATH;
  const dir = process.env.DATA_DIR || process.cwd();
  return path.join(dir, 'data.db');
}

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    const dbPath = resolveDbPath();
    mkdirSync(path.dirname(dbPath), { recursive: true });
    _db = new Database(dbPath);
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

    CREATE INDEX IF NOT EXISTS idx_diary_user ON diary_entries(user_id);
    CREATE INDEX IF NOT EXISTS idx_diary_date ON diary_entries(listened_at DESC);
    CREATE INDEX IF NOT EXISTS idx_live_user ON live_events(user_id);
    CREATE INDEX IF NOT EXISTS idx_wishlist_user ON wishlist(user_id);

    CREATE TABLE IF NOT EXISTS friendships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      requester_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      addressee_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status TEXT NOT NULL CHECK(status IN ('pending','accepted')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      accepted_at DATETIME
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_friendships_pair ON friendships(requester_id, addressee_id);
    CREATE INDEX IF NOT EXISTS idx_friendships_addressee ON friendships(addressee_id, status);
    CREATE INDEX IF NOT EXISTS idx_friendships_requester ON friendships(requester_id, status);

    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT UNIQUE NOT NULL,
      expires_at DATETIME NOT NULL,
      used_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_prt_user ON password_reset_tokens(user_id);
    CREATE INDEX IF NOT EXISTS idx_prt_hash ON password_reset_tokens(token_hash);

    -- Cached dominant colour + blurhash per image URL. Computed once when an
    -- image is first seen and reused everywhere (diary, live, wishlist,
    -- avatars) so the frontend doesn't have to re-derive it.
    CREATE TABLE IF NOT EXISTS image_meta (
      url TEXT PRIMARY KEY,
      dominant_color TEXT,
      blurhash TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const cols = db.prepare("PRAGMA table_info(users)").all() as { name: string }[];
  if (!cols.some((c) => c.name === 'password_hash')) {
    db.exec('ALTER TABLE users ADD COLUMN password_hash TEXT');
  }
  if (!cols.some((c) => c.name === 'visibility')) {
    db.exec("ALTER TABLE users ADD COLUMN visibility TEXT NOT NULL DEFAULT 'public' CHECK(visibility IN ('public','friends','private'))");
  }
  if (!cols.some((c) => c.name === 'email')) {
    db.exec('ALTER TABLE users ADD COLUMN email TEXT');
    db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE email IS NOT NULL');
  }
  if (!cols.some((c) => c.name === 'notify_email')) {
    db.exec('ALTER TABLE users ADD COLUMN notify_email INTEGER NOT NULL DEFAULT 1');
  }

  const diaryCols = db.prepare("PRAGMA table_info(diary_entries)").all() as { name: string }[];
  if (!diaryCols.some((c) => c.name === 'album_cover_url')) {
    db.exec('ALTER TABLE diary_entries ADD COLUMN album_cover_url TEXT');
  }
  const liveCols = db.prepare("PRAGMA table_info(live_events)").all() as { name: string }[];
  if (!liveCols.some((c) => c.name === 'album_cover_url')) {
    db.exec('ALTER TABLE live_events ADD COLUMN album_cover_url TEXT');
  }
  const wishCols = db.prepare("PRAGMA table_info(wishlist)").all() as { name: string }[];
  if (!wishCols.some((c) => c.name === 'album_cover_url')) {
    db.exec('ALTER TABLE wishlist ADD COLUMN album_cover_url TEXT');
  }
}

export type Visibility = 'public' | 'friends' | 'private';

export type ImageMeta = {
  url: string;
  dominant_color: string | null;
  blurhash: string | null;
  created_at: string;
};

export type User = {
  id: number;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  password_hash: string | null;
  visibility: Visibility;
  email: string | null;
  notify_email: number;
  created_at: string;
};

export type FriendshipStatus = 'pending' | 'accepted';

export type Friendship = {
  id: number;
  requester_id: number;
  addressee_id: number;
  status: FriendshipStatus;
  created_at: string;
  accepted_at: string | null;
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
  album_cover_url: string | null;
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
  album_cover_url: string | null;
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
  album_cover_url: string | null;
  genre: string | null;
  track_title: string | null;
  preview_url: string | null;
  created_at: string;
};

