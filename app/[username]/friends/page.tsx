import Link from 'next/link';
import { loadProfileContext } from '@/lib/profile';
import { listFriends, listIncomingRequests, listOutgoingRequests } from '@/lib/queries';
import ProfileHeader from '@/components/shared/ProfileHeader';
import FriendButton from '@/components/social/FriendButton';
import { friendState } from '@/lib/queries';

function initials(name: string) {
  return (name || '')
    .split(/[\s&]+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('') || '×';
}

export default async function FriendsPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const ctx = await loadProfileContext(username);

  const friends = listFriends(ctx.owner.id);
  const incoming = ctx.isOwner ? listIncomingRequests(ctx.owner.id) : [];
  const outgoing = ctx.isOwner ? listOutgoingRequests(ctx.owner.id) : [];

  return (
    <div className="max-w-3xl mx-auto px-4 pb-16">
      <ProfileHeader
        user={ctx.owner}
        counts={ctx.counts}
        friendCount={ctx.friendCount}
        friendState={ctx.friendState}
        active="friends"
        isOwner={ctx.isOwner}
      />

      {ctx.isOwner && incoming.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs uppercase tracking-widest font-bold mb-3">
            EINGEHEND · {incoming.length}
          </h2>
          <ul className="space-y-2">
            {incoming.map((u) => (
              <li key={u.id} className="block p-3 flex items-center justify-between gap-3">
                <Link href={`/@${u.username}`} className="flex items-center gap-3 min-w-0 hover:bg-mark">
                  <div className="w-10 h-10 border-2 border-ink flex items-center justify-center font-black">
                    {initials(u.display_name || u.username)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate uppercase">{u.display_name || u.username}</p>
                    <p className="text-[0.7rem] opacity-60 truncate">@{u.username}</p>
                  </div>
                </Link>
                <FriendButton
                  targetUsername={u.username}
                  initialState={friendState(ctx.owner.id, u.id)}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {ctx.isOwner && outgoing.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs uppercase tracking-widest font-bold mb-3">
            AUSGEHEND · {outgoing.length}
          </h2>
          <ul className="space-y-2">
            {outgoing.map((u) => (
              <li key={u.id} className="block p-3 flex items-center justify-between gap-3">
                <Link href={`/@${u.username}`} className="flex items-center gap-3 min-w-0 hover:bg-mark">
                  <div className="w-10 h-10 border-2 border-ink flex items-center justify-center font-black">
                    {initials(u.display_name || u.username)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate uppercase">{u.display_name || u.username}</p>
                    <p className="text-[0.7rem] opacity-60 truncate">@{u.username}</p>
                  </div>
                </Link>
                <FriendButton
                  targetUsername={u.username}
                  initialState={friendState(ctx.owner.id, u.id)}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="text-xs uppercase tracking-widest font-bold mb-3">
          FREUNDE · {friends.length}
        </h2>
        {friends.length === 0 ? (
          <div className="block p-6 text-center stripe">
            <p className="inline-block mark font-bold px-2">NOCH KEINE FREUNDE</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {friends.map((u) => (
              <li key={u.id} className="block p-3 flex items-center justify-between gap-3">
                <Link href={`/@${u.username}`} className="flex items-center gap-3 min-w-0 hover:bg-mark">
                  <div className="w-10 h-10 border-2 border-ink flex items-center justify-center font-black">
                    {initials(u.display_name || u.username)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate uppercase">{u.display_name || u.username}</p>
                    <p className="text-[0.7rem] opacity-60 truncate">@{u.username}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
