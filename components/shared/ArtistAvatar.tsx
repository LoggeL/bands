'use client';

import { useState } from 'react';
import { proxiedImgUrl } from '@/lib/useDominantColor';

function initials(name: string): string {
  return name
    .split(/[\s&]+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');
}

export default function ArtistAvatar({
  name,
  img,
  size = 56,
}: {
  name: string;
  img: string | null;
  size?: number;
}) {
  const [error, setError] = useState(false);

  const common = {
    width: size,
    height: size,
  } as const;

  if (img && !error) {
    return (
      <img
        src={proxiedImgUrl(img) || img}
        alt={name}
        style={common}
        className="border border-rule-strong shrink-0 object-cover block rounded-[4px]"
        onError={() => setError(true)}
      />
    );
  }

  return (
    <div
      style={common}
      className="border border-rule-strong shrink-0 flex items-center justify-center bg-paper-sunk font-semibold rounded-[4px]"
    >
      <span style={{ fontSize: size * 0.36 }}>{initials(name) || '×'}</span>
    </div>
  );
}
