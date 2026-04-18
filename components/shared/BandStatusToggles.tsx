'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ArtistSummary } from '@/lib/queries';

/**
 * Two-position toggle: WILL SEHEN ↔ GESEHEN. "Seen" wins when the band is
 * both wishlisted and has live events. Clicking the inactive half switches
 * state; clicking the active half is a no-op.
 */
export default function BandStatusToggles({ artist }: { artist: ArtistSummary }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const seen = artist.live_events.length > 0;
  const seenCount = artist.live_events.length;
  const want = !seen && artist.wishlist_id !== null;

  const payload = {
    artist_name: artist.artist_name,
    artist_img: artist.artist_img,
    album_cover_url: artist.album_cover_url,
    genre: artist.genre,
    track_title: artist.track_title,
    preview_url: artist.preview_url,
  };

  async function setWant() {
    if (want || busy) return;
    setBusy(true);
    // Remove any live_events first, then ensure a wishlist row exists.
    if (seen) {
      await fetch('/api/live', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artist_name: artist.artist_name }),
      });
    }
    if (!artist.wishlist_id) {
      await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }
    setBusy(false);
    router.refresh();
  }

  async function setSeen() {
    if (seen || busy) return;
    setBusy(true);
    // Mark as seen by creating a live_event with today's date; drop the
    // redundant wishlist row so the card shows one clean state.
    await fetch('/api/live', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        event_date: new Date().toISOString().slice(0, 10),
      }),
    });
    if (artist.wishlist_id) {
      await fetch('/api/wishlist', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artist_name: artist.artist_name }),
      });
    }
    setBusy(false);
    router.refresh();
  }

  const base =
    'mono text-[0.68rem] uppercase tracking-[0.04em] py-1 px-2 leading-none border border-rule-strong transition-colors disabled:opacity-50';

  return (
    <div className="inline-flex mt-2 rounded-[4px] overflow-hidden">
      <button
        type="button"
        onClick={setWant}
        disabled={busy || want}
        aria-pressed={want}
        title="Auf die Wunschliste setzen"
        className={`${base} rounded-l-[3px] ${
          want
            ? 'bg-ember text-paper border-ember cursor-default'
            : 'bg-paper hover:bg-mark-soft cursor-pointer'
        }`}
      >
        {busy && !want ? '…' : 'Will sehen'}
      </button>
      <button
        type="button"
        onClick={setSeen}
        disabled={busy || seen}
        aria-pressed={seen}
        title="Als live gesehen markieren"
        className={`${base} -ml-px rounded-r-[3px] ${
          seen
            ? 'bg-ink text-paper border-ink cursor-default'
            : 'bg-paper hover:bg-mark-soft cursor-pointer'
        }`}
      >
        {busy && !seen ? '…' : `Gesehen${seenCount > 1 ? ` ×${seenCount}` : ''}`}
      </button>
    </div>
  );
}
