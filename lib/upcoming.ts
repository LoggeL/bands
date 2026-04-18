import { getDb } from './db';

const APP_ID = process.env.BANDSINTOWN_APP_ID || 'setlist.logge.top';
// Low traffic, data rarely changes, 6h is plenty.
const TTL_MS = 6 * 60 * 60 * 1000;

export type UpcomingEvent = {
  event_date: string; // YYYY-MM-DD
  venue: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  ticket_url: string | null;
  event_url: string | null;
};

type BandsintownOffer = { url?: string; type?: string };
type BandsintownEvent = {
  id?: string | number;
  datetime?: string;
  url?: string;
  venue?: {
    name?: string;
    city?: string;
    region?: string;
    country?: string;
  };
  offers?: BandsintownOffer[];
};

// Per-process dedupe: don't fire a second network request for the same
// artist while the first one is in flight.
const inflight = new Map<string, Promise<void>>();

async function fetchFromBandsintown(artistName: string): Promise<BandsintownEvent[]> {
  const url = `https://rest.bandsintown.com/artists/${encodeURIComponent(
    artistName
  )}/events?app_id=${encodeURIComponent(APP_ID)}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    throw new Error(`bandsintown ${res.status}`);
  }
  const data = (await res.json()) as unknown;
  if (!Array.isArray(data)) return [];
  return data as BandsintownEvent[];
}

async function refreshOne(artistName: string): Promise<void> {
  const db = getDb();
  const key = artistName.toLowerCase();
  const now = new Date().toISOString();

  try {
    const events = await fetchFromBandsintown(artistName);
    const tx = db.transaction(() => {
      db.prepare('DELETE FROM upcoming_events WHERE artist_name_key = ?').run(key);
      const insert = db.prepare(
        `INSERT INTO upcoming_events
          (artist_name_key, external_id, event_date, venue, city, region, country, ticket_url, event_url, source, fetched_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'bandsintown', ?)`
      );
      let kept = 0;
      for (const e of events) {
        const date = e.datetime ? e.datetime.slice(0, 10) : null;
        if (!date) continue;
        const ticketOffer = Array.isArray(e.offers)
          ? e.offers.find((o) => (o.type || '').toLowerCase() === 'tickets')
          : null;
        insert.run(
          key,
          e.id != null ? String(e.id) : null,
          date,
          e.venue?.name || null,
          e.venue?.city || null,
          e.venue?.region || null,
          e.venue?.country || null,
          ticketOffer?.url || null,
          e.url || null,
          now
        );
        kept++;
      }
      db.prepare(
        `INSERT OR REPLACE INTO upcoming_fetch_meta
           (artist_name_key, fetched_at, source, event_count, error)
         VALUES (?, ?, 'bandsintown', ?, NULL)`
      ).run(key, now, kept);
    });
    tx();
  } catch (err) {
    // Record the failed attempt so we don't retry on every request.
    const msg = err instanceof Error ? err.message : String(err);
    db.prepare(
      `INSERT INTO upcoming_fetch_meta (artist_name_key, fetched_at, source, event_count, error)
       VALUES (?, ?, 'bandsintown', COALESCE((SELECT event_count FROM upcoming_fetch_meta WHERE artist_name_key = ?), 0), ?)
       ON CONFLICT(artist_name_key) DO UPDATE SET fetched_at = excluded.fetched_at, error = excluded.error`
    ).run(key, now, key, msg);
    console.warn('[upcoming] fetch failed', artistName, msg);
  }
}

/**
 * Fire-and-forget refresh if the cached entry is older than TTL (or absent).
 * Safe to call from Server Components — returns immediately; the refresh
 * happens in the background and the fresh data is visible on the next render.
 */
export function scheduleRefreshIfStale(artistName: string): void {
  const db = getDb();
  const key = artistName.toLowerCase();
  const row = db
    .prepare('SELECT fetched_at FROM upcoming_fetch_meta WHERE artist_name_key = ?')
    .get(key) as { fetched_at: string } | undefined;
  if (row && Date.now() - new Date(row.fetched_at).getTime() < TTL_MS) return;
  if (inflight.has(key)) return;
  const p = refreshOne(artistName).finally(() => inflight.delete(key));
  inflight.set(key, p);
}

/** Sync read of cached future shows — never blocks on the network. */
export function getCachedUpcoming(artistName: string): UpcomingEvent[] {
  const db = getDb();
  const key = artistName.toLowerCase();
  return db
    .prepare(
      `SELECT event_date, venue, city, region, country, ticket_url, event_url
       FROM upcoming_events
       WHERE artist_name_key = ? AND event_date >= date('now')
       ORDER BY event_date ASC`
    )
    .all(key) as UpcomingEvent[];
}

export function getCachedUpcomingBatch(artistNames: string[]): Map<string, UpcomingEvent[]> {
  const db = getDb();
  const out = new Map<string, UpcomingEvent[]>();
  if (artistNames.length === 0) return out;
  const placeholders = artistNames.map(() => '?').join(',');
  const keys = artistNames.map((n) => n.toLowerCase());
  const rows = db
    .prepare(
      `SELECT artist_name_key, event_date, venue, city, region, country, ticket_url, event_url
       FROM upcoming_events
       WHERE artist_name_key IN (${placeholders}) AND event_date >= date('now')
       ORDER BY event_date ASC`
    )
    .all(...keys) as Array<UpcomingEvent & { artist_name_key: string }>;
  for (const r of rows) {
    const arr = out.get(r.artist_name_key) || [];
    arr.push({
      event_date: r.event_date,
      venue: r.venue,
      city: r.city,
      region: r.region,
      country: r.country,
      ticket_url: r.ticket_url,
      event_url: r.event_url,
    });
    out.set(r.artist_name_key, arr);
  }
  return out;
}
