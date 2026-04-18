'use client';

import { useEffect, useState } from 'react';

const VOLUME_KEY = 'setlist-volume';

export function usePreviewVolume() {
  const [volume, setVolume] = useState(() => {
    if (typeof window === 'undefined') return 0.7;
    const stored = localStorage.getItem(VOLUME_KEY);
    return stored !== null ? parseFloat(stored) : 0.7;
  });

  useEffect(() => {
    localStorage.setItem(VOLUME_KEY, String(volume));
    window.dispatchEvent(new CustomEvent('setlist-volume-change', { detail: volume }));
  }, [volume]);

  return [volume, setVolume] as const;
}
