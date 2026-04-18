'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { DiaryEntry } from '@/lib/db';
import SongSearch, { type SongPick } from '@/components/shared/SongSearch';
import AudioButton from '@/components/shared/AudioButton';

type PickedSong = {
  track_title: string;
  artist_name: string;
  artist_img: string | null;
  album_cover_url: string | null;
  preview_url: string | null;
};

export default function EditDiaryForm({
  entry,
  onCancel,
  onSaved,
}: {
  entry: DiaryEntry;
  onCancel: () => void;
  onSaved?: (entry: DiaryEntry) => void;
}) {
  const router = useRouter();
  const [song, setSong] = useState<PickedSong>({
    track_title: entry.track_title,
    artist_name: entry.artist_name,
    artist_img: entry.artist_img,
    album_cover_url: entry.album_cover_url,
    preview_url: entry.preview_url,
  });
  const [genre, setGenre] = useState(entry.genre || '');
  const [note, setNote] = useState(entry.note || '');
  const [listenedAt, setListenedAt] = useState(entry.listened_at.slice(0, 10));
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function pickSong(s: SongPick) {
    setSong({
      track_title: s.track_title,
      artist_name: s.artist_name,
      artist_img: s.artist_img || null,
      album_cover_url: s.album_cover_url || null,
      preview_url: s.preview_url || null,
    });
    setSearching(false);

    if (s.album_id) {
      try {
        const res = await fetch(`/api/deezer/album/${s.album_id}`);
        if (res.ok) {
          const data = (await res.json()) as { genre: string | null };
          if (data.genre) setGenre((g) => g || data.genre!);
        }
      } catch {
        // silent
      }
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!song.track_title || !song.artist_name) {
      setError('Song wählen');
      return;
    }
    setSaving(true);
    setError('');
    const res = await fetch(`/api/diary/${entry.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        track_title: song.track_title,
        artist_name: song.artist_name,
        artist_img: song.artist_img,
        album_cover_url: song.album_cover_url,
        preview_url: song.preview_url,
        genre: genre || null,
        note: note || null,
        listened_at: listenedAt,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || 'Speichern fehlgeschlagen');
      return;
    }
    const updated = (await res.json()) as DiaryEntry;
    onSaved?.(updated);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="mt-2 pt-2 rule-t space-y-2.5">
      {searching ? (
        <div className="space-y-1.5">
          <SongSearch onSelect={pickSong} />
          <button
            type="button"
            onClick={() => setSearching(false)}
            className="mono text-[0.66rem] uppercase tracking-wider underline opacity-70 hover:opacity-100"
          >
            Suche abbrechen — aktuellen Song behalten
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          {(song.album_cover_url || song.artist_img) && (
            <img
              src={song.album_cover_url || song.artist_img || ''}
              alt=""
              className="w-9 h-9 object-cover shrink-0"
            />
          )}
          <div className="min-w-0 flex-1">
            <div className="text-[0.85rem] font-semibold truncate leading-tight">
              {song.track_title}
            </div>
            <div className="text-[0.72rem] opacity-70 truncate">{song.artist_name}</div>
          </div>
          <button
            type="button"
            onClick={() => setSearching(true)}
            className="mono text-[0.68rem] uppercase tracking-wider underline opacity-70 hover:opacity-100 shrink-0"
          >
            Song ändern
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <input
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
          placeholder="Genre"
        />
        <input
          type="date"
          value={listenedAt}
          onChange={(e) => setListenedAt(e.target.value)}
          required
        />
      </div>

      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Vibe (optional)"
      />

      {error && (
        <p className="text-xs">
          <span className="mark">! {error}</span>
        </p>
      )}

      <div className="flex gap-3 items-center justify-end pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="mono text-[0.68rem] uppercase tracking-wider underline opacity-70 hover:opacity-100"
        >
          abbrechen
        </button>
        <button type="submit" disabled={saving} className="btn btn-solid">
          {saving ? 'Speichere…' : 'Speichern'}
        </button>
      </div>
    </form>
  );
}
