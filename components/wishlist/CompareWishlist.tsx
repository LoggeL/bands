'use client';

import { useState } from 'react';
import type { WishlistItem } from '@/lib/db';
import ArtistAvatar from '@/components/shared/ArtistAvatar';

type CompareResult = {
  user: { username: string; display_name: string | null };
  otherUser: { username: string; display_name: string | null };
  myWishlist: WishlistItem[];
  otherWishlist: WishlistItem[];
  matches: WishlistItem[];
};

export default function CompareWishlist({
  viewerId,
  otherId,
  otherUsername,
}: {
  viewerId: number;
  otherId: number;
  otherUsername: string;
}) {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<CompareResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    if (result || loading) return;

    setLoading(true);
    setError('');
    const res = await fetch(`/api/wishlist/compare?userId=${viewerId}&otherUserId=${otherId}`);
    setLoading(false);
    if (res.ok) {
      setResult((await res.json()) as CompareResult);
    } else {
      const err = await res.json().catch(() => ({}));
      setError(err.error || 'Vergleich fehlgeschlagen');
    }
  }

  return (
    <>
      <button onClick={toggle} className="btn">
        ◇ {open ? 'VERGLEICH SCHLIESSEN' : 'VERGLEICHEN'}
      </button>

      {open && (
        <div className="block p-3 mt-3 space-y-3 w-full">
          {loading && <p className="text-xs opacity-70 mono">lade vergleich…</p>}
          {error && <p className="text-xs"><span className="mark">! {error}</span></p>}

          {result && (
            <>
              <div className="flex items-center gap-2 flex-wrap text-sm">
                <span className="mono text-[0.72rem] uppercase tracking-wider">Du</span>
                <span className="mono text-[0.72rem] opacity-55">vs</span>
                <span className="mono text-[0.72rem] uppercase tracking-wider">
                  @{otherUsername}
                </span>
                <span className="ml-auto mono-num text-[0.72rem] opacity-70">
                  {result.myWishlist.length} · {result.otherWishlist.length}
                </span>
              </div>

              {result.matches.length > 0 ? (
                <div className="space-y-1.5">
                  <p className="mono text-[0.68rem] uppercase tracking-[0.22em] opacity-75">
                    {result.matches.length} gemeinsame{' '}
                    {result.matches.length === 1 ? 'Band' : 'Bands'}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {result.matches.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center gap-2 border border-rule-strong rounded-[4px] p-1.5"
                      >
                        <ArtistAvatar name={m.artist_name} img={m.artist_img} size={28} />
                        <span className="text-sm truncate flex-1">{m.artist_name}</span>
                        <span className="chip chip-solid shrink-0">MATCH</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm opacity-70">
                  Keine gemeinsamen Bands auf den Wunschlisten.
                </p>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}
