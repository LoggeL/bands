'use client';

import { useEffect, useState } from 'react';
import { useDebouncedValue } from '@/lib/useDebouncedSearch';

export type DeezerTrack = {
  id: number;
  title: string;
  preview: string;
  artist: { name: string; picture_medium: string };
  album: { title: string; cover_medium: string; cover_big?: string };
};

export default function TrackSearch({
  artistName,
  onSelect,
}: {
  artistName: string;
  onSelect: (track: DeezerTrack) => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DeezerTrack[]>([]);
  const [open, setOpen] = useState(false);
  const debounced = useDebouncedValue(query, 300);

  useEffect(() => {
    if (!artistName) return;
    const q = debounced.length >= 2 ? `${artistName} ${debounced}` : artistName;
    if (q.length < 2) return;
    fetch(`/api/deezer/search?q=${encodeURIComponent(q)}&type=track`)
      .then((r) => r.json())
      .then((data) => {
        setResults(data);
        if (debounced.length >= 2) setOpen(true);
      });
  }, [artistName, debounced]);

  return (
    <div className="relative">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder="TRACK SUCHEN"
      />
      {open && results.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-[2px] max-h-64 overflow-y-auto bg-paper border border-rule-strong rounded-md shadow-sm divide-y divide-rule">
          {results.map((t) => (
            <button
              key={t.id}
              type="button"
              className="w-full flex items-center gap-2 px-2 py-1.5 text-left hover:bg-mark-soft"
              onClick={() => {
                onSelect(t);
                setQuery(t.title);
                setOpen(false);
              }}
            >
              {t.album.cover_medium && (
                <img
                  src={t.album.cover_medium}
                  alt=""
                  className="w-8 h-8 object-cover rounded-[3px] shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm truncate">{t.title}</div>
                <div className="text-[0.7rem] opacity-60 truncate">{t.album.title}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
