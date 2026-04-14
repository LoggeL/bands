'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { User, DiaryEntry, LiveEvent, WishlistItem, Reaction } from '@/lib/db';

type DiaryWithReactions = DiaryEntry & { reactions: Reaction[] };

type Tab = 'overview' | 'diary' | 'live' | 'wishlist';

type CurrentUser = { id: number; username: string; display_name: string | null } | null;

function hue(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return h;
}

function initials(name: string): string {
  return name
    .split(/[\s&]+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');
}

function ArtistAvatar({ name, img, size = 64 }: { name: string; img: string | null; size?: number }) {
  const [error, setError] = useState(false);
  if (img && !error) {
    return (
      <img
        src={img}
        alt={name}
        width={size}
        height={size}
        className="rounded-lg object-cover shrink-0"
        style={{ width: size, height: size }}
        onError={() => setError(true)}
      />
    );
  }
  return (
    <div
      className="rounded-lg flex items-center justify-center font-bold text-white shrink-0"
      style={{
        width: size,
        height: size,
        background: `hsl(${hue(name)}, 60%, 35%)`,
        fontSize: size * 0.35,
      }}
    >
      {initials(name)}
    </div>
  );
}

function AudioButton({ src }: { src: string | null }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const toggle = useCallback(() => {
    if (!src) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(src);
      audioRef.current.addEventListener('timeupdate', () => {
        if (audioRef.current) {
          setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
        }
      });
      audioRef.current.addEventListener('ended', () => {
        setPlaying(false);
        setProgress(0);
      });
    }
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  }, [src, playing]);

  if (!src) return null;

  return (
    <button
      onClick={toggle}
      className="relative w-8 h-8 rounded-full flex items-center justify-center bg-pink/20 hover:bg-pink/30 transition-colors shrink-0"
      title={playing ? 'Pause' : 'Play preview'}
    >
      <span className="material-symbols-outlined text-pink text-base">
        {playing ? 'pause' : 'play_arrow'}
      </span>
      {playing && (
        <svg className="absolute inset-0 w-8 h-8 -rotate-90">
          <circle
            cx="16" cy="16" r="14"
            fill="none" stroke="#ff8aa9" strokeWidth="2"
            strokeDasharray={`${progress * 0.88} 88`}
            opacity="0.5"
          />
        </svg>
      )}
    </button>
  );
}

function MoodTag({ mood }: { mood: string | null }) {
  if (!mood) return null;
  return <span className={`mood-tag mood-${mood}`}>{mood}</span>;
}

function ReactionBar({
  entryId,
  reactions: initialReactions,
  currentUsername,
}: {
  entryId: number;
  reactions: Reaction[];
  currentUsername: string | null;
}) {
  const [reactions, setReactions] = useState(initialReactions);
  const emojis = ['🔥', '❤️', '🎸', '🤘', '💜', '🎵'];

  const grouped = emojis.reduce(
    (acc, e) => {
      const matching = reactions.filter((r) => r.emoji === e);
      if (matching.length > 0) {
        acc[e] = { count: matching.length, names: matching.map((r) => r.reactor_name) };
      }
      return acc;
    },
    {} as Record<string, { count: number; names: string[] }>
  );

  const myReaction = currentUsername
    ? reactions.find((r) => r.reactor_name === currentUsername)?.emoji
    : undefined;

  async function addReaction(emoji: string) {
    if (!currentUsername) return;
    const res = await fetch(`/api/diary/${entryId}/reactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emoji }),
    });
    if (res.ok) {
      const updated = await res.json();
      setReactions(updated);
    }
  }

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {emojis.map((emoji) => {
        const data = grouped[emoji];
        const isMyReaction = myReaction === emoji;
        return (
          <button
            key={emoji}
            onClick={() => addReaction(emoji)}
            disabled={!currentUsername}
            className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
              isMyReaction
                ? 'bg-pink/20 ring-1 ring-pink/40'
                : data
                  ? 'bg-white/10 hover:bg-white/20'
                  : 'bg-transparent hover:bg-white/5 opacity-40 hover:opacity-70'
            } disabled:cursor-default`}
            title={
              !currentUsername
                ? 'Log in to react'
                : data
                  ? data.names.join(', ')
                  : ''
            }
          >
            {emoji} {data ? data.count : ''}
          </button>
        );
      })}
    </div>
  );
}

