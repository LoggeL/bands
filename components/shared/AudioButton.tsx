'use client';

import { usePreviewAudio } from '@/lib/usePreviewAudio';

type PlayButtonProps = {
  playing: boolean;
  onToggle: () => void;
  disabled?: boolean;
  label?: string;
};

export function PlayButton({ playing, onToggle, disabled, label }: PlayButtonProps) {
  if (disabled) return null;
  return (
    <button
      type="button"
      onClick={onToggle}
      className="relative inline-flex items-center justify-center w-8 h-8 border border-rule-strong bg-paper hover:bg-mark-soft shrink-0 rounded-full overflow-hidden transition-colors"
      title={playing ? 'Pause' : 'Vorschau abspielen'}
      aria-label={label || (playing ? 'Pause' : 'Abspielen')}
    >
      <span className="text-[0.68rem] leading-none mono-num relative z-10">
        {playing ? '❚❚' : '▶'}
      </span>
    </button>
  );
}

/** Self-contained player button. Owns its own audio instance. */
export default function AudioButton({ src, label }: { src: string | null; label?: string }) {
  const { playing, toggle } = usePreviewAudio(src);
  if (!src) return null;
  return <PlayButton playing={playing} onToggle={toggle} label={label} />;
}
