'use client';

import { usePreviewVolume } from '@/lib/useVolume';

export default function VolumeControl() {
  const [volume, setVolume] = usePreviewVolume();
  const pct = Math.round(volume * 100);
  const icon = volume === 0 ? '⊘' : volume < 0.4 ? '◐' : '◉';

  return (
    <div className="cassette flex items-center gap-3 py-2 px-3">
      <span
        className="mono text-[0.66rem] uppercase tracking-[0.22em] opacity-75 flex items-center gap-2 shrink-0"
        aria-hidden
      >
        <span className="text-base leading-none">{icon}</span>
        <span>Volume</span>
      </span>

      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={volume}
        onChange={(e) => setVolume(parseFloat(e.target.value))}
        aria-label={`Vorschau-Lautstärke ${pct} Prozent`}
        className="flex-1 h-1 cursor-pointer"
        style={
          {
            accentColor: 'var(--color-ember)',
          } as React.CSSProperties
        }
      />

      <span className="mono-num text-[0.72rem] w-8 text-right opacity-80 shrink-0">
        {pct}
      </span>
    </div>
  );
}
