import { getDb } from '@/lib/db';
import Link from 'next/link';

type UserStats = {
  id: number;
  username: string;
  display_name: string | null;
  bio: string | null;
  diary_count: number;
  live_count: number;
  wishlist_count: number;
};

function hue(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return h;
}

export default function HomePage() {
  const db = getDb();

  const users = db
    .prepare(
      `SELECT
        u.id, u.username, u.display_name, u.bio,
        (SELECT COUNT(*) FROM diary_entries WHERE user_id = u.id) AS diary_count,
        (SELECT COUNT(*) FROM live_events WHERE user_id = u.id) AS live_count,
        (SELECT COUNT(*) FROM wishlist WHERE user_id = u.id) AS wishlist_count
      FROM users u
      ORDER BY diary_count DESC, u.created_at ASC`
    )
    .all() as UserStats[];

  return (
    <div className="max-w-5xl mx-auto px-4 pb-16">
      <div className="py-12 text-center">
        <h2 className="text-4xl font-black font-[family-name:var(--font-display)] uppercase tracking-tight mb-2">
          Music Diaries
        </h2>
        <p className="text-text-muted text-sm">
          {users.length === 0
            ? 'Be the first to create an account and start your diary.'
            : `${users.length} ${users.length === 1 ? 'person is' : 'people are'} tracking their music.`}
        </p>
      </div>

      {users.length === 0 ? (
        <div className="text-center py-16">
          <span className="material-symbols-outlined text-5xl text-text-muted mb-4 block">
            library_music
          </span>
          <Link
            href="/signup"
            className="inline-block px-6 py-3 bg-pink text-bg-card rounded-xl font-bold hover:opacity-90 transition-opacity"
          >
            Create your diary
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((user) => {
            const initial = (user.display_name || user.username)[0].toUpperCase();
            const h = hue(user.username);
            return (
              <Link
                key={user.id}
                href={`/${user.username}`}
                className="glass rounded-2xl p-5 hover:bg-bg-hover transition-colors group animate-fade-in"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-black text-white shrink-0"
                    style={{
                      background: `linear-gradient(135deg, hsl(${h},70%,55%), hsl(${(h + 60) % 360},70%,55%))`,
                    }}
                  >
                    {initial}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm truncate group-hover:text-pink transition-colors">
                      {user.display_name || user.username}
                    </h3>
                    <p className="text-xs text-text-muted truncate">@{user.username}</p>
                  </div>
                </div>

                {user.bio && (
                  <p className="text-xs text-text-muted mb-4 line-clamp-2">{user.bio}</p>
                )}

                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center">
                    <div className="text-lg font-black font-[family-name:var(--font-display)] text-pink">
                      {user.diary_count}
                    </div>
                    <div className="text-[0.6rem] text-text-muted uppercase tracking-wider">Diary</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-black font-[family-name:var(--font-display)] text-green">
                      {user.live_count}
                    </div>
                    <div className="text-[0.6rem] text-text-muted uppercase tracking-wider">Concerts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-black font-[family-name:var(--font-display)] text-cyan">
                      {user.wishlist_count}
                    </div>
                    <div className="text-[0.6rem] text-text-muted uppercase tracking-wider">Wishlist</div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
