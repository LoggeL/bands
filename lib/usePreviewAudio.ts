'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

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
      audioRef.current = new Audio(src);
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