function DiaryEntryCard({ entry, currentUsername }: { entry: DiaryWithReactions; currentUsername: string | null }) {
  const date = new Date(entry.listened_at);
  const dateStr = date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="glass rounded-xl p-4 animate-fade-in hover:bg-bg-hover transition-colors">
      <div className="flex gap-3">
        <ArtistAvatar name={entry.artist_name} img={entry.artist_img} size={56} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-bold text-sm truncate">{entry.track_title}</h3>
              <p className="text-text-muted text-xs truncate">{entry.artist_name}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <MoodTag mood={entry.mood} />
              <AudioButton src={entry.preview_url} />
            </div>
          </div>
          {entry.genre && (
            <span className="text-[0.65rem] text-text-muted bg-white/5 px-2 py-0.5 rounded-full inline-block mt-1">
              {entry.genre}
            </span>
          )}
          {entry.note && <p className="text-xs text-text-muted mt-2 italic">&ldquo;{entry.note}&rdquo;</p>}
          <div className="flex items-center justify-between mt-3 gap-2">
            <ReactionBar entryId={entry.id} reactions={entry.reactions} currentUsername={currentUsername} />
            <time className="text-[0.65rem] text-text-muted shrink-0">{dateStr}</time>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Deezer Search Types ─── */

type DeezerArtist = {
  id: number;
  name: string;
  picture_medium: string;
};

type DeezerTrack = {
  id: number;
  title: string;
  preview: string;
  artist: { name: string; picture_medium: string };
  album: { title: string };
};

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function ArtistSearch({ onSelect }: { onSelect: (artist: DeezerArtist) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DeezerArtist[]>([]);
  const [open, setOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults([]);
      return;
    }
    fetch(`/api/deezer/search?q=${encodeURIComponent(debouncedQuery)}&type=artist`)
      .then((r) => r.json())
      .then((data) => {
        setResults(data);
        setOpen(true);
      });
  }, [debouncedQuery]);

  return (
    <div className="relative">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder="Search artist (Deezer) *"
        className="w-full bg-bg rounded-lg px-3 py-2 text-sm border border-border focus:border-pink outline-none"
      />
      {open && results.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-bg-card border border-border rounded-lg shadow-xl max-h-60 overflow-y-auto">
          {results.map((a) => (
            <button
              key={a.id}
              type="button"
              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-bg-hover transition-colors text-left"
              onClick={() => {
                onSelect(a);
                setQuery(a.name);
                setOpen(false);
              }}
            >
              <img src={a.picture_medium} alt={a.name} className="w-8 h-8 rounded-full object-cover" />
              <span className="text-sm truncate">{a.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function TrackSearch({ artistName, onSelect }: { artistName: string; onSelect: (track: DeezerTrack) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DeezerTrack[]>([]);
  const [open, setOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (!artistName) return;
    const q = debouncedQuery.length >= 2 ? `${artistName} ${debouncedQuery}` : artistName;
    if (q.length < 2) return;
    fetch(`/api/deezer/search?q=${encodeURIComponent(q)}&type=track`)
      .then((r) => r.json())
      .then((data) => {
        setResults(data);
        if (debouncedQuery.length >= 2) setOpen(true);
      });
  }, [artistName, debouncedQuery]);

  return (
    <div className="relative">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder="Search track title *"
        className="w-full bg-bg rounded-lg px-3 py-2 text-sm border border-border focus:border-pink outline-none"
      />
      {open && results.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-bg-card border border-border rounded-lg shadow-xl max-h-60 overflow-y-auto">
          {results.map((t) => (
            <button
              key={t.id}
              type="button"
              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-bg-hover transition-colors text-left"
              onClick={() => {
                onSelect(t);
                setQuery(t.title);
                setOpen(false);
              }}
            >
              <div className="min-w-0">
                <span className="text-sm truncate block">{t.title}</span>
                <span className="text-xs text-text-muted truncate block">{t.album.title}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function AddDiaryForm({ onAdded }: { onAdded: (entry: DiaryWithReactions) => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState<DeezerArtist | null>(null);
  const [formData, setFormData] = useState({
    artist_name: '',
    artist_img: '',
    track_title: '',
    genre: '',
    preview_url: '',
    note: '',
    mood: '',
    listened_at: new Date().toISOString().split('T')[0],
  });

  function handleArtistSelect(artist: DeezerArtist) {
    setSelectedArtist(artist);
    setFormData((prev) => ({
      ...prev,
      artist_name: artist.name,
      artist_img: artist.picture_medium,
    }));
  }

  function handleTrackSelect(track: DeezerTrack) {
    setFormData((prev) => ({
      ...prev,
      track_title: track.title,
      preview_url: track.preview || '',
    }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!formData.artist_name || !formData.track_title || !formData.listened_at) return;
    setSaving(true);
    const res = await fetch('/api/diary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        artist_name: formData.artist_name,
        artist_img: formData.artist_img || null,
        track_title: formData.track_title,
        genre: formData.genre || null,
        preview_url: formData.preview_url || null,
        note: formData.note || null,
        mood: formData.mood || null,
        listened_at: formData.listened_at,
      }),
    });
    if (res.ok) {
      const entry = await res.json();
      onAdded({ ...entry, reactions: [] });
      setOpen(false);
      setSelectedArtist(null);
      setFormData({
        artist_name: '',
        artist_img: '',
        track_title: '',
        genre: '',
        preview_url: '',
        note: '',
        mood: '',
        listened_at: new Date().toISOString().split('T')[0],
      });
    }
    setSaving(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full glass rounded-xl p-4 flex items-center justify-center gap-2 text-pink hover:bg-bg-hover transition-colors cursor-pointer"
      >
        <span className="material-symbols-outlined">add</span>
        <span className="font-semibold text-sm">New Diary Entry</span>
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="glass rounded-xl p-4 space-y-3 animate-fade-in">
      {selectedArtist && (
        <div className="flex items-center gap-3 p-2 bg-white/5 rounded-lg">
          <img src={selectedArtist.picture_medium} alt={selectedArtist.name} className="w-10 h-10 rounded-full object-cover" />
          <div>
            <span className="text-sm font-semibold">{selectedArtist.name}</span>
            <button
              type="button"
              onClick={() => {
                setSelectedArtist(null);
                setFormData((prev) => ({ ...prev, artist_name: '', artist_img: '' }));
              }}
              className="text-xs text-text-muted ml-2 hover:text-pink"
            >
              change
            </button>
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        {!selectedArtist ? (
          <ArtistSearch onSelect={handleArtistSelect} />
        ) : (
          <input type="hidden" value={formData.artist_name} />
        )}
        {selectedArtist ? (
          <div className={selectedArtist ? 'col-span-2 sm:col-span-1' : ''}>
            <TrackSearch artistName={formData.artist_name} onSelect={handleTrackSelect} />
          </div>
        ) : (
          <input
            value={formData.track_title}
            onChange={(e) => setFormData((prev) => ({ ...prev, track_title: e.target.value }))}
            placeholder="Track title *"
            required
            className="bg-bg rounded-lg px-3 py-2 text-sm border border-border focus:border-pink outline-none"
          />
        )}
      </div>
      <div className="grid grid-cols-3 gap-3">
        <input
          value={formData.genre}
          onChange={(e) => setFormData((prev) => ({ ...prev, genre: e.target.value }))}
          placeholder="Genre"
          className="bg-bg rounded-lg px-3 py-2 text-sm border border-border focus:border-pink outline-none"
        />
        <select
          value={formData.mood}
          onChange={(e) => setFormData((prev) => ({ ...prev, mood: e.target.value }))}
          className="bg-bg rounded-lg px-3 py-2 text-sm border border-border focus:border-pink outline-none text-text-muted"
        >
          <option value="">Mood</option>
          <option value="energized">Energized</option>
          <option value="nostalgic">Nostalgic</option>
          <option value="chill">Chill</option>
          <option value="melancholic">Melancholic</option>
          <option value="hyped">Hyped</option>
          <option value="reflective">Reflective</option>
        </select>
        <input
          value={formData.listened_at}
          onChange={(e) => setFormData((prev) => ({ ...prev, listened_at: e.target.value }))}
          type="date"
          required
          className="bg-bg rounded-lg px-3 py-2 text-sm border border-border focus:border-pink outline-none"
        />
      </div>
      <input
        value={formData.note}
        onChange={(e) => setFormData((prev) => ({ ...prev, note: e.target.value }))}
        placeholder="How does it make you feel? (optional)"
        className="w-full bg-bg rounded-lg px-3 py-2 text-sm border border-border focus:border-pink outline-none"
      />
      {formData.preview_url && (
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <AudioButton src={formData.preview_url} />
          <span>Preview attached</span>
        </div>
      )}
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-4 py-2 text-sm text-text-muted hover:text-text transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 text-sm bg-pink text-bg-card rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Entry'}
        </button>
      </div>
    </form>
  );
}

function OverviewTab({
  user,
  diary,
  live,
  wishlist,
  onTabChange,
  currentUsername,
}: {
  user: User;
  diary: DiaryWithReactions[];
  live: LiveEvent[];
  wishlist: WishlistItem[];
  onTabChange: (tab: Tab) => void;
  currentUsername: string | null;
}) {
  const recentDiary = diary.slice(0, 5);
  const genres = [...diary, ...live, ...wishlist]
    .map((item) => ('genre' in item ? item.genre : null))
    .filter(Boolean) as string[];
  const genreCounts: Record<string, number> = {};
  genres.forEach((g) => {
    const normalized = g.split('/')[0].trim();
    genreCounts[normalized] = (genreCounts[normalized] || 0) + 1;
  });
  const topGenres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        <button onClick={() => onTabChange('diary')} className="glass rounded-xl p-4 text-center hover:bg-bg-hover transition-colors cursor-pointer">
          <div className="text-2xl font-black font-[family-name:var(--font-display)] text-pink">{diary.length}</div>
          <div className="text-xs text-text-muted mt-1">Diary Entries</div>
        </button>
        <button onClick={() => onTabChange('live')} className="glass rounded-xl p-4 text-center hover:bg-bg-hover transition-colors cursor-pointer">
          <div className="text-2xl font-black font-[family-name:var(--font-display)] text-green">{live.length}</div>
          <div className="text-xs text-text-muted mt-1">Concerts</div>
        </button>
        <button onClick={() => onTabChange('wishlist')} className="glass rounded-xl p-4 text-center hover:bg-bg-hover transition-colors cursor-pointer">
          <div className="text-2xl font-black font-[family-name:var(--font-display)] text-cyan">{wishlist.length}</div>
          <div className="text-xs text-text-muted mt-1">Wishlist</div>
        </button>
      </div>

      {topGenres.length > 0 && (
        <div className="glass rounded-xl p-4">
          <h3 className="text-xs text-text-muted uppercase tracking-wider font-bold mb-3">Top Genres</h3>
          <div className="flex flex-wrap gap-2">
            {topGenres.map(([genre, count]) => (
              <span key={genre} className="text-xs bg-white/5 text-text px-3 py-1 rounded-full">
                {genre} <span className="text-text-muted">({count})</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {recentDiary.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs text-text-muted uppercase tracking-wider font-bold">Recent Diary</h3>
            <button onClick={() => onTabChange('diary')} className="text-xs text-pink hover:underline">
              View all
            </button>
          </div>
          <div className="space-y-3">
            {recentDiary.map((entry) => (
              <DiaryEntryCard key={entry.id} entry={entry} currentUsername={currentUsername} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DiaryTab({
  diary,
  isOwner,
  currentUsername,
}: {
  diary: DiaryWithReactions[];
  isOwner: boolean;
  currentUsername: string | null;
}) {
  const [entries, setEntries] = useState(diary);

  return (
    <div className="space-y-3">
      {isOwner && <AddDiaryForm onAdded={(entry) => setEntries([entry, ...entries])} />}
      {entries.map((entry) => (
        <DiaryEntryCard key={entry.id} entry={entry} currentUsername={currentUsername} />
      ))}
      {entries.length === 0 && (
        <div className="text-center text-text-muted py-12">
          <span className="material-symbols-outlined text-4xl mb-2 block">music_note</span>
          <p className="text-sm">No diary entries yet</p>
        </div>
      )}
    </div>
  );
}

function AddToWishlistButton({ artist_name, artist_img, genre, track_title, preview_url }: {
  artist_name: string;
  artist_img: string | null;
  genre: string | null;
  track_title: string | null;
  preview_url: string | null;
}) {
  const [status, setStatus] = useState<'idle' | 'saving' | 'done' | 'exists'>('idle');

  async function handleAdd() {
    setStatus('saving');
    const res = await fetch('/api/wishlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ artist_name, artist_img, genre, track_title, preview_url }),
    });
    if (res.status === 409) {
      setStatus('exists');
    } else if (res.ok) {
      setStatus('done');
    } else {
      setStatus('idle');
    }
  }

  if (status === 'done') {
    return (
      <span className="text-[0.65rem] text-green flex items-center gap-0.5">
        <span className="material-symbols-outlined text-sm">check</span>
        Added
      </span>
    );
  }

  if (status === 'exists') {
    return (
      <span className="text-[0.65rem] text-text-muted flex items-center gap-0.5">
        <span className="material-symbols-outlined text-sm">check</span>
        In wishlist
      </span>
    );
  }

  return (
    <button
      onClick={handleAdd}
      disabled={status === 'saving'}
      className="text-[0.65rem] text-cyan hover:text-white flex items-center gap-0.5 transition-colors disabled:opacity-50"
      title="Add to my wishlist"
    >
      <span className="material-symbols-outlined text-sm">
        {status === 'saving' ? 'hourglass_empty' : 'playlist_add'}
      </span>
      {status === 'saving' ? 'Adding...' : 'Wishlist'}
    </button>
  );
}

function LiveTab({ live }: { live: LiveEvent[] }) {
  return (
    <div className="space-y-3">
      {live.map((event) => (
        <div key={event.id} className="glass rounded-xl p-4 animate-fade-in hover:bg-bg-hover transition-colors">
          <div className="flex gap-3">
            <ArtistAvatar name={event.artist_name} img={event.artist_img} size={56} />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-bold text-sm truncate">{event.artist_name}</h3>
                  {event.genre && (
                    <span className="text-[0.65rem] text-text-muted bg-white/5 px-2 py-0.5 rounded-full inline-block mt-0.5">
                      {event.genre}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <AddToWishlistButton
                    artist_name={event.artist_name}
                    artist_img={event.artist_img}
                    genre={event.genre}
                    track_title={event.track_title}
                    preview_url={event.preview_url}
                  />
                  <span className="text-[0.65rem] font-bold text-green bg-green/10 px-2 py-0.5 rounded-full uppercase">
                    Seen
                  </span>
                  <AudioButton src={event.preview_url} />
                </div>
              </div>
              {event.venue && (
                <div className="flex items-center gap-1 mt-2 text-xs text-text-muted">
                  <span className="material-symbols-outlined text-sm">location_on</span>
                  {event.venue}
                </div>
              )}
              {event.track_title && (
                <p className="text-xs text-text-muted mt-1 truncate">
                  <span className="material-symbols-outlined text-sm align-middle mr-0.5">music_note</span>
                  {event.track_title}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
      {live.length === 0 && (
        <div className="text-center text-text-muted py-12">
          <span className="material-symbols-outlined text-4xl mb-2 block">stadium</span>
          <p className="text-sm">No concerts logged yet</p>
        </div>
      )}
    </div>
  );
}

function WishlistTab({ wishlist, userId }: { wishlist: WishlistItem[]; userId: number }) {
  const [showCompare, setShowCompare] = useState(false);
  const [compareUserId, setCompareUserId] = useState('');
  const [compareResult, setCompareResult] = useState<{
    user: { username: string; display_name: string | null };
    otherUser: { username: string; display_name: string | null };
    myWishlist: WishlistItem[];
    otherWishlist: WishlistItem[];
    matches: WishlistItem[];
  } | null>(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareError, setCompareError] = useState('');

  async function handleCompare() {
    const otherId = parseInt(compareUserId, 10);
    if (isNaN(otherId)) {
      setCompareError('Enter a valid user ID');
      return;
    }
    setCompareLoading(true);
    setCompareError('');
    const res = await fetch(`/api/wishlist/compare?userId=${userId}&otherUserId=${otherId}`);
    if (res.ok) {
      const data = await res.json();
      setCompareResult(data);
    } else {
      const err = await res.json();
      setCompareError(err.error || 'Failed to compare');
    }
    setCompareLoading(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div />
        <button
          onClick={() => setShowCompare(!showCompare)}
          className="flex items-center gap-1.5 text-sm text-cyan hover:text-white transition-colors"
        >
          <span className="material-symbols-outlined text-lg">compare_arrows</span>
          Compare with...
        </button>
      </div>

      {showCompare && (
        <div className="glass rounded-xl p-4 space-y-3 animate-fade-in">
          <div className="flex gap-2">
            <input
              value={compareUserId}
              onChange={(e) => setCompareUserId(e.target.value)}
              placeholder="Other user ID (e.g. 2)"
              className="flex-1 bg-bg rounded-lg px-3 py-2 text-sm border border-border focus:border-cyan outline-none"
            />
            <button
              onClick={handleCompare}
              disabled={compareLoading}
              className="px-4 py-2 text-sm bg-cyan text-bg-card rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {compareLoading ? 'Comparing...' : 'Compare'}
            </button>
          </div>
          {compareError && <p className="text-xs text-red-400">{compareError}</p>}
          {compareResult && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold text-pink">{compareResult.user.display_name || compareResult.user.username}</span>
                <span className="text-text-muted">vs</span>
                <span className="font-semibold text-cyan">{compareResult.otherUser.display_name || compareResult.otherUser.username}</span>
              </div>
              {compareResult.matches.length > 0 ? (
                <div>
                  <h4 className="text-xs text-text-muted uppercase tracking-wider font-bold mb-2">
                    Matching Artists ({compareResult.matches.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {compareResult.matches.map((m) => (
                      <div key={m.id} className="flex items-center gap-2 p-2 bg-green/5 border border-green/20 rounded-lg">
                        <ArtistAvatar name={m.artist_name} img={m.artist_img} size={32} />
                        <span className="text-sm font-semibold truncate">{m.artist_name}</span>
                        <span className="material-symbols-outlined text-green text-sm ml-auto">check_circle</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-text-muted">No matching artists found</p>
              )}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-text-muted">Your wishlist: </span>
                  <span className="font-bold">{compareResult.myWishlist.length} artists</span>
                </div>
                <div>
                  <span className="text-text-muted">Their wishlist: </span>
                  <span className="font-bold">{compareResult.otherWishlist.length} artists</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {wishlist.map((item) => (
          <div key={item.id} className="glass rounded-xl p-4 animate-fade-in hover:bg-bg-hover transition-colors group">
            <div className="flex gap-3">
              <ArtistAvatar name={item.artist_name} img={item.artist_img} size={64} />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm truncate">{item.artist_name}</h3>
                    {item.genre && (
                      <span className="text-[0.65rem] text-text-muted bg-white/5 px-2 py-0.5 rounded-full inline-block mt-0.5">
                        {item.genre}
                      </span>
                    )}
                  </div>
                  <span className="text-[0.65rem] font-bold text-pink bg-pink/10 px-2 py-0.5 rounded-full uppercase shrink-0">
                    Want
                  </span>
                </div>
                {item.track_title && (
                  <p className="text-xs text-text-muted mt-2 truncate">
                    <span className="material-symbols-outlined text-sm align-middle mr-0.5">music_note</span>
                    {item.track_title}
                  </p>
                )}
                <div className="flex items-center justify-between mt-2">
                  <AudioButton src={item.preview_url} />
                  <AddToWishlistButton
                    artist_name={item.artist_name}
                    artist_img={item.artist_img}
                    genre={item.genre}
                    track_title={item.track_title}
                    preview_url={item.preview_url}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
        {wishlist.length === 0 && (
          <div className="col-span-full text-center text-text-muted py-12">
            <span className="material-symbols-outlined text-4xl mb-2 block">favorite</span>
            <p className="text-sm">Wishlist is empty</p>
          </div>
        )}
      </div>
    </div>
  );
}

const tabs: { key: Tab; label: string; icon: string }[] = [
  { key: 'overview', label: 'Overview', icon: 'dashboard' },
  { key: 'diary', label: 'Diary', icon: 'auto_stories' },
  { key: 'live', label: 'Live', icon: 'stadium' },
  { key: 'wishlist', label: 'Wishlist', icon: 'favorite' },
];

export default function ProfileClient({
  user,
  diary,
  live,
  wishlist,
  initialTab,
  currentUser,
}: {
  user: User;
  diary: DiaryWithReactions[];
  live: LiveEvent[];
  wishlist: WishlistItem[];
  initialTab: Tab;
  currentUser: CurrentUser;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  const isOwner = currentUser?.id === user.id;
  const currentUsername = currentUser?.username ?? null;

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  function changeTab(tab: Tab) {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams?.toString() || '');
    if (tab === 'overview') {
      params.delete('tab');
    } else {
      params.set('tab', tab);
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return (
    <div className="max-w-5xl mx-auto px-4 pb-24 md:pb-8">
      {/* Profile Header */}
      <header className="pt-4 pb-4">
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black text-white"
            style={{ background: `linear-gradient(135deg, #ff8aa9, #a1faff)` }}
          >
            {user.display_name?.[0]?.toUpperCase() || user.username[0].toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-black font-[family-name:var(--font-display)]">
              {user.display_name || user.username}
            </h2>
            <p className="text-sm text-text-muted">@{user.username}</p>
            {user.bio && <p className="text-xs text-text-muted mt-1">{user.bio}</p>}
          </div>
        </div>
      </header>

      {/* Tab Nav - Desktop */}
      <nav className="hidden md:flex gap-1 mb-6 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => changeTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${
              activeTab === tab.key
                ? 'text-pink border-pink'
                : 'text-text-muted border-transparent hover:text-text'
            }`}
          >
            <span className="material-symbols-outlined text-lg">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main>
        {activeTab === 'overview' && (
          <OverviewTab
            user={user}
            diary={diary}
            live={live}
            wishlist={wishlist}
            onTabChange={changeTab}
            currentUsername={currentUsername}
          />
        )}
        {activeTab === 'diary' && (
          <DiaryTab diary={diary} isOwner={isOwner} currentUsername={currentUsername} />
        )}
        {activeTab === 'live' && <LiveTab live={live} />}
        {activeTab === 'wishlist' && <WishlistTab wishlist={wishlist} userId={user.id} />}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 md:hidden glass border-t border-border">
        <div className="flex justify-around py-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => changeTab(tab.key)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 text-[0.6rem] font-semibold transition-colors ${
                activeTab === tab.key ? 'text-pink' : 'text-text-muted'
              }`}
            >
              <span className="material-symbols-outlined text-xl">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
