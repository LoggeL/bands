'use client';

import Link from 'next/link';
import type { WishlistBuddy } from '@/lib/queries';
import { useDominantColor } from '@/lib/useDominantColor';

function BuddyRow({ buddy }: { buddy: WishlistBuddy }) {
  const tint = useDominantColor(buddy.album_cover_url || buddy.artist_img);
  const count = buddy.others.length;

  return (
    <li
      className="block p-4 relative"
      style={
        tint
          ? {
              borderLeftWidth: '4px',
              borderLeftColor: tint,
              backgroundImage: `linear-gradient(90deg, ${tint}18 0%, transparent 45%)`,
            }
          : undefined
      }
    >
      <div className="flex items-start gap-3">
        <div className="w-14 h-14 shrink-0 border border-rule-strong bg-paper-sunk overflow-hidden rounded-[4px]">
          {(buddy.album_cover_url || buddy.artist_img) && (
            <img
              src={`/api/img?url=${encodeURIComponent((buddy.album_cover_url || buddy.artist_img)!)}`}
              alt=""
              className="w-full h-full object-cover"
            />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <h3 className="font-semibold text-[1rem] truncate leading-tight">
              {buddy.artist_name}
            </h3>
            {buddy.genre && <span className="chip">{buddy.genre}</span>}
          </div>
          <p className="text-sm opacity-70 mt-1">
            {count === 1 ? 'Will 1 weitere Person' : `Wollen ${count} weitere Personen`}
          </p>
          <ul className="flex flex-wrap gap-1.5 mt-2">
            {buddy.others.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/${o.username}`}
                  className="mono text-[0.78rem] px-2 py-0.5 rounded-full border border-rule-strong hover:bg-mark-soft inline-block"
                >
                  @{o.username}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </li>
  );
}

export default function ConcertBuddies({
  buddies,
  heading = 'KONZERT-KUMPEL',
}: {
  buddies: WishlistBuddy[];
  heading?: string;
}) {
  if (buddies.length === 0) return null;

  const totalPeople = new Set(buddies.flatMap((b) => b.others.map((o) => o.id))).size;

  return (
    <section className="mb-8">
      <div className="flex items-baseline gap-3 flex-wrap mb-1">
        <h2 className="text-lg font-semibold tracking-tight">
          <span className="mark-soft">Konzert-Kumpel</span>
        </h2>
        <p className="text-sm opacity-70 mono-num">
          {buddies.length} {buddies.length === 1 ? 'Künstler' : 'Künstler'} · {totalPeople} {totalPeople === 1 ? 'Person' : 'Personen'}
        </p>
      </div>

      <p className="text-sm opacity-75 mb-4 max-w-lg leading-relaxed">
        Künstler, die du und andere live sehen wollt. Meld dich — plant ein Konzert zusammen.
      </p>

      <ul className="space-y-3">
        {buddies.map((b) => (
          <BuddyRow key={b.artist_name} buddy={b} />
        ))}
      </ul>
    </section>
  );
}
