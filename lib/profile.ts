import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { getDb } from './db';
import { getUserByToken } from './auth';
import { canView, friendCounts, friendState } from './queries';
import type { User } from './db';
import type { FriendState } from './queries';

export type ProfileContext = {
  owner: User;
  viewer: User | null;
  isOwner: boolean;
  visible: boolean;
  counts: { diary: number; live: number; wishlist: number; artists: number };
  friendCount: number;
  friendState: FriendState;
};

/** Load everything a profile page needs. Throws notFound() if user doesn't exist. */
export async function loadProfileContext(username: string): Promise<ProfileContext> {
  const db = getDb();
  const owner = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as User | undefined;
  if (!owner) notFound();

  const cookieStore = await cookies();
  const token = cookieStore.get('session-token')?.value;
  const viewer = token ? getUserByToken(token) : null;

  const isOwner = viewer?.id === owner.id;
  const visible = canView(viewer ? { id: viewer.id } : null, { id: owner.id, visibility: owner.visibility });

  const counts = {
    diary: (db.prepare('SELECT COUNT(*) AS n FROM diary_entries WHERE user_id=?').get(owner.id) as { n: number }).n,
    live: (db.prepare('SELECT COUNT(*) AS n FROM live_events WHERE user_id=?').get(owner.id) as { n: number }).n,
    wishlist: (db.prepare('SELECT COUNT(*) AS n FROM wishlist WHERE user_id=?').get(owner.id) as { n: number }).n,
    artists: (db
      .prepare(
        `SELECT COUNT(*) AS n FROM (
           SELECT LOWER(artist_name) AS k FROM wishlist WHERE user_id=?
           UNION
           SELECT LOWER(artist_name) AS k FROM live_events WHERE user_id=?
         )`
      )
      .get(owner.id, owner.id) as { n: number }).n,
  };

  const fc = friendCounts(owner.id);
  const fs = friendState(viewer?.id ?? null, owner.id);

  return {
    owner,
    viewer,
    isOwner,
    visible,
    counts,
    friendCount: fc.friends,
    friendState: fs,
  };
}
