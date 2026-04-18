import Link from 'next/link';

export default function SharedWishlistCallout({
  otherUsername,
  otherDisplayName,
  shared,
}: {
  otherUsername: string;
  otherDisplayName: string | null;
  shared: { artist_name: string; album_cover_url: string | null; artist_img: string | null }[];
}) {
  if (shared.length === 0) return null;

  const other = otherDisplayName || otherUsername;

  return (
    <section
      className="block p-5 mb-6"
      style={{
        backgroundImage: 'linear-gradient(135deg, var(--color-mark-soft) 0%, transparent 70%)',
      }}
    >
      <div className="flex items-baseline gap-3 flex-wrap mb-1">
        <h2 className="text-lg font-semibold tracking-tight">
          <span className="mark-soft">Ihr wollt beide</span>
        </h2>
        <p className="text-sm mono-num opacity-70">
          {shared.length} Treffer
        </p>
      </div>
      <p className="text-sm opacity-85 mb-4 leading-relaxed max-w-lg">
        Du und{' '}
        <Link href={`/@${otherUsername}`} className="font-semibold underline decoration-1 underline-offset-2 hover:bg-mark px-0.5">
          @{otherUsername}
        </Link>{' '}
        wollt beide {shared.length} {shared.length === 1 ? 'Künstler' : 'Künstler'} live sehen. Plane ein Konzert mit {other}.
      </p>
      <ul className="flex flex-wrap gap-2">
        {shared.map((s) => (
          <li
            key={s.artist_name}
            className="flex items-center gap-2 border border-rule-strong rounded-full pl-1 pr-3 py-1 bg-paper"
          >
            {(s.album_cover_url || s.artist_img) && (
              <img
                src={`/api/img?url=${encodeURIComponent((s.album_cover_url || s.artist_img)!)}`}
                alt=""
                className="w-7 h-7 object-cover rounded-full"
              />
            )}
            <span className="text-sm font-medium">{s.artist_name}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
