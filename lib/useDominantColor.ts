'use client';

import { useEffect, useState } from 'react';

const CACHE_PREFIX = 'setlist-color:';

/** Route remote image through /api/img so canvas pixels can be read. */
export function proxiedImgUrl(src: string | null | undefined): string | null {
  if (!src) return null;
  if (src.startsWith('/') || src.startsWith('data:')) return src;
  try {
    const u = new URL(src);
    if (u.protocol === 'http:' || u.protocol === 'https:') {
      return `/api/img?url=${encodeURIComponent(src)}`;
    }
  } catch {}
  return src;
}

/**
 * Extract the dominant saturated color from an image. Loads via same-origin
 * proxy so canvas doesn't taint. Result cached in localStorage per URL.
 */
export function useDominantColor(src: string | null | undefined): string | null {
  const [hex, setHex] = useState<string | null>(null);

  useEffect(() => {
    if (!src) {
      setHex(null);
      return;
    }

    const cacheKey = CACHE_PREFIX + src;
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        setHex(cached);
        return;
      }
    }

    let cancelled = false;
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      if (cancelled) return;
      try {
        const size = 24;
        const c = document.createElement('canvas');
        c.width = size;
        c.height = size;
        const ctx = c.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);

        let r = 0, g = 0, b = 0, n = 0;
        let fr = 0, fg = 0, fb = 0, fn = 0;
        for (let i = 0; i < data.length; i += 4) {
          const R = data[i], G = data[i + 1], B = data[i + 2];
          fr += R; fg += G; fb += B; fn++;

          const max = Math.max(R, G, B);
          const min = Math.min(R, G, B);
          const saturation = max === 0 ? 0 : (max - min) / max;
          if (saturation < 0.25) continue;
          if (max < 40 || min > 230) continue;
          r += R; g += G; b += B; n++;
        }

        const use = n > 0 ? [r / n, g / n, b / n] : [fr / fn, fg / fn, fb / fn];
        const result = '#' + use
          .map((v) => Math.round(v).toString(16).padStart(2, '0'))
          .join('');
        if (!cancelled) {
          setHex(result);
          try {
            localStorage.setItem(cacheKey, result);
          } catch {}
        }
      } catch {
        // canvas tainted or decode failed — leave unset
      }
    };
    img.onerror = () => {
      /* silent */
    };
    img.src = proxiedImgUrl(src) || src;

    return () => {
      cancelled = true;
    };
  }, [src]);

  return hex;
}
