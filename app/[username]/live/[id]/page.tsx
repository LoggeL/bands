import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getDb } from '@/lib/db';
import type { LiveEvent, User } from '@/lib/db';
import { canView } from '@/lib/queries';
import { cookies } from 'next/headers';
import { getUserByToken } from '@/lib/auth';
import LiveCard from '@/components/live/LiveCard';

async function load(username: string, idStr: string) {
  const id = parseInt(idStr, 10);
  if (isNaN(id)) return null;

  const db = getDb();
  const owner = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as User | undefined;
  if (!owner) return null;

  const event = db
    .prepare('SELECT * FROM live_events WHERE id = ? AND user_id = ?')
    .get(id, owner.id) as LiveEvent | undefined;
  if (!event) return null;

  const cookieStore = await cookies();
  const token = cookieStore.get('session-token')?.value;
  const viewer = token ? getUserByToken(token) : null;

  if (!canView(viewer ? { id: viewer.id } : null, owner)) return null;

  return { owner, event };
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
    title: `${data.event.artist_name} LIVE · @${data.owner.username}`,
    description: data.event.venue || `${data.owner.display_name || data.owner.username} hat ${data.event.artist_name} live gesehen.`,
  };
}

export default async function LiveEventPage({
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
        <Link href={`/@${data.owner.username}/live`} className="text-xs underline">
          ← @{data.owner.username} LIVE
        </Link>
      </div>

      <LiveCard event={data.event} authorUsername={data.owner.username} />

      {data.event.note && (
        <div className="block p-4 mt-4">
          <p className="text-[0.7rem] uppercase tracking-wider font-bold rule pb-1 mb-2">NOTIZ</p>
          <p className="text-sm italic">&ldquo;{data.event.note}&rdquo;</p>
        </div>
      )}
    </div>
  );
}
