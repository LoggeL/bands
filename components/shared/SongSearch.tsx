'use client';

import { useEffect, useRef, useState } from 'react';
import { useDebouncedValue } from '@/lib/useDebouncedSearch';

export type DeezerTrackHit = {
  id: number;
  title: string;
  preview: string;
  artist: { name: string; picture_medium: string };
  album: { id: number; title: string; cover_medium: string; cover_big?: string };
};

export type SongPick = {
  track_title: string;
  artist_name: string;
  artist_img: string;
  album_cover_url: string;
  preview_url: string;
  album_id: number | null;
};

export default function SongSearch({
  onSelect,
  initialQuery = '',
  placeholder = 'Song, Künstler oder Album suchen…',
}: {
  onSelect: (song: SongPick) => void;
  initialQuery?: string;
  placeholder?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<DeezerTrackHit[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const debounced = useDebouncedValue(query, 300);

  function stopPreview() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    setPlayingId(null);
    setLoadingId(null);
  }

  function togglePreview(t: DeezerTrackHit) {
    if (playingId === t.id || loadingId === t.id) {
      stopPreview();
      return;
    }
    stopPreview();
    if (!t.preview) return;
    const a = new Audio(t.preview);
    const stored = localStorage.getItem('setlist-volume');
    a.volume = stored !== null ? parseFloat(stored) : 0.7;
    audioRef.current = a;
    setLoadingId(t.id);
    a.addEventListener('playing', () => {
      setLoadingId(null);
      setPlayingId(t.id);
    });
    a.addEventListener('ended', () => {
      setPlayingId(null);
    });
    a.addEventListener('error', () => {
      setLoadingId(null);
      setPlayingId(null);
    });
    a.play().catch(() => {
      setLoadingId(null);
    });
  }

  useEffect(() => {
    if (debounced.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/deezer/search?q=${encodeURIComponent(debounced)}&type=track`)
      .then((r) => r.json())
      .then((data: DeezerTrackHit[]) => {
        if (cancelled) return;
        setResults(Array.isArray(data) ? data : []);
        setOpen(true);
      })
      .catch(() => {
        if (!cancelled) setResults([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        stopPreview();
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  useEffect(() => stopPreview, []);

  return (
    <div ref={wrapperRef} className="relative">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder={placeholder}
      />
      {open && (results.length > 0 || loading) && (
        <div className="absolute z-50 top-full left-0 right-0 mt-[2px] block max-h-72 overflow-y-auto bg-paper border border-rule-strong">
          {loading && results.length === 0 && (
            <div className="px-2 py-2 text-[0.72rem] mono opacity-60">suche…</div>
          )}
          {results.map((t) => {
            const isPlaying = playingId === t.id;
            const isLoading = loadingId === t.id;
            return (
              <div
                key={t.id}
                className="flex items-stretch rule hover:bg-mark-soft"
              >
                <button
                  type="button"
                  className="flex-1 flex items-center gap-2 px-2 py-1.5 text-left min-w-0"
                  onClick={() => {
                    stopPreview();
                    onSelect({
                      track_title: t.title,
                      artist_name: t.artist.name,
                      artist_img: t.artist.picture_medium || '',
                      album_cover_url: t.album.cover_big || t.album.cover_medium || '',
                      preview_url: t.preview || '',
                      album_id: t.album?.id ?? null,
                    });
                    setQuery(`${t.title} — ${t.artist.name}`);
                    setOpen(false);
                  }}
                >
                  {t.album.cover_medium && (
                    <img
                      src={t.album.cover_medium}
                      alt=""
                      className="w-9 h-9 object-cover border-2 border-ink shrink-0"
                    />
                  )}
                  <span className="flex-1 min-w-0">
                    <span className="text-sm truncate block font-medium">{t.title}</span>
                    <span className="text-[0.7rem] opacity-70 truncate block">
                      {t.artist.name}
                      {t.album.title && t.album.title !== t.title && (
                        <span className="opacity-60"> · {t.album.title}</span>
                      )}
                    </span>
                  </span>
                </button>
                {t.preview && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePreview(t);
                    }}
                    className={`w-10 shrink-0 border-l border-rule-strong inline-flex items-center justify-center transition-colors ${
                      isPlaying
                        ? 'bg-ink text-paper'
                        : 'hover:bg-mark'
                    }`}
                    title={isPlaying ? 'Pause' : isLoading ? 'Lade…' : 'Vorschau'}
                    aria-label={isPlaying ? 'Pause' : 'Vorschau abspielen'}
                  >
                    {isLoading ? (
                      <span
                        aria-hidden
                        className="inline-block w-[10px] h-[10px] border border-current border-r-transparent rounded-full animate-spin"
                      />
                    ) : (
                      <span className="text-[0.68rem] leading-none mono-num" aria-hidden>
                        {isPlaying ? '❚❚' : '▶'}
                      </span>
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
