'use client';

import type { ArtistSummary } from '@/lib/queries';
import ArtistAvatar from './ArtistAvatar';
import AudioButton from './AudioButton';
import AddToWishlistButton from '@/components/wishlist/AddToWishlistButton';
import BandStatusToggles from './BandStatusToggles';

export default function ArtistCard({
  artist,
  ownerUsername,
  showAddToWishlist = false,
  isOwner = false,
}: {
  artist: ArtistSummary;
  ownerUsername: string;
  showAddToWishlist?: boolean;
  isOwner?: boolean;
}) {
  const coverSrc = artist.album_cover_url || artist.artist_img;
  const tint = artist.dominant_color;
  const seen = artist.live_events.length > 0;
  const wants = artist.wishlist_id !== null;

  // Status → visual treatment
  //   seen-only      : solid ink rail, subtle tint from cover, full opacity
  //   want-only      : dashed amber rail, paper-warm stripe, muted cover
  //   seen + wants   : solid ink rail + small ember accent strip on the right
  let style: React.CSSProperties | undefined;
  let extraClass = '';

  if (seen) {
    style = tint
      ? {
          borderLeftWidth: '4px',
          borderLeftColor: tint,
          backgroundColor: `${tint}26`,
        }
      : {
          borderLeftWidth: '4px',
          borderLeftColor: 'var(--color-ink)',
        };
    if (wants) {
      style = {
        ...style,
        borderRightWidth: '3px',
        borderRightColor: 'var(--color-ember)',
      };
    }
  } else {
    // want only — flat tint (cover if available, else ember wash), dashed ember rail
    style = tint
      ? {
          borderLeftWidth: '4px',
          borderLeftColor: 'var(--color-ember)',
          borderLeftStyle: 'dashed',
          backgroundColor: `${tint}1a`,
        }
      : {
          borderLeftWidth: '4px',
          borderLeftColor: 'var(--color-ember)',
          borderLeftStyle: 'dashed',
          backgroundColor: 'rgba(182, 67, 25, 0.08)',
        };
  }

  return (
    <article className={`block p-2.5 relative ${extraClass}`} style={style}>
      <div className="flex gap-2.5">
        <ArtistAvatar name={artist.artist_name} img={coverSrc} size={48} />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-[0.92rem] truncate leading-tight">
                {artist.artist_name}
              </h3>
              {artist.track_title && (
                <p className="text-[0.78rem] opacity-70 truncate leading-tight mt-0.5">
                  {artist.track_title}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <AudioButton src={artist.preview_url} />
            </div>
          </div>

          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            {!isOwner && seen && (
              <span className="chip chip-solid" title="Live gesehen">
                GESEHEN
                {artist.live_events.length > 1 && ` ×${artist.live_events.length}`}
              </span>
            )}
            {!isOwner && wants && (
              <span
                className={`chip ${!seen ? 'chip-ember' : ''}`}
                title="Auf der Wunschliste"
              >
                WILL SEHEN
              </span>
            )}
            {artist.genre && <span className="chip">{artist.genre}</span>}
            {artist.upcoming_events.length > 0 && (
              <span
                className="chip chip-ember"
                title={`${artist.upcoming_events.length} angekündigte Konzert${artist.upcoming_events.length === 1 ? '' : 'e'}`}
              >
                LIVE · {artist.upcoming_events.length}
              </span>
            )}
          </div>

          {artist.upcoming_events.length > 0 && (
            <ul className="mt-1.5 space-y-0.5 text-[0.72rem] leading-snug">
              {artist.upcoming_events.slice(0, 2).map((e, i) => {
                const loc = [e.city, e.country].filter(Boolean).join(', ');
                const label = (
                  <>
                    <span className="mono-num mr-1">{e.event_date}</span>
                    {e.venue && <span className="opacity-80">· {e.venue}</span>}
                    {loc && <span className="opacity-60"> · {loc}</span>}
                  </>
                );
                return (
                  <li key={`${e.event_date}-${i}`} className="truncate">
                    {e.ticket_url || e.event_url ? (
                      <a
                        href={e.ticket_url || e.event_url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline decoration-1 underline-offset-2"
                      >
                        {label}
                      </a>
                    ) : (
                      <span className="opacity-85">{label}</span>
                    )}
                  </li>
                );
              })}
              {artist.upcoming_events.length > 2 && (
                <li className="mono text-[0.68rem] opacity-60">
                  + {artist.upcoming_events.length - 2} weitere
                </li>
              )}
            </ul>
          )}

          {isOwner ? (
            <BandStatusToggles artist={artist} />
          ) : (
            showAddToWishlist && !wants && !seen && (
              <div className="mt-2">
                <AddToWishlistButton
                  artist_name={artist.artist_name}
                  artist_img={artist.artist_img}
                  album_cover_url={artist.album_cover_url}
                  genre={artist.genre}
                  track_title={artist.track_title}
                  preview_url={artist.preview_url}
                />
              </div>
            )
          )}
        </div>
      </div>
    </article>
  );
}
