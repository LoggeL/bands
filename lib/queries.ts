import { getDb } from './db';
import type { User, DiaryEntry, Visibility } from './db';

export type FriendState =
  | 'anonymous'
  | 'none'
  | 'self'
  | 'outgoing_pending'
  | 'incoming_pending'
  | 'friends';

export type FeedItem = {
  kind: 'diary';
  sort_date: string;
  author_username: string;
  author_display_name: string | null;
  author_avatar_url: string | null;
  viewer_seen: boolean;
  viewer_wishlisted: boolean;
} & DiaryEntry;

export type FeedDay = {
  date: string;
  items: FeedItem[];
};

/**
 * Core visibility check. Returns true if `viewer` can see content owned by `owner`.
 * - self: always true
 * - public: anyone
 * - friends: only accepted friends
 * - private: only self
 */
export function canView(
  viewer: { id: number } | null,
  owner: { id: number; visibility: Visibility }
): boolean {
  if (viewer && viewer.id === owner.id) return true;
  if (owner.visibility === 'public') return true;
  if (owner.visibility === 'friends' && viewer) return areFriends(viewer.id, owner.id);
  return false;
}

export function areFriends(aId: number, bId: number): boolean {
  if (aId === bId) return false;
  const db = getDb();
  const row = db
    .prepare(
      `SELECT 1 FROM friendships
       WHERE status = 'accepted'
         AND ((requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?))
       LIMIT 1`
    )
    .get(aId, bId, bId, aId);
  return !!row;
}

export function friendState(viewerId: number | null, targetId: number): FriendState {
  if (viewerId === null) return 'anonymous';
  if (viewerId === targetId) return 'self';
  const db = getDb();
  const row = db
    .prepare(
      `SELECT requester_id, addressee_id, status FROM friendships
       WHERE (requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?)
       LIMIT 1`
    )
    .get(viewerId, targetId, targetId, viewerId) as
    | { requester_id: number; addressee_id: number; status: 'pending' | 'accepted' }
    | undefined;
  if (!row) return 'none';
  if (row.status === 'accepted') return 'friends';
  return row.requester_id === viewerId ? 'outgoing_pending' : 'incoming_pending';
}

export function friendCounts(userId: number): { friends: number; incoming: number; outgoing: number } {
  const db = getDb();
  const friends = (db
    .prepare(
      `SELECT COUNT(*) AS n FROM friendships WHERE status='accepted' AND (requester_id=? OR addressee_id=?)`
    )
    .get(userId, userId) as { n: number }).n;
  const incoming = (db
    .prepare(`SELECT COUNT(*) AS n FROM friendships WHERE status='pending' AND addressee_id=?`)
    .get(userId) as { n: number }).n;
  const outgoing = (db
    .prepare(`SELECT COUNT(*) AS n FROM friendships WHERE status='pending' AND requester_id=?`)
    .get(userId) as { n: number }).n;
  return { friends, incoming, outgoing };
}

export function listFriends(userId: number): User[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT u.* FROM users u
       JOIN friendships f ON f.status='accepted'
         AND ((f.requester_id=? AND f.addressee_id=u.id) OR (f.addressee_id=? AND f.requester_id=u.id))
       ORDER BY u.username ASC`
    )
    .all(userId, userId) as User[];
}

export function listIncomingRequests(userId: number): User[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT u.* FROM users u
       JOIN friendships f ON f.status='pending' AND f.requester_id=u.id AND f.addressee_id=?
       ORDER BY f.created_at DESC`
    )
    .all(userId) as User[];
}

