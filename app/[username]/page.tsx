import { getDb } from '@/lib/db';
import type { User, DiaryEntry, LiveEvent, WishlistItem, Reaction } from '@/lib/db';
import { notFound } from 'next/navigation';
import ProfileClient from '@/components/ProfileClient';

type DiaryWithReactions = DiaryEntry & { reactions: Reaction[] };

const VALID_TABS = new Set(['overview', 'diary', 'live', 'wishlist']);

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams?: Promise<{ tab?: string }>;
}) {
  const { username } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const initialTab = VALID_TABS.has(resolvedSearchParams?.tab || '')
    ? (resolvedSearchParams?.tab as 'overview' | 'diary' | 'live' | 'wishlist')
    : 'overview';

  const db = getDb();

  const user = db
    .prepare('SELECT * FROM users WHERE username = ?')
    .get(username) as User | undefined;

  if (!user) notFound();

  const diary = db
    .prepare('SELECT * FROM diary_entries WHERE user_id = ? ORDER BY listened_at DESC')
    .all(user.id) as DiaryEntry[];

  const reactions = diary.length > 0
    ? (db
        .prepare(
          `SELECT * FROM reactions WHERE diary_entry_id IN (${diary.map(() => '?').join(',')})`
        )
        .all(...diary.map((d) => d.id)) as Reaction[])
    : [];

  const diaryWithReactions: DiaryWithReactions[] = diary.map((entry) => ({
    ...entry,
    reactions: reactions.filter((r) => r.diary_entry_id === entry.id),
  }));

  const live = db
    .prepare('SELECT * FROM live_events WHERE user_id = ? ORDER BY created_at DESC')
    .all(user.id) as LiveEvent[];

  const wishlist = db
    .prepare('SELECT * FROM wishlist WHERE user_id = ? ORDER BY artist_name ASC')
    .all(user.id) as WishlistItem[];

  return (
    <ProfileClient
      user={user}
      diary={diaryWithReactions}
      live={live}
      wishlist={wishlist}
      initialTab={initialTab}
    />
  );
}
