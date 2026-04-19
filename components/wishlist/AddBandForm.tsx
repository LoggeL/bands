'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SongSearch, { type SongPick } from '@/components/shared/SongSearch';
import AudioButton from '@/components/shared/AudioButton';

type Preview = SongPick & { genre: string | null; genreLoading: boolean };

export default function AddBandForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<Preview | null>(null);

  useEffect(() => {
    if (!preview || !preview.genreLoading) return;
    let cancelled = false;
    (async () => {
      let genre: string | null = null;
      if (preview.album_id) {
        try {
          const r = await fetch(`/api/deezer/album/${preview.album_id}`);
          if (r.ok) {
            const data = await r.json();
            genre = data.genre ?? null;
          }
        } catch {
          // non-fatal
        }
      }
      if (!cancelled) {
        setPreview((p) => (p && p.album_id === preview.album_id ? { ...p, genre, genreLoading: false } : p));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [preview]);

  function pickSong(song: SongPick) {
    setError('');
    setPreview({ ...song, genre: null, genreLoading: true });
  }

  async function confirm() {
    if (!preview || saving) return;
    setError('');
    setSaving(true);
    const res = await fetch('/api/wishlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        artist_name: preview.artist_name,
        artist_img: preview.artist_img || null,
        album_cover_url: preview.album_cover_url || null,
        genre: preview.genre,
        track_title: preview.track_title || null,
        preview_url: preview.preview_url || null,
      }),
    });
    setSaving(false);
    if (res.ok || res.status === 409) {
      setOpen(false);
      setPreview(null);
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
            setPreview(null);
            setError('');
          }}
          className="mono text-[0.78rem] underline hover:bg-mark-soft px-0.5"
        >
          abbrechen
        </button>
      </div>

      {!preview ? (
        <>
          <SongSearch
            onSelect={pickSong}
            placeholder="Song suchen — legt Band + Track auf die Wunschliste"
          />
          <p className="mono text-[0.7rem] opacity-65">
            Such einen repräsentativen Song — Künstler, Cover und 30s-Preview kommen
            automatisch mit auf die Wunschliste. Per Toggle auf der Karte markierst
            du die Band später als gesehen.
          </p>
        </>
      ) : (
        <div className="space-y-3">
          <div className="flex gap-3 items-center">
            {preview.album_cover_url && (
              <img
                src={preview.album_cover_url}
                alt=""
                className="w-16 h-16 object-cover rounded-[3px] shrink-0 border border-rule-strong"
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate">{preview.artist_name}</div>
              <div className="text-[0.82rem] opacity-80 truncate">{preview.track_title}</div>
              <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                {preview.genreLoading ? (
                  <span className="mono text-[0.65rem] opacity-60">Genre…</span>
                ) : preview.genre ? (
                  <span className="chip">{preview.genre}</span>
                ) : (
                  <span className="mono text-[0.65rem] opacity-50">kein Genre</span>
                )}
              </div>
            </div>
            <AudioButton src={preview.preview_url} label="Vorschau" />
          </div>

          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={() => setPreview(null)}
              disabled={saving}
              className="mono text-[0.78rem] underline hover:bg-mark-soft px-0.5 disabled:opacity-50"
            >
              anderer Song
            </button>
            <button
              type="button"
              onClick={confirm}
              disabled={saving}
              className="btn btn-solid disabled:opacity-70"
            >
              {saving ? 'speichere…' : 'Zur Wunschliste'}
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs">
          <span className="mark">! {error}</span>
        </p>
      )}
    </div>
  );
}
