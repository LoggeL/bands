import { loadProfileContext } from '@/lib/profile';
import ProfileHeader from '@/components/shared/ProfileHeader';
import BlockedNotice from '@/components/shared/BlockedNotice';

export default async function ProfileOverview({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const ctx = await loadProfileContext(username);

  return (
    <div className="max-w-3xl mx-auto px-4 pb-16">
      <ProfileHeader
        user={ctx.owner}
        counts={ctx.counts}
        friendCount={ctx.friendCount}
        friendState={ctx.friendState}
        active="overview"
        isOwner={ctx.isOwner}
      />

      {!ctx.visible ? (
        <BlockedNotice visibility={ctx.owner.visibility} />
      ) : (
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <Stat label="Tagebuch" value={ctx.counts.diary} hint="Einträge" />
          <Stat label="Bands" value={ctx.counts.artists} hint="gehört & gesehen" />
          <Stat label="Live" value={ctx.counts.live} hint="Konzerte" />
          <Stat label="Wunschliste" value={ctx.counts.wishlist} hint="Wünsche" />
          <Stat label="Freunde" value={ctx.friendCount} hint="bestätigt" />
        </section>
      )}
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <div className="block p-4 stripe">
      <p className="mono text-[0.66rem] uppercase tracking-[0.22em] opacity-70">{label}</p>
      <p className="serif text-[2.4rem] leading-none font-medium mono-num mt-2">{value}</p>
      <p className="text-[0.72rem] opacity-65 mt-1">{hint}</p>
    </div>
  );
}
