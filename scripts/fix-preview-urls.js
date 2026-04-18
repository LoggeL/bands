// One-off URL normalizer. Prefixes `/` to preview_url / avatar_url values
// that were stored as root-relative paths without the leading slash.
// Usage inside the container: node scripts/fix-preview-urls.js
const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH =
  process.env.DB_PATH ||
  path.join(process.env.DATA_DIR || process.cwd(), 'data.db');

console.log('[fix-urls] DB =', DB_PATH);
const db = new Database(DB_PATH);

const tables = ['diary_entries', 'live_events', 'wishlist'];
let total = 0;
for (const t of tables) {
  const r = db
    .prepare(
      "UPDATE " +
        t +
        " SET preview_url = '/' || preview_url WHERE preview_url IS NOT NULL " +
        "AND (preview_url LIKE 'previews/%' OR preview_url LIKE 'avatars/%')"
    )
    .run();
  console.log(t + ' preview_url rows fixed: ' + r.changes);
  total += r.changes;
}

const r2 = db
  .prepare(
    "UPDATE users SET avatar_url = '/' || avatar_url WHERE avatar_url IS NOT NULL AND avatar_url LIKE 'avatars/%'"
  )
  .run();
console.log('users avatar_url fixed: ' + r2.changes);

const sample = db
  .prepare(
    "SELECT artist_name, preview_url FROM wishlist WHERE preview_url IS NOT NULL LIMIT 3"
  )
  .all();
console.log('sample:', JSON.stringify(sample, null, 2));

console.log('total updates: ' + (total + r2.changes));
db.close();
