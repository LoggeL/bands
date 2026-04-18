type Props = {
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  size?: number;
};

function computeInitials(name: string): string {
  const parts = name.split(/[\s&_-]+/).filter(Boolean);
  if (parts.length === 0) return '×';
  return parts
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');
}

function hueFrom(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 360;
}

export default function AuthorAvatar({
  username,
  displayName,
  avatarUrl,
  size = 20,
}: Props) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt=""
        width={size}
        height={size}
        className="rounded-full object-cover border border-ink/70 shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }

  const initials = computeInitials(displayName || username);
  const hue = hueFrom(username);
  return (
    <span
      aria-hidden
      className="inline-flex items-center justify-center rounded-full border border-ink/70 font-bold leading-none shrink-0 mono-num"
      style={{
        width: size,
        height: size,
        fontSize: Math.max(8, Math.round(size * 0.42)),
        background: `hsl(${hue}, 60%, 86%)`,
        color: `hsl(${hue}, 55%, 22%)`,
      }}
    >
      {initials}
    </span>
  );
}
