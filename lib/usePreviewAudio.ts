'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Rewrite cross-origin Deezer preview URLs through our same-origin proxy.
 * Deezer's preview CDN sometimes rejects direct browser requests (missing
 * Referer, regional blocks, etc.), so /api/audio fetches with a deezer.com
 * Referer and pipes the bytes back.
 */
export function proxiedAudioUrl(src: string | null | undefined): string | null {
  if (!src) return null;
  if (src.startsWith('/') || src.startsWith('data:') || src.startsWith('blob:')) {
    return src;
  }
  // Legacy rows stored relative paths like `previews/xyz.mp3`. Without the
  // leading slash the browser resolves them against the current page path,
  // which breaks under @username routes. Fix by making them root-relative.
  if (src.startsWith('previews/') || src.startsWith('avatars/')) {
    return '/' + src;
  }
  try {
    const u = new URL(src);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return src;
    if (u.hostname === 'dzcdn.net' || u.hostname.endsWith('.dzcdn.net')) {
      return `/api/audio?url=${encodeURIComponent(src)}`;
    }
  } catch {
    // Malformed URL — let the browser try and fail naturally.
  }
  return src;
}

/**
 * Shared audio state for preview playback.
 * - Reads volume from localStorage and listens for setlist-volume-change events.
 * - Returns live progress (0..1) so callers can render a progress UI.
 */
export function usePreviewAudio(src: string | null) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    function onVolume(e: Event) {
      const v = (e as CustomEvent).detail as number;
      if (audioRef.current) audioRef.current.volume = v;
    }
    window.addEventListener('setlist-volume-change', onVolume);
    return () => window.removeEventListener('setlist-volume-change', onVolume);
  }, []);

  useEffect(
    () => () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    },
    []
  );

  const toggle = useCallback(() => {
    if (!src) return;
    if (!audioRef.current) {
      const playable = proxiedAudioUrl(src) || src;
      audioRef.current = new Audio(playable);
      const stored =
        typeof window !== 'undefined' ? localStorage.getItem('setlist-volume') : null;
      audioRef.current.volume = stored !== null ? parseFloat(stored) : 0.7;
      audioRef.current.addEventListener('timeupdate', () => {
        if (audioRef.current) {
          const p = audioRef.current.currentTime / audioRef.current.duration;
          setProgress(Number.isFinite(p) ? p : 0);
        }
      });
      audioRef.current.addEventListener('ended', () => {
        setPlaying(false);
        setProgress(0);
      });
    }
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  }, [src, playing]);

  return { playing, progress, toggle };
}