export function listOutgoingRequests(userId: number): User[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT u.* FROM users u
       JOIN friendships f ON f.status='pending' AND f.addressee_id=u.id AND f.requester_id=?
       ORDER BY f.created_at DESC`
    )
    .all(userId) as User[];
}

/**
 * Public diary feed. Only shows diary entries from users whose profile
 * visibility is 'public'. Optional scope='friends' further restricts to
 * viewer's accepted friends (who are also public). Grouped by listened day.
 */
export function getFeed({
  viewerId,
  scope,
  limit = 50,
}: {
  viewerId: number | null;
  scope: 'everyone' | 'friends';
  limit?: number;
}): FeedDay[] {
  const db = getDb();

  const friendScopeClause =
    scope === 'friends' && viewerId !== null
      ? `AND EXISTS (
          SELECT 1 FROM friendships fs
          WHERE fs.status='accepted'
            AND ((fs.requester_id=${viewerId} AND fs.addressee_id=u.id)
              OR (fs.addressee_id=${viewerId} AND fs.requester_id=u.id))
        )`
      : '';

  const viewerStatusCols =
    viewerId !== null
      ? `,
         EXISTS(
           SELECT 1 FROM live_events le
           WHERE le.user_id = ${viewerId}
             AND LOWER(le.artist_name) = LOWER(d.artist_name)
         ) AS viewer_seen,
         EXISTS(
           SELECT 1 FROM wishlist w
           WHERE w.user_id = ${viewerId}
             AND LOWER(w.artist_name) = LOWER(d.artist_name)
         ) AS viewer_wishlisted`
      : `,
         0 AS viewer_seen,
         0 AS viewer_wishlisted`;

  const diary = db
    .prepare(
      `SELECT d.*, u.username AS author_username, u.display_name AS author_display_name,
              u.avatar_url AS author_avatar_url,
              COALESCE(d.listened_at, d.created_at) AS sort_date
              ${viewerStatusCols}
       FROM diary_entries d
       JOIN users u ON u.id = d.user_id
       WHERE u.visibility = 'public' ${friendScopeClause}
       ORDER BY sort_date DESC
       LIMIT ?`
    )
    .all(limit) as (DiaryEntry & {
      author_username: string;
      author_display_name: string | null;
      author_avatar_url: string | null;
      sort_date: string;
      viewer_seen: number;
      viewer_wishlisted: number;
    })[];

  const items: FeedItem[] = diary.map((d) => ({
    ...d,
    viewer_seen: !!d.viewer_seen,
    viewer_wishlisted: !!d.viewer_wishlisted,
    kind: 'diary' as const,
  }));

  const byDay = new Map<string, FeedItem[]>();
  for (const item of items) {
    const day = (item.sort_date || '').slice(0, 10);
    const arr = byDay.get(day) || [];
    arr.push(item);
    byDay.set(day, arr);
  }

  return Array.from(byDay.entries())
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .map(([date, items]) => ({ date, items }));
}

export type ArtistLive = {
  id: number;
  venue: string | null;
  event_date: string | null;
  track_title: string | null;
  note: string | null;
};

export type ArtistSummary = {
  artist_name: string;
  artist_img: string | null;
  album_cover_url: string | null;
  genre: string | null;
  preview_url: string | null;
  track_title: string | null;
  wishlist_id: number | null;
  wishlist_created_at: string | null;
  live_events: ArtistLive[];
  last_event_date: string | null;
  /** Max of wishlist.created_at and live_events.created_at — "added to this user's records". */
  added_at: string | null;
};

/**
 * Combined view per artist for a user: wishlist + live events, grouped by
 * LOWER(artist_name). Artists with live events are marked 'seen'; those still
 * on the wishlist are 'want'. An artist can be both.
 */
export function getArtistSummary(userId: number): ArtistSummary[] {
  const db = getDb();

  const wishRows = db
    .prepare(
      `SELECT id, artist_name, artist_img, album_cover_url, genre, preview_url, track_title, created_at
       FROM wishlist WHERE user_id = ?`
    )
    .all(userId) as Array<{
    id: number;
    artist_name: string;
    artist_img: string | null;
    album_cover_url: string | null;
    genre: string | null;
    preview_url: string | null;
    track_title: string | null;
    created_at: string;
  }>;

  const liveRows = db
    .prepare(
      `SELECT id, artist_name, artist_img, album_cover_url, genre, preview_url, track_title, venue, event_date, note, created_at
       FROM live_events WHERE user_id = ?
       ORDER BY event_date DESC, created_at DESC`
    )
    .all(userId) as Array<{
    id: number;
    artist_name: string;
    artist_img: string | null;
    album_cover_url: string | null;
    genre: string | null;
    preview_url: string | null;
    track_title: string | null;
    venue: string | null;
    event_date: string | null;
    note: string | null;
    created_at: string;
  }>;

  const byKey = new Map<string, ArtistSummary>();

  for (const w of wishRows) {
    const key = w.artist_name.toLowerCase();
    byKey.set(key, {
      artist_name: w.artist_name,
      artist_img: w.artist_img,
      album_cover_url: w.album_cover_url,
      genre: w.genre,
      preview_url: w.preview_url,
      track_title: w.track_title,
      wishlist_id: w.id,
      wishlist_created_at: w.created_at,
      live_events: [],
      last_event_date: null,
      added_at: w.created_at,
    });
  }

  for (const l of liveRows) {
    const key = l.artist_name.toLowerCase();
    const existing = byKey.get(key);
    const live: ArtistLive = {
      id: l.id,
      venue: l.venue,
      event_date: l.event_date,
      track_title: l.track_title,
      note: l.note,
    };
    if (existing) {
      existing.live_events.push(live);
      existing.album_cover_url = existing.album_cover_url || l.album_cover_url;
      existing.artist_img = existing.artist_img || l.artist_img;
      existing.preview_url = existing.preview_url || l.preview_url;
      existing.genre = existing.genre || l.genre;
      existing.track_title = existing.track_title || l.track_title;
      if (!existing.last_event_date || (l.event_date && l.event_date > existing.last_event_date)) {
        existing.last_event_date = l.event_date;
      }
      if (!existing.added_at || l.created_at > existing.added_at) {
        existing.added_at = l.created_at;
      }
    } else {
      byKey.set(key, {
        artist_name: l.artist_name,
        artist_img: l.artist_img,
        album_cover_url: l.album_cover_url,
        genre: l.genre,
        preview_url: l.preview_url,
        track_title: l.track_title,
        wishlist_id: null,
        wishlist_created_at: null,
        live_events: [live],
        last_event_date: l.event_date,
        added_at: l.created_at,
      });
    }
  }

  // Sort: seen (by most recent date desc) first, then wishlist-only (alphabetical).
  return Array.from(byKey.values()).sort((a, b) => {
    const aSeen = a.live_events.length > 0;
    const bSeen = b.live_events.length > 0;
    if (aSeen && !bSeen) return -1;
    if (!aSeen && bSeen) return 1;
    if (aSeen && bSeen) {
      const ad = a.last_event_date || '';
      const bd = b.last_event_date || '';
      if (ad !== bd) return ad < bd ? 1 : -1;
    }
    return a.artist_name.localeCompare(b.artist_name);
  });
}

export type WishlistBuddy = {
  artist_name: string;
  artist_img: string | null;
  album_cover_url: string | null;
  genre: string | null;
  others: { id: number; username: string; display_name: string | null; visibility: Visibility }[];
};

/**
 * For each artist on `forUserId`'s wishlist, returns other users (visible to
 * `viewerId`) who also want that artist. Useful for planning concerts together.
 */
export function getWishlistBuddies(forUserId: number, viewerId: number | null): WishlistBuddy[] {
  const db = getDb();

  const visibilityClause = `(
    u.visibility = 'public'
    ${viewerId !== null ? `OR u.id = ${viewerId}` : ''}
    ${
      viewerId !== null
        ? `OR (u.visibility = 'friends' AND EXISTS (
            SELECT 1 FROM friendships fv
            WHERE fv.status='accepted'
              AND ((fv.requester_id=${viewerId} AND fv.addressee_id=u.id)
                OR (fv.addressee_id=${viewerId} AND fv.requester_id=u.id))
          ))`
        : ''
    }
  )`;

  const rows = db
    .prepare(
      `SELECT
         mine.artist_name   AS artist_name,
         mine.artist_img    AS artist_img,
         mine.album_cover_url AS album_cover_url,
         mine.genre         AS genre,
         u.id               AS other_id,
         u.username         AS other_username,
         u.display_name     AS other_display_name,
         u.visibility       AS other_visibility
       FROM wishlist mine
       JOIN wishlist theirs ON LOWER(theirs.artist_name) = LOWER(mine.artist_name)
         AND theirs.user_id != mine.user_id
       JOIN users u ON u.id = theirs.user_id
       WHERE mine.user_id = ?
         AND ${visibilityClause}
       ORDER BY mine.artist_name COLLATE NOCASE ASC, u.username ASC`
    )
    .all(forUserId) as {
    artist_name: string;
    artist_img: string | null;
    album_cover_url: string | null;
    genre: string | null;
    other_id: number;
    other_username: string;
    other_display_name: string | null;
    other_visibility: Visibility;
  }[];

  const byArtist = new Map<string, WishlistBuddy>();
  for (const r of rows) {
    const key = r.artist_name.toLowerCase();
    const existing = byArtist.get(key);
    const other = {
      id: r.other_id,
      username: r.other_username,
      display_name: r.other_display_name,
      visibility: r.other_visibility,
    };
    if (existing) {
      if (!existing.others.some((o) => o.id === other.id)) existing.others.push(other);
    } else {
      byArtist.set(key, {
        artist_name: r.artist_name,
        artist_img: r.artist_img,
        album_cover_url: r.album_cover_url,
        genre: r.genre,
        others: [other],
      });
    }
  }

  return Array.from(byArtist.values()).sort(
    (a, b) => b.others.length - a.others.length || a.artist_name.localeCompare(b.artist_name)
  );
}

/**
 * For two specific users: artists both want. Used when viewing someone else's
 * wishlist while logged in — "YOU BOTH WANT …"
 */
export function getSharedWishlist(aId: number, bId: number): {
  artist_name: string;
  artist_img: string | null;
  album_cover_url: string | null;
  genre: string | null;
}[] {
  if (aId === bId) return [];
  const db = getDb();
  return db
    .prepare(
      `SELECT a.artist_name, a.artist_img, a.album_cover_url, a.genre
       FROM wishlist a
       JOIN wishlist b ON LOWER(a.artist_name) = LOWER(b.artist_name)
       WHERE a.user_id = ? AND b.user_id = ?
       ORDER BY a.artist_name COLLATE NOCASE`
    )
    .all(aId, bId) as {
    artist_name: string;
    artist_img: string | null;
    album_cover_url: string | null;
    genre: string | null;
  }[];
}
