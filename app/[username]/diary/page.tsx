import { getDb } from '@/lib/db';
import type { DiaryEntry } from '@/lib/db';
import { loadProfileContext } from '@/lib/profile';
import ProfileHeader from '@/components/shared/ProfileHeader';
import BlockedNotice from '@/components/shared/BlockedNotice';
import DiaryCard from '@/components/diary/DiaryCard';
import AddDiaryForm from '@/components/diary/AddDiaryForm';

export default async function DiaryPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const ctx = await loadProfileContext(username);

  const db = getDb();
  let entries: DiaryEntry[] = [];

  if (ctx.visible) {
    entries = db
      .prepare(
        'SELECT * FROM diary_entries WHERE user_id = ? ORDER BY listened_at DESC, created_at DESC'
      )
      .all(ctx.owner.id) as DiaryEntry[];
  }

  return (
    <div className="max-w-3xl mx-auto px-4 pb-16">
      <ProfileHeader
        user={ctx.owner}
        counts={ctx.counts}
        friendCount={ctx.friendCount}
        friendState={ctx.friendState}
        active="diary"
        isOwner={ctx.isOwner}
      />

      {!ctx.visible ? (
        <BlockedNotice visibility={ctx.owner.visibility} />
      ) : (
        <div className="space-y-4">
          {ctx.isOwner && <AddDiaryForm />}
          {entries.length === 0 ? (
            <div className="block p-6 text-center stripe">
              <p className="inline-block mark font-bold px-2">KEINE EINTRÄGE</p>
            </div>
          ) : (
            entries.map((e) => (
              <DiaryCard
                key={e.id}
                entry={e}
                authorUsername={ctx.owner.username}
                canEdit={ctx.isOwner}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
