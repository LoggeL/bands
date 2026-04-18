import { loadProfileContext } from '@/lib/profile';
import { getArtistSummary, getWishlistBuddies, getSharedWishlist } from '@/lib/queries';
import ProfileHeader from '@/components/shared/ProfileHeader';
import BlockedNotice from '@/components/shared/BlockedNotice';
import BandsGrid from '@/components/shared/BandsGrid';
import CompareWishlist from '@/components/wishlist/CompareWishlist';
import ConcertBuddies from '@/components/wishlist/ConcertBuddies';
import SharedWishlistCallout from '@/components/wishlist/SharedWishlistCallout';
import AddLiveForm from '@/components/live/AddLiveForm';

export default async function BandsPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const ctx = await loadProfileContext(username);

  const artists = ctx.visible ? getArtistSummary(ctx.owner.id) : [];

  const buddies =
    ctx.visible && ctx.isOwner
      ? getWishlistBuddies(ctx.owner.id, ctx.viewer?.id ?? null)
      : [];

  const shared =
    ctx.visible && ctx.viewer && !ctx.isOwner
      ? getSharedWishlist(ctx.viewer.id, ctx.owner.id)
      : [];

  const seenCount = artists.filter((a) => a.live_events.length > 0).length;
  const wantCount = artists.filter((a) => a.wishlist_id !== null).length;

  return (
    <div className="max-w-5xl mx-auto px-4 pb-16">
      <ProfileHeader
        user={ctx.owner}
        counts={ctx.counts}
        friendCount={ctx.friendCount}
        friendState={ctx.friendState}
        active="bands"
        isOwner={ctx.isOwner}
      />

      {!ctx.visible ? (
        <BlockedNotice visibility={ctx.owner.visibility} />
      ) : (
        <div className="space-y-4">
          {shared.length > 0 && ctx.viewer && (
            <SharedWishlistCallout
              otherUsername={ctx.owner.username}
              otherDisplayName={ctx.owner.display_name}
              shared={shared}
            />
          )}

          {buddies.length > 0 && <ConcertBuddies buddies={buddies} />}

          {ctx.isOwner && <AddLiveForm />}

          <div className="rule-t-2 pt-4 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-baseline gap-3 flex-wrap">
              <h2 className="text-xs uppercase tracking-widest font-bold">
                {ctx.isOwner ? 'DEINE' : `@${ctx.owner.username}`} BANDS · {artists.length}
              </h2>
              <span className="mono text-[0.7rem] opacity-65">
                {seenCount} gesehen · {wantCount} auf der Wunschliste
              </span>
            </div>
            {ctx.viewer && !ctx.isOwner && (
              <CompareWishlist
                viewerId={ctx.viewer.id}
                otherId={ctx.owner.id}
                otherUsername={ctx.owner.username}
              />
            )}
          </div>

          {artists.length === 0 ? (
            <div className="block p-6 text-center stripe">
              <p className="inline-block mark font-bold px-2">
                {ctx.isOwner ? 'NOCH KEINE BANDS' : 'NICHTS HIER'}
              </p>
            </div>
          ) : (
            <BandsGrid
              artists={artists}
              ownerUsername={ctx.owner.username}
              showAddToWishlist={!ctx.isOwner && !!ctx.viewer}
            />
          )}
        </div>
      )}
    </div>
  );
}
