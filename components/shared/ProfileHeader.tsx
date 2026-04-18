import Link from 'next/link';
import type { User } from '@/lib/db';
import type { FriendState } from '@/lib/queries';
import FriendButton from '@/components/social/FriendButton';
import LogoutButton from '@/components/social/LogoutButton';
import UserAvatar from './UserAvatar';

export default function ProfileHeader({
  user,
  counts,
  friendCount,
  friendState,
  active,
  isOwner = false,
}: {
  user: User;
  counts: { diary: number; live: number; wishlist: number; artists: number };
  friendCount: number;
  friendState: FriendState;
  active: 'overview' | 'diary' | 'bands' | 'friends';
  isOwner?: boolean;
}) {
  const tabs: { key: typeof active; label: string; href: string }[] = [
    { key: 'overview', label: 'ÜBERSICHT', href: `/@${user.username}` },
    { key: 'diary', label: `TAGEBUCH · ${counts.diary}`, href: `/@${user.username}/diary` },
    { key: 'bands', label: `BANDS · ${counts.artists}`, href: `/@${user.username}/wishlist` },
    { key: 'friends', label: `FREUNDE · ${friendCount}`, href: `/@${user.username}/friends` },
  ];

  const visLabel =
    user.visibility === 'public' ? 'Öffentlich' : user.visibility === 'friends' ? 'Nur Freunde' : 'Privat';

  return (
    <header className="rule-2 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 py-5">
        <div className="flex items-start gap-4 min-w-0">
          <UserAvatar
            username={user.username}
            displayName={user.display_name}
            avatarUrl={user.avatar_url}
            size={72}
          />
          <div className="min-w-0">
            <h1 className="text-3xl sm:text-4xl font-bold leading-tight tracking-tight break-words">
              {user.display_name || user.username}
            </h1>
            <p className="text-sm mt-1 flex items-center gap-2 flex-wrap">
              <span className="mono opacity-70">@{user.username}</span>
              <span className="chip">{visLabel}</span>
            </p>
            {user.bio && <p className="text-sm mt-3 max-w-lg opacity-85 leading-relaxed">{user.bio}</p>}
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-2 flex-wrap">
          {isOwner ? (
            <>
              <Link href="/settings" className="btn">
                Einstellungen
              </Link>
              <LogoutButton className="btn" />
            </>
          ) : (
            <FriendButton targetUsername={user.username} initialState={friendState} />
          )}
        </div>
      </div>

      <nav className="flex flex-wrap gap-x-4 gap-y-1 -mb-px">
        {tabs.map((t) => {
          const on = t.key === active;
          return (
            <Link
              key={t.key}
              href={t.href}
              className={`text-[0.78rem] mono py-2 border-b-2 transition-colors ${
                on
                  ? 'border-ink font-semibold'
                  : 'border-transparent opacity-65 hover:opacity-100 hover:border-rule'
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
