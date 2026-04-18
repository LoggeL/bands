'use client';

import { useEffect, useRef, useState } from 'react';

const VIEW = 320; // on-screen square preview
const OUT = 512; // exported avatar edge

/**
 * Minimal pan + zoom editor. Animated GIFs are not supported — the caller
 * should upload them unedited to preserve animation. This editor exports a
 * square PNG (or JPEG if source is JPEG) via canvas.
 */
export default function AvatarEditor({
  file,
  onConfirm,
  onCancel,
}: {
  file: File;
  onConfirm: (blob: Blob) => void;
  onCancel: () => void;
}) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [scale, setScale] = useState(1);
  const [minScale, setMinScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const draggingRef = useRef<{ startX: number; startY: number; offX: number; offY: number } | null>(
    null
  );

  // Load the source image from the given File.
  useEffect(() => {
    const url = URL.createObjectURL(file);
    const el = new Image();
    el.onload = () => {
      const fit = Math.max(VIEW / el.naturalWidth, VIEW / el.naturalHeight);
      setImg(el);
      setMinScale(fit);
      setScale(fit);
      setOffset({ x: 0, y: 0 });
    };
    el.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Clamp offset so the scaled image always covers the viewport.
  function clamp(ox: number, oy: number, s: number): { x: number; y: number } {
    if (!img) return { x: 0, y: 0 };
    const w = img.naturalWidth * s;
    const h = img.naturalHeight * s;
    const maxX = Math.max(0, (w - VIEW) / 2);
    const maxY = Math.max(0, (h - VIEW) / 2);
    return {
      x: Math.max(-maxX, Math.min(maxX, ox)),
      y: Math.max(-maxY, Math.min(maxY, oy)),
    };
  }

  function onPointerDown(e: React.PointerEvent) {
    (e.target as Element).setPointerCapture(e.pointerId);
    draggingRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      offX: offset.x,
      offY: offset.y,
    };
  }
  function onPointerMove(e: React.PointerEvent) {
    const d = draggingRef.current;
    if (!d) return;
    const next = clamp(d.offX + (e.clientX - d.startX), d.offY + (e.clientY - d.startY), scale);
    setOffset(next);
  }
  function onPointerUp() {
    draggingRef.current = null;
  }

  function setZoom(s: number) {
    const clamped = Math.max(minScale, Math.min(minScale * 5, s));
    setScale(clamped);
    setOffset((prev) => clamp(prev.x, prev.y, clamped));
  }

  function confirm() {
    if (!img) return;
    // imageOffset (top-left of the scaled image in viewport coords)
    const iox = (VIEW - img.naturalWidth * scale) / 2 + offset.x;
    const ioy = (VIEW - img.naturalHeight * scale) / 2 + offset.y;
    // Source rect in natural-pixel coords that maps to the viewport square.
    const sx = -iox / scale;
    const sy = -ioy / scale;
    const ss = VIEW / scale;

    const canvas = document.createElement('canvas');
    canvas.width = OUT;
    canvas.height = OUT;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, sx, sy, ss, ss, 0, 0, OUT, OUT);

    const mime = file.type === 'image/jpeg' ? 'image/jpeg' : 'image/png';
    canvas.toBlob(
      (blob) => {
        if (blob) onConfirm(blob);
      },
      mime,
      mime === 'image/jpeg' ? 0.9 : undefined
    );
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  const transform = img
    ? `translate(${offset.x}px, ${offset.y}px) scale(${scale})`
    : undefined;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(28, 20, 13, 0.55)' }}
    >
      <div className="block p-4 w-full max-w-sm space-y-3">
        <header className="flex items-baseline justify-between gap-2 rule pb-2">
          <h3 className="mono text-[0.72rem] uppercase tracking-[0.22em] font-semibold">
            Ausschnitt wählen
          </h3>
          <button
            type="button"
            onClick={onCancel}
            className="mono text-[0.72rem] underline underline-offset-[3px] opacity-70 hover:opacity-100"
          >
            abbrechen
          </button>
        </header>

        <div
          className="relative mx-auto overflow-hidden select-none cursor-grab active:cursor-grabbing touch-none"
          style={{
            width: VIEW,
            height: VIEW,
            border: '2px solid var(--color-ink)',
            borderRadius: 4,
            background: 'var(--color-paper-sunk)',
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onWheel={(e) => {
            e.preventDefault();
            setZoom(scale * (e.deltaY > 0 ? 0.94 : 1.06));
          }}
        >
          {img && (
            <img
              src={img.src}
              alt=""
              draggable={false}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                marginLeft: -img.naturalWidth / 2,
                marginTop: -img.naturalHeight / 2,
                transform,
                transformOrigin: 'center center',
                pointerEvents: 'none',
                maxWidth: 'none',
              }}
            />
          )}
          {/* subtle guide */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              boxShadow: 'inset 0 0 0 1px rgba(253, 251, 247, 0.35)',
              borderRadius: 2,
            }}
          />
        </div>

        <div className="flex items-center gap-2 text-[0.72rem] mono uppercase tracking-wider opacity-80">
          <span aria-hidden>−</span>
          <input
            type="range"
            min={minScale}
            max={minScale * 5}
            step={0.01}
            value={scale}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="flex-1"
          />
          <span aria-hidden>+</span>
        </div>

        <p className="text-[0.72rem] opacity-65 leading-snug">
          Ziehen zum Verschieben, scrollen oder Regler zum Zoomen.
        </p>

        <div className="flex justify-end gap-2 rule-t pt-3">
          <button type="button" onClick={onCancel} className="btn">
            Abbrechen
          </button>
          <button type="button" onClick={confirm} disabled={!img} className="btn btn-solid">
            Übernehmen
          </button>
        </div>
      </div>
    </div>
  );
}
