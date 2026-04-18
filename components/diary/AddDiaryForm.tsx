'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import SongSearch, { type SongPick } from '@/components/shared/SongSearch';
import AudioButton from '@/components/shared/AudioButton';

const EMPTY = {
  artist_name: '',
  artist_img: '',
  album_cover_url: '',
  track_title: '',
  genre: '',
  preview_url: '',
  note: '',
  listened_at: new Date().toISOString().split('T')[0],
};

export default function AddDiaryForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [picked, setPicked] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });

  function reset() {
    setPicked(false);
    setForm({ ...EMPTY, listened_at: new Date().toISOString().split('T')[0] });
  }

  async function pickSong(s: SongPick) {
    setPicked(true);
    setForm((p) => ({
      ...p,
      track_title: s.track_title,
      artist_name: s.artist_name,
      artist_img: s.artist_img,
      album_cover_url: s.album_cover_url,
      preview_url: s.preview_url,
    }));

    if (s.album_id) {
      try {
        const res = await fetch(`/api/deezer/album/${s.album_id}`);
        if (res.ok) {
          const data = (await res.json()) as { genre: string | null };
          if (data.genre) {
            setForm((p) => (p.genre ? p : { ...p, genre: data.genre! }));
          }
        }
      } catch {
        // silent
      }
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.artist_name || !form.track_title || !form.listened_at) return;
    setSaving(true);
    const res = await fetch('/api/diary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        artist_name: form.artist_name,
        artist_img: form.artist_img || null,
        album_cover_url: form.album_cover_url || null,
        track_title: form.track_title,
        genre: form.genre || null,
        preview_url: form.preview_url || null,
        note: form.note || null,
        listened_at: form.listened_at,
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
        + Neuer Tagebucheintrag
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="block p-4 space-y-3">
      <div className="flex items-center justify-between rule pb-2.5">
        <span className="font-semibold text-sm">Neuer Eintrag</span>
        <button type="button" onClick={() => { setOpen(false); reset(); }} className="mono text-[0.78rem] underline hover:bg-mark-soft px-0.5">
          abbrechen
        </button>
      </div>

      {picked && (
        <div className="flex items-center gap-2 border border-rule-strong rounded-[4px] p-2 bg-paper-sunk">
          {(form.album_cover_url || form.artist_img) && (
            <img
              src={form.album_cover_url || form.artist_img}
              alt=""
              className="w-10 h-10 object-cover rounded-[3px]"
            />
          )}
          <span className="min-w-0 flex-1">
            <span className="text-sm font-semibold truncate block">{form.track_title}</span>
            <span className="text-[0.72rem] opacity-70 truncate block">{form.artist_name}</span>
          </span>
          <button
            type="button"
            onClick={reset}
            className="mono text-[0.72rem] underline"
          >
            ändern
          </button>
        </div>
      )}

      {!picked && (
        <SongSearch onSelect={pickSong} />
      )}

      {picked && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input
            value={form.artist_name}
            onChange={(e) => setForm((p) => ({ ...p, artist_name: e.target.value }))}
            placeholder="Künstler"
            required
          />
          <input
            value={form.track_title}
            onChange={(e) => setForm((p) => ({ ...p, track_title: e.target.value }))}
            placeholder="Tracktitel"
            required
          />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <input
          value={form.genre}
          onChange={(e) => setForm((p) => ({ ...p, genre: e.target.value }))}
          placeholder="Genre"
        />
        <input
          type="date"
          value={form.listened_at}
          onChange={(e) => setForm((p) => ({ ...p, listened_at: e.target.value }))}
          required
        />
      </div>

      <input
        value={form.note}
        onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
        placeholder="Vibe (optional)"
      />

      {(form.preview_url || form.album_cover_url) && (
        <div className="flex items-center gap-2 text-sm opacity-80">
          {form.album_cover_url && (
            <img
              src={form.album_cover_url}
              alt=""
              className="w-10 h-10 object-cover border border-rule-strong rounded-[4px]"
            />
          )}
          {form.preview_url && <AudioButton src={form.preview_url} />}
          <span>
            {form.album_cover_url && form.preview_url
              ? 'Cover + 30s-Vorschau angehängt'
              : form.album_cover_url
                ? 'Cover angehängt'
                : 'Vorschau angehängt'}
          </span>
        </div>
      )}

      <div className="flex gap-2 justify-end rule-t pt-3">
        <button type="submit" disabled={saving} className="btn btn-solid">
          {saving ? 'Speichern…' : 'Eintrag speichern'}
        </button>
      </div>
    </form>
  );
}
