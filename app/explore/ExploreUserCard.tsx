'use client';

import Link from 'next/link';
import { useDominantColor } from '@/lib/useDominantColor';
import UserAvatar from '@/components/shared/UserAvatar';

export default function ExploreUserCard({
  user,
}: {
  user: {
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
}) {
  const tint = useDominantColor(user.avatar_url);
  const vis =
    user.visibility === 'public'
      ? null
      : user.visibility === 'friends'
        ? 'Nur Freunde'
        : 'Privat';

  return (
    <Link
      href={`/${user.username}`}
      className="block p-4 hover:bg-mark-soft"
      style={
        tint
          ? {
              borderLeftWidth: '4px',
              borderLeftColor: tint,
              backgroundColor: `${tint}26`,
            }
          : undefined
      }
    >
      <div className="flex items-center gap-3 mb-3">
        <UserAvatar
          username={user.username}
          displayName={user.display_name}
          avatarUrl={user.avatar_url}
          size={44}
        />
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-[0.95rem] truncate leading-tight">
            {user.display_name || user.username}
          </h3>
          <p className="mono text-[0.72rem] opacity-60 truncate">@{user.username}</p>
        </div>
        {vis && <span className="chip">{vis}</span>}
      </div>

      {user.bio && (
        <p className="text-sm mb-3 line-clamp-2 opacity-80 leading-relaxed">{user.bio}</p>
      )}

      <div className="grid grid-cols-3 gap-2 rule-t pt-3 mono-num">
        <div>
          <div className="text-sm font-semibold">{user.diary_count}</div>
          <div className="text-[0.65rem] opacity-55">tagebuch</div>
        </div>
        <div>
          <div className="text-sm font-semibold">{user.live_count}</div>
          <div className="text-[0.65rem] opacity-55">live</div>
        </div>
        <div>
          <div className="text-sm font-semibold">{user.wishlist_count}</div>
          <div className="text-[0.65rem] opacity-55">wünsche</div>
        </div>
      </div>
    </Link>
  );
}
