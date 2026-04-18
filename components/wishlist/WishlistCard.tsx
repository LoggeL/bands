'use client';

import type { WishlistItem } from '@/lib/db';
import { useDominantColor } from '@/lib/useDominantColor';
import { usePreviewAudio } from '@/lib/usePreviewAudio';
import ArtistAvatar from '@/components/shared/ArtistAvatar';
import { PlayButton } from '@/components/shared/AudioButton';
import AddToWishlistButton from './AddToWishlistButton';

export default function WishlistCard({ item }: { item: WishlistItem }) {
  const coverSrc = item.album_cover_url || item.artist_img;
  const tint = useDominantColor(coverSrc);
  const { playing, progress, toggle } = usePreviewAudio(item.preview_url);

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
      <div className="flex gap-3">
        <ArtistAvatar name={item.artist_name} img={coverSrc} size={56} />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-[0.95rem] truncate leading-tight">
                {item.artist_name}
              </h3>
              {item.track_title && (
                <p className="text-sm opacity-70 truncate">{item.track_title}</p>
              )}
            </div>
            <span className="chip chip-solid shrink-0">WILL</span>
          </div>

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {item.genre && <span className="chip">{item.genre}</span>}
          </div>

          <div className="flex items-center justify-between mt-2">
            <PlayButton
              playing={playing}
              onToggle={toggle}
              disabled={!item.preview_url}
            />
            <AddToWishlistButton
              artist_name={item.artist_name}
              artist_img={item.artist_img}
              album_cover_url={item.album_cover_url}
              genre={item.genre}
              track_title={item.track_title}
              preview_url={item.preview_url}
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
