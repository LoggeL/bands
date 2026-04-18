import Link from 'next/link';
import { getDb } from '@/lib/db';
import ExploreUserCard from './ExploreUserCard';

type UserStats = {
  id: number;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  visibility: 'public' | 'friends' | 'private';
  diary_count: number;
  live_count: number;
  wishlist_count: number;
};

export default function ExplorePage() {
  const db = getDb();

  const users = db
    .prepare(
      `SELECT
        u.id, u.username, u.display_name, u.bio, u.avatar_url, u.visibility,
        (SELECT COUNT(*) FROM diary_entries WHERE user_id = u.id) AS diary_count,
        (SELECT COUNT(*) FROM live_events WHERE user_id = u.id) AS live_count,
        (SELECT COUNT(*) FROM wishlist WHERE user_id = u.id) AS wishlist_count
      FROM users u
      ORDER BY diary_count DESC, u.created_at ASC`
    )
    .all() as UserStats[];

  return (
    <div className="max-w-5xl mx-auto px-4 pb-16">
      <div className="py-5 mb-4 flex items-baseline justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Entdecken</h1>
          <p className="text-sm opacity-70">Alle, die ein Tagebuch führen.</p>
        </div>
        <p className="text-xs opacity-60 mono-num">
          {users.length} {users.length === 1 ? 'Person' : 'Personen'}
        </p>
      </div>

      {users.length === 0 ? (
        <div className="block p-8 text-center stripe">
          <p className="text-base font-semibold">Noch niemand hier</p>
          <Link href="/signup" className="btn btn-solid mt-4">
            Tagebuch starten
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {users.map((u) => (
            <ExploreUserCard key={u.id} user={u} />
          ))}
        </div>
      )}
    </div>
  );
}
