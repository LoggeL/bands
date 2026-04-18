'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ArtistSearch, { type DeezerArtist } from '@/components/shared/ArtistSearch';

export default function AddBandForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function addArtist(artist: DeezerArtist) {
    setError('');
    setSaving(true);
    const res = await fetch('/api/wishlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        artist_name: artist.name,
        artist_img: artist.picture_medium || null,
      }),
    });
    setSaving(false);
    if (res.ok || res.status === 409) {
      // 409 = already on wishlist → treat as success for "anlegen" UX
      setOpen(false);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Anlegen fehlgeschlagen');
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn btn-solid w-full justify-center"
      >
        + Band anlegen
      </button>
    );
  }

  return (
    <div className="block p-4 space-y-3">
      <div className="flex items-center justify-between rule pb-2.5">
        <span className="font-semibold text-sm">Band anlegen</span>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError('');
          }}
          className="mono text-[0.78rem] underline hover:bg-mark-soft px-0.5"
        >
          abbrechen
        </button>
      </div>

      <ArtistSearch onSelect={addArtist} />

      <p className="mono text-[0.7rem] opacity-65">
        Lege eine Band auf die Wunschliste. Per Toggle auf der Karte markierst du sie später als gesehen.
      </p>

      {saving && <p className="text-xs opacity-70">speichere…</p>}
      {error && (
        <p className="text-xs">
          <span className="mark">! {error}</span>
        </p>
      )}
    </div>
  );
}
