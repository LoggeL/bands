'use client';

import { useEffect, useState } from 'react';
import { useDebouncedValue } from '@/lib/useDebouncedSearch';

export type DeezerArtist = {
  id: number;
  name: string;
  picture_medium: string;
};

export default function ArtistSearch({ onSelect }: { onSelect: (artist: DeezerArtist) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DeezerArtist[]>([]);
  const [open, setOpen] = useState(false);
  const debounced = useDebouncedValue(query, 300);

  useEffect(() => {
    if (debounced.length < 2) {
      setResults([]);
      return;
    }
    fetch(`/api/deezer/search?q=${encodeURIComponent(debounced)}&type=artist`)
      .then((r) => r.json())
      .then((data) => {
        setResults(data);
        setOpen(true);
      });
  }, [debounced]);

  return (
    <div className="relative">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder="KÜNSTLER SUCHEN"
      />
      {open && results.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-[2px] block max-h-64 overflow-y-auto">
          {results.map((a) => (
            <button
              key={a.id}
              type="button"
              className="w-full flex items-center gap-3 px-2 py-1.5 text-left rule hover:bg-mark"
              onClick={() => {
                onSelect(a);
                setQuery(a.name);
                setOpen(false);
              }}
            >
              <img src={a.picture_medium} alt={a.name} className="w-8 h-8 object-cover border-2 border-ink" />
              <span className="text-sm truncate">{a.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
