'use client';

import { usePathname } from 'next/navigation';
import VolumeControl from './VolumeControl';

// Pages without any audio previews — slider is hidden there.
const HIDE_EXACT = new Set([
  '/explore',
  '/settings',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
]);

function shouldHide(pathname: string): boolean {
  if (HIDE_EXACT.has(pathname)) return true;
  // Friends subpage — list of users, no previews.
  if (pathname.endsWith('/friends')) return true;
  // Profile overview (e.g. /logge) — stats only, no preview controls.
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 1) return true;
  return false;
}

export default function FloatingVolume() {
  const pathname = usePathname();
  if (shouldHide(pathname)) return null;

  return (
    <div className="fixed bottom-3 right-3 z-40 w-56 shadow-md pointer-events-auto">
      <VolumeControl />
    </div>
  );
}
