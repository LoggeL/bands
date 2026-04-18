import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getDb } from '@/lib/db';
import type { DiaryEntry, User } from '@/lib/db';
import { canView } from '@/lib/queries';
import { cookies } from 'next/headers';
import { getUserByToken } from '@/lib/auth';
import DiaryCard from '@/components/diary/DiaryCard';

async function load(username: string, idStr: string) {
  const id = parseInt(idStr, 10);
  if (isNaN(id)) return null;

  const db = getDb();
  const owner = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as User | undefined;
  if (!owner) return null;

  const entry = db
    .prepare('SELECT * FROM diary_entries WHERE id = ? AND user_id = ?')
    .get(id, owner.id) as DiaryEntry | undefined;
  if (!entry) return null;

  const cookieStore = await cookies();
  const token = cookieStore.get('session-token')?.value;
  const viewer = token ? getUserByToken(token) : null;

  if (!canView(viewer ? { id: viewer.id } : null, owner)) return null;

  return { owner, entry, viewer };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string; id: string }>;
}): Promise<Metadata> {
  const { username, id } = await params;
  const data = await load(username, id);
  if (!data) return { title: 'SETLIST' };
  return {
    title: `${data.entry.artist_name} — ${data.entry.track_title} · @${data.owner.username}`,
    description: data.entry.note || `Tagebucheintrag von ${data.owner.display_name || data.owner.username}.`,
  };
}

export default async function DiaryEntryPage({
  params,
}: {
  params: Promise<{ username: string; id: string }>;
}) {
  const { username, id } = await params;
  const data = await load(username, id);
  if (!data) notFound();

  return (
    <div className="max-w-2xl mx-auto px-4 pb-16">
      <div className="rule-t-2 py-3 mb-6 mt-2">
        <Link href={`/@${data.owner.username}/diary`} className="text-xs underline">
          ← @{data.owner.username} TAGEBUCH
        </Link>
      </div>

      <DiaryCard
        entry={data.entry}
        authorUsername={data.owner.username}
      />
    </div>
  );
}
