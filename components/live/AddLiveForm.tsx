'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ArtistSearch, { type DeezerArtist } from '@/components/shared/ArtistSearch';
import TrackSearch, { type DeezerTrack } from '@/components/shared/TrackSearch';

const EMPTY = {
  artist_name: '',
  artist_img: '',
  album_cover_url: '',
  genre: '',
  venue: '',
  event_date: '',
  note: '',
  track_title: '',
  preview_url: '',
};

export default function AddLiveForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [artist, setArtist] = useState<DeezerArtist | null>(null);
  const [form, setForm] = useState({ ...EMPTY });

  function reset() {
    setArtist(null);
    setForm({ ...EMPTY });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.artist_name) return;
    setSaving(true);
    const res = await fetch('/api/live', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        artist_name: form.artist_name,
        artist_img: form.artist_img || null,
        album_cover_url: form.album_cover_url || null,
        genre: form.genre || null,
        venue: form.venue || null,
        event_date: form.event_date || null,
        note: form.note || null,
        track_title: form.track_title || null,
        preview_url: form.preview_url || null,
      }),
    });
    setSaving(false);
    if (res.ok) {
      reset();
      setOpen(false);
      router.refresh();
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn btn-solid w-full justify-center">
        + Konzert eintragen
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="block p-4 space-y-3">
      <div className="flex items-center justify-between rule pb-2.5">
        <span className="font-semibold text-sm">Neues Konzert</span>
        <button type="button" onClick={() => { setOpen(false); reset(); }} className="mono text-[0.78rem] underline hover:bg-mark-soft px-0.5">
          abbrechen
        </button>
      </div>

      {artist && (
        <div className="flex items-center gap-2 border border-rule-strong rounded-[4px] p-2 bg-paper-sunk">
          <img src={artist.picture_medium} alt={artist.name} className="w-8 h-8 object-cover rounded-[3px]" />
          <span className="text-sm font-semibold truncate flex-1">{artist.name}</span>
          <button
            type="button"
            onClick={() => { setArtist(null); setForm((p) => ({ ...p, artist_name: '', artist_img: '' })); }}
            className="mono text-[0.72rem] underline"
          >
            ändern
          </button>
        </div>
      )}

      {!artist && (
        <ArtistSearch
          onSelect={(a) => {
            setArtist(a);
            setForm((p) => ({ ...p, artist_name: a.name, artist_img: a.picture_medium }));
          }}
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <input
          value={form.venue}
          onChange={(e) => setForm((p) => ({ ...p, venue: e.target.value }))}
          placeholder="Venue"
        />
        <input
          type="date"
          value={form.event_date}
          onChange={(e) => setForm((p) => ({ ...p, event_date: e.target.value }))}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <input
          value={form.genre}
          onChange={(e) => setForm((p) => ({ ...p, genre: e.target.value }))}
          placeholder="Genre"
        />
      </div>

      {artist && (
        <TrackSearch
          artistName={form.artist_name}
          onSelect={(t: DeezerTrack) =>
            setForm((p) => ({
              ...p,
              track_title: t.title,
              preview_url: t.preview || '',
              album_cover_url: t.album.cover_big || t.album.cover_medium || '',
            }))
          }
        />
      )}

      <input
        value={form.note}
        onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
        placeholder="NOTIZ"
      />

      <div className="flex gap-2 justify-end rule-t pt-2">
        <button type="submit" disabled={saving} className="btn btn-solid">
          {saving ? (
            <>
              <span
                aria-hidden
                className="inline-block w-[10px] h-[10px] border border-current border-r-transparent rounded-full animate-spin"
              />
              <span>SPEICHERE…</span>
            </>
          ) : (
            'SPEICHERN'
          )}
        </button>
      </div>
    </form>
  );
}
