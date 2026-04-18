function initials(s: string): string {
  return (s || '')
    .split(/[\s_.-]+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('') || '×';
}

export default function UserAvatar({
  username,
  displayName,
  avatarUrl,
  size = 56,
  className = '',
}: {
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  size?: number;
  className?: string;
}) {
  const label = displayName || username;

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={label}
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className={`border-2 border-ink shrink-0 object-cover block rounded-[4px] ${className}`}
      />
    );
  }

  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      className={`border-2 border-ink shrink-0 flex items-center justify-center bg-paper-sunk font-bold rounded-[4px] ${className}`}
    >
      {initials(label)}
    </div>
  );
}
