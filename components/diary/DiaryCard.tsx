'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { DiaryEntry } from '@/lib/db';
import { useDominantColor } from '@/lib/useDominantColor';
import { usePreviewAudio } from '@/lib/usePreviewAudio';
import ArtistAvatar from '@/components/shared/ArtistAvatar';
import AuthorAvatar from '@/components/shared/AuthorAvatar';
import { PlayButton } from '@/components/shared/AudioButton';
import MoodTag from '@/components/shared/MoodTag';
import AddToWishlistButton from '@/components/wishlist/AddToWishlistButton';
import EditDiaryForm from './EditDiaryForm';

export default function DiaryCard({
  entry: initialEntry,
  authorUsername,
  showAuthor = false,
  authorDisplayName,
  authorAvatarUrl,
  viewerLoggedIn = false,
  viewerSeen = false,
  viewerWishlisted = false,
  canEdit = false,
}: {
  entry: DiaryEntry;
  authorUsername: string;
  showAuthor?: boolean;
  authorDisplayName?: string | null;
  authorAvatarUrl?: string | null;
  viewerLoggedIn?: boolean;
  viewerSeen?: boolean;
  viewerWishlisted?: boolean;
  canEdit?: boolean;
}) {
  const router = useRouter();
  const [entry, setEntry] = useState(initialEntry);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [gone, setGone] = useState(false);

  const date = new Date(entry.listened_at);
  const dateStr = date.toISOString().slice(0, 10);
  const coverSrc = entry.album_cover_url || entry.artist_img;
  const tint = useDominantColor(coverSrc);
  const { playing, progress, toggle } = usePreviewAudio(entry.preview_url);

  async function handleDelete() {
    if (!confirm('Diesen Eintrag wirklich löschen?')) return;
    setDeleting(true);
    const res = await fetch(`/api/diary/${entry.id}`, { method: 'DELETE' });
    if (res.ok) {
      setGone(true);
      router.refresh();
    } else {
      setDeleting(false);
      alert('Löschen fehlgeschlagen.');
    }
  }

  if (gone) return null;

  return (
    <article
      className="block p-2.5 relative overflow-hidden"
      style={
        tint
          ? {
              borderLeftWidth: '4px',
              borderLeftColor: tint,
              backgroundColor: `${tint}26`,
            }
          : undefined
      }
    >
      {showAuthor && (
        <Link
          href={`/@${authorUsername}`}
          className="inline-flex items-center gap-1.5 text-[0.68rem] mono pb-1 mb-1.5 rule font-semibold"
        >
          <AuthorAvatar
            username={authorUsername}
            displayName={authorDisplayName}
            avatarUrl={authorAvatarUrl}
            size={18}
          />
          <span>@{authorUsername}</span>
          {authorDisplayName && authorDisplayName !== authorUsername && (
            <span className="opacity-60 font-normal">· {authorDisplayName}</span>
          )}
        </Link>
      )}

      <div className="flex gap-2.5">
        <ArtistAvatar name={entry.artist_name} img={coverSrc} size={44} />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <Link
              href={`/@${authorUsername}/diary/${entry.id}`}
              className="min-w-0 group/link"
            >
              <h3 className="font-semibold text-[0.88rem] truncate leading-tight group-hover/link:underline decoration-1 underline-offset-4">
                {entry.track_title}
              </h3>
              <p className="text-[0.78rem] opacity-70 truncate leading-tight mt-0.5">
                {entry.artist_name}
              </p>
            </Link>
            <div className="flex items-center gap-1.5 shrink-0">
              {canEdit && !editing && (
                <>
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="mono text-[0.66rem] uppercase tracking-wider px-1.5 py-0.5 opacity-60 hover:opacity-100 hover:bg-mark-soft rounded-[3px]"
                    title="Eintrag bearbeiten"
                    aria-label="Bearbeiten"
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="mono text-[0.66rem] uppercase tracking-wider px-1.5 py-0.5 opacity-60 hover:opacity-100 hover:bg-ember hover:text-paper rounded-[3px] disabled:opacity-30"
                    title="Eintrag löschen"
                    aria-label="Löschen"
                  >
                    {deleting ? '…' : '✕'}
                  </button>
                </>
              )}
              <PlayButton
                playing={playing}
                onToggle={toggle}
                disabled={!entry.preview_url}
              />
            </div>
          </div>

          {!editing && (
            <>
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                <time className="text-[0.66rem] mono-num opacity-80">{dateStr}</time>
                <MoodTag mood={entry.mood} />
                {entry.genre && <span className="chip">{entry.genre}</span>}
              </div>

              {entry.note && (
                <p className="text-[0.8rem] mt-1.5 italic text-ink-soft pl-2 border-l border-rule leading-snug">
                  &ldquo;{entry.note}&rdquo;
                </p>
              )}

              {viewerLoggedIn && !canEdit && (
                <div className="flex items-center gap-1.5 flex-wrap mt-2 pt-1.5 rule-t text-[0.66rem]">
                  <span className="mono uppercase tracking-[0.2em] opacity-55">Du:</span>
                  {viewerSeen ? (
                    <span className="chip chip-solid">✓ Live gesehen</span>
                  ) : viewerWishlisted ? (
                    <span className="chip">✓ auf Wunschliste</span>
                  ) : (
                    <>
                      <AddToWishlistButton
                        artist_name={entry.artist_name}
                        artist_img={entry.artist_img}
                        album_cover_url={entry.album_cover_url}
                        genre={entry.genre}
                        track_title={entry.track_title}
                        preview_url={entry.preview_url}
                      />
                      <span className="mono opacity-45">noch nicht auf deinem Radar</span>
                    </>
                  )}
                </div>
              )}
            </>
          )}

          {editing && (
            <EditDiaryForm
              entry={entry}
              onCancel={() => setEditing(false)}
              onSaved={(updated) => {
                setEntry(updated);
                setEditing(false);
              }}
            />
          )}
        </div>
      </div>

      {playing && (
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-[2px] bg-rule/40 pointer-events-none"
        >
          <div
            className="h-full bg-ember transition-[width] duration-150 ease-linear"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
      )}
    </article>
  );
}
