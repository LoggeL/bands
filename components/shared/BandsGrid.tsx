'use client';

import { useMemo, useState } from 'react';
import type { ArtistSummary } from '@/lib/queries';
import ArtistCard from './ArtistCard';

type Filter = 'all' | 'seen' | 'unseen';
type Sort = 'added' | 'alpha';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'ALLE' },
  { value: 'seen', label: 'GESEHEN' },
  { value: 'unseen', label: 'WILL SEHEN' },
];

const SORTS: { value: Sort; label: string }[] = [
  { value: 'added', label: 'Zuletzt hinzugefügt' },
  { value: 'alpha', label: 'Alphabetisch' },
];

export default function BandsGrid({
  artists,
  ownerUsername,
  showAddToWishlist,
}: {
  artists: ArtistSummary[];
  ownerUsername: string;
  showAddToWishlist: boolean;
}) {
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<Sort>('added');

  const counts = useMemo(() => {
    let seen = 0;
    let unseen = 0;
    for (const a of artists) {
      if (a.live_events.length > 0) seen++;
      else unseen++;
    }
    return { all: artists.length, seen, unseen };
  }, [artists]);

  const visible = useMemo(() => {
    const filtered = artists.filter((a) => {
      if (filter === 'seen') return a.live_events.length > 0;
      if (filter === 'unseen') return a.live_events.length === 0;
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sort === 'alpha') return a.artist_name.localeCompare(b.artist_name);
      // added: newest added row (wishlist or live) first, then alpha tie-break
      const aa = a.added_at || '';
      const bb = b.added_at || '';
      if (aa !== bb) return aa < bb ? 1 : -1;
      return a.artist_name.localeCompare(b.artist_name);
    });
  }, [artists, filter, sort]);

  return (
    <>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-1 text-xs flex-wrap">
          {FILTERS.map((f) => {
            const n = counts[f.value];
            const on = filter === f.value;
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => setFilter(f.value)}
                className={`mono text-[0.7rem] py-1 px-2 rounded-[3px] border border-rule-strong inline-flex items-center gap-1.5 transition-colors ${
                  on
                    ? 'bg-ink text-paper hover:bg-ink-soft'
                    : 'opacity-75 hover:opacity-100 hover:bg-mark-soft'
                }`}
              >
                <span>{f.label}</span>
                <span className="mono-num opacity-70">{n}</span>
              </button>
            );
          })}
        </div>

        <label className="flex items-center gap-2 text-[0.7rem] mono uppercase tracking-wider opacity-75">
          <span>Sortieren</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="w-auto text-[0.8rem] py-0.5 px-1.5"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {visible.length === 0 ? (
        <div className="block p-6 text-center stripe">
          <p className="inline-block mark font-bold px-2">KEINE TREFFER</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {visible.map((a) => (
            <ArtistCard
              key={a.artist_name.toLowerCase()}
              artist={a}
              ownerUsername={ownerUsername}
              showAddToWishlist={showAddToWishlist}
            />
          ))}
        </div>
      )}
    </>
  );
}
