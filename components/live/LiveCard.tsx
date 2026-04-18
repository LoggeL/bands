'use client';

import Link from 'next/link';
import type { LiveEvent } from '@/lib/db';
import { useDominantColor } from '@/lib/useDominantColor';
import { usePreviewAudio } from '@/lib/usePreviewAudio';
import ArtistAvatar from '@/components/shared/ArtistAvatar';
import AuthorAvatar from '@/components/shared/AuthorAvatar';
import { PlayButton } from '@/components/shared/AudioButton';
import AddToWishlistButton from '@/components/wishlist/AddToWishlistButton';

export default function LiveCard({
  event,
  authorUsername,
  showAuthor = false,
  authorDisplayName,
  authorAvatarUrl,
}: {
  event: LiveEvent;
  authorUsername: string;
  showAuthor?: boolean;
  authorDisplayName?: string | null;
  authorAvatarUrl?: string | null;
}) {
  const coverSrc = event.album_cover_url || event.artist_img;
  const tint = useDominantColor(coverSrc);
  const { playing, progress, toggle } = usePreviewAudio(event.preview_url);

  return (
    <article
      className="block p-3 relative overflow-hidden"
      style={
        tint
          ? {
              borderLeftWidth: '4px',
              borderLeftColor: tint,
              backgroundImage: `linear-gradient(90deg, ${tint}14 0%, transparent 45%)`,
            }
          : undefined
      }
    >
      {showAuthor && (
        <Link
          href={`/${authorUsername}`}
          className="inline-flex items-center gap-1.5 text-[0.72rem] mono pb-1.5 mb-2 rule font-semibold"
        >
          <AuthorAvatar
            username={authorUsername}
            displayName={authorDisplayName}
            avatarUrl={authorAvatarUrl}
            size={20}
          />
          <span>@{authorUsername}</span>
          {authorDisplayName && authorDisplayName !== authorUsername && (
            <span className="opacity-60 font-normal">· {authorDisplayName}</span>
          )}
          <span className="chip-solid chip ml-1">LIVE</span>
        </Link>
      )}

      <div className="flex gap-3">
        <ArtistAvatar name={event.artist_name} img={coverSrc} size={56} />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <Link
              href={`/${authorUsername}/live/${event.id}`}
              className="min-w-0 group/link"
            >
              <h3 className="font-semibold text-[0.95rem] truncate leading-tight group-hover/link:underline decoration-1 underline-offset-4">
                {event.artist_name}
              </h3>
              {event.track_title && (
                <p className="text-sm opacity-70 truncate">{event.track_title}</p>
              )}
            </Link>
            <div className="flex items-center gap-2 shrink-0">
              <PlayButton
                playing={playing}
                onToggle={toggle}
                disabled={!event.preview_url}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {!showAuthor && <span className="chip chip-solid">LIVE</span>}
            {event.event_date && (
              <time className="text-[0.72rem] mono-num opacity-70">{event.event_date}</time>
            )}
            {event.genre && <span className="chip">{event.genre}</span>}
          </div>

          {event.venue && (
            <p className="text-sm mt-2 opacity-80">@ {event.venue}</p>
          )}

          <div className="mt-2">
            <AddToWishlistButton
              artist_name={event.artist_name}
              artist_img={event.artist_img}
              album_cover_url={event.album_cover_url}
              genre={event.genre}
              track_title={event.track_title}
              preview_url={event.preview_url}
            />
          </div>
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
