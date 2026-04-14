'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { User, DiaryEntry, LiveEvent, WishlistItem, Reaction } from '@/lib/db';

type DiaryWithReactions = DiaryEntry & { reactions: Reaction[] };

type Tab = 'overview' | 'diary' | 'live' | 'wishlist';

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
}: {
  entryId: number;
  reactions: Reaction[];
}) {
  const [reactions, setReactions] = useState(initialReactions);
  const emojis = ['🔥', '❤️', '🎸', '🤘', '💜', '🎵'];

  const grouped = emojis.reduce(
    (acc, e) => {
      const count = reactions.filter((r) => r.emoji === e).length;
      if (count > 0) acc[e] = count;
      return acc;
    },
    {} as Record<string, number>
  );

  async function addReaction(emoji: string) {
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
      {emojis.map((emoji) => (
        <button
          key={emoji}
          onClick={() => addReaction(emoji)}
          className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
            grouped[emoji]
              ? 'bg-white/10 hover:bg-white/20'
              : 'bg-transparent hover:bg-white/5 opacity-40 hover:opacity-70'
          }`}
        >
          {emoji} {grouped[emoji] ? grouped[emoji] : ''}
        </button>
      ))}
    </div>
  );
}

function DiaryEntryCard({ entry }: { entry: DiaryWithReactions }) {
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
            <ReactionBar entryId={entry.id} reactions={entry.reactions} />
            <time className="text-[0.65rem] text-text-muted shrink-0">{dateStr}</time>
          </div>
        </div>
      </div>
    </div>
  );
}

function AddDiaryForm({
  username,
  onAdded,
}: {
  username: string;
  onAdded: (entry: DiaryWithReactions) => void;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const form = new FormData(e.currentTarget);
    const res = await fetch('/api/diary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        artist_name: form.get('artist_name'),
        track_title: form.get('track_title'),
        genre: form.get('genre') || null,
        note: form.get('note') || null,
        mood: form.get('mood') || null,
        listened_at: form.get('listened_at'),
      }),
    });
    if (res.ok) {
      const entry = await res.json();
      onAdded({ ...entry, reactions: [] });
      setOpen(false);
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
      <div className="grid grid-cols-2 gap-3">
        <input
          name="artist_name"
          placeholder="Artist name *"
          required
          className="bg-bg rounded-lg px-3 py-2 text-sm border border-border focus:border-pink outline-none"
        />
        <input
          name="track_title"
          placeholder="Track title *"
          required
          className="bg-bg rounded-lg px-3 py-2 text-sm border border-border focus:border-pink outline-none"
        />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <input
          name="genre"
          placeholder="Genre"
          className="bg-bg rounded-lg px-3 py-2 text-sm border border-border focus:border-pink outline-none"
        />
        <select
          name="mood"
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
          name="listened_at"
          type="date"
          required
          defaultValue={new Date().toISOString().split('T')[0]}
          className="bg-bg rounded-lg px-3 py-2 text-sm border border-border focus:border-pink outline-none"
        />
      </div>
      <input
        name="note"
        placeholder="How does it make you feel? (optional)"
        className="w-full bg-bg rounded-lg px-3 py-2 text-sm border border-border focus:border-pink outline-none"
      />
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
}: {
  user: User;
  diary: DiaryWithReactions[];
  live: LiveEvent[];
  wishlist: WishlistItem[];
  onTabChange: (tab: Tab) => void;
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
              <DiaryEntryCard key={entry.id} entry={entry} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DiaryTab({ diary, username }: { diary: DiaryWithReactions[]; username: string }) {
  const [entries, setEntries] = useState(diary);

  return (
    <div className="space-y-3">
      <AddDiaryForm
        username={username}
        onAdded={(entry) => setEntries([entry, ...entries])}
      />
      {entries.map((entry) => (
        <DiaryEntryCard key={entry.id} entry={entry} />
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

function WishlistTab({ wishlist }: { wishlist: WishlistItem[] }) {
  return (
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
              <div className="mt-2">
                <AudioButton src={item.preview_url} />
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
}: {
  user: User;
  diary: DiaryWithReactions[];
  live: LiveEvent[];
  wishlist: WishlistItem[];
  initialTab: Tab;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

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
    <div className="max-w-2xl mx-auto px-4 pb-24 md:pb-8">
      {/* Header */}
      <header className="pt-6 pb-4">
        <div className="flex items-center gap-2 mb-6">
          <span className="text-2xl">🎸</span>
          <h1 className="text-lg font-black font-[family-name:var(--font-display)] uppercase tracking-tight">
            Setlist
          </h1>
        </div>
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
          <OverviewTab user={user} diary={diary} live={live} wishlist={wishlist} onTabChange={changeTab} />
        )}
        {activeTab === 'diary' && <DiaryTab diary={diary} username={user.username} />}
        {activeTab === 'live' && <LiveTab live={live} />}
        {activeTab === 'wishlist' && <WishlistTab wishlist={wishlist} />}
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
