'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

type AuthUser = {
  id: number;
  username: string;
  display_name: string | null;
};

export default function Header({
  currentUser,
  incomingRequests,
}: {
  currentUser: AuthUser | null;
  incomingRequests: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
    setLoading(false);
  }

  function linkClass(href: string) {
    const active = href === '/' ? pathname === '/' : pathname === href;
    return `mono text-[0.78rem] leading-none py-1.5 px-2 rounded-[3px] transition-colors ${
      active
        ? 'bg-ink text-paper hover:bg-ink-soft hover:text-paper font-semibold'
        : 'opacity-75 hover:opacity-100 hover:bg-mark-soft'
    }`;
  }

  const buttonClass =
    'mono text-[0.78rem] leading-none py-1.5 px-2 rounded-[3px] opacity-75 hover:opacity-100 hover:bg-mark-soft disabled:opacity-30 transition-colors';

  const solidClass =
    'mono text-[0.78rem] leading-none py-1.5 px-2 rounded-[3px] bg-ink text-paper hover:bg-ink-soft hover:text-paper font-semibold transition-colors';

  return (
    <header className="rule-2 bg-paper sticky top-0 z-40 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3 flex-wrap">
        <Link href="/" className="shrink-0">
          <span className="text-lg font-bold tracking-tight">setlist</span>
        </Link>

        <nav className="flex items-center gap-1.5 flex-wrap flex-1">
          <Link href="/" className={linkClass('/')}>Feed</Link>
          <Link href="/explore" className={linkClass('/explore')}>Entdecken</Link>

          <div className="ml-auto flex items-center gap-1.5 flex-wrap">
            {currentUser ? (
              <>
                <Link
                  href={`/${currentUser.username}`}
                  className={linkClass(`/${currentUser.username}`)}
                >
                  @{currentUser.username}
                  {incomingRequests > 0 && (
                    <span className="ml-1.5 mark mono-num text-[0.78rem] leading-none">
                      {incomingRequests}
                    </span>
                  )}
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loading}
                  className={buttonClass}
                >
                  {loading ? '…' : 'Ausloggen'}
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className={linkClass('/login')}>
                  Einloggen
                </Link>
                <Link href="/signup" className={solidClass}>
                  Registrieren
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
