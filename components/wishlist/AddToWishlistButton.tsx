'use client';

import { useState } from 'react';

export default function AddToWishlistButton({
  artist_name,
  artist_img,
  album_cover_url,
  genre,
  track_title,
  preview_url,
}: {
  artist_name: string;
  artist_img: string | null;
  album_cover_url?: string | null;
  genre: string | null;
  track_title: string | null;
  preview_url: string | null;
}) {
  const [status, setStatus] = useState<'idle' | 'saving' | 'done' | 'exists' | 'denied'>('idle');

  async function add() {
    setStatus('saving');
    const res = await fetch('/api/wishlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ artist_name, artist_img, album_cover_url, genre, track_title, preview_url }),
    });
    if (res.status === 401) setStatus('denied');
    else if (res.status === 409) setStatus('exists');
    else if (res.ok) setStatus('done');
    else setStatus('idle');
  }

  if (status === 'done') return <span className="text-[0.7rem] mark">✓ HINZUGEFÜGT</span>;
  if (status === 'exists') return <span className="text-[0.7rem] opacity-60">✓ AUF LISTE</span>;
  if (status === 'denied') return <span className="text-[0.7rem] opacity-60">EINLOGGEN ZUM HINZUFÜGEN</span>;

  return (
    <button
      type="button"
      onClick={add}
      disabled={status === 'saving'}
      className="text-[0.7rem] underline hover:bg-mark px-0.5 inline-flex items-center gap-1"
    >
      {status === 'saving' ? (
        <>
          <span
            aria-hidden
            className="inline-block w-[8px] h-[8px] border border-current border-r-transparent rounded-full animate-spin"
          />
          <span>FÜGE HINZU…</span>
        </>
      ) : (
        '+ WUNSCHLISTE'
      )}
    </button>
  );
}
