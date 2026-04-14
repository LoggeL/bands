'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type AuthUser = {
  id: number;
  username: string;
  display_name: string | null;
};

export default function Header({ currentUser }: { currentUser: AuthUser | null }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
    setLoading(false);
  }

  return (
    <div className="flex items-center gap-3">
      {currentUser ? (
        <>
          <Link
            href={`/${currentUser.username}`}
            className="text-sm font-semibold text-text hover:text-pink transition-colors"
          >
            {currentUser.display_name || currentUser.username}
          </Link>
          <button
            onClick={handleLogout}
            disabled={loading}
            className="text-xs text-text-muted hover:text-text transition-colors px-3 py-1.5 rounded-lg border border-border hover:border-pink/50 disabled:opacity-50"
          >
            {loading ? '…' : 'Logout'}
          </button>
        </>
      ) : (
        <>
          <Link
            href="/login"
            className="text-xs text-text-muted hover:text-text transition-colors"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="text-xs font-semibold bg-pink/10 text-pink hover:bg-pink/20 transition-colors px-3 py-1.5 rounded-lg"
          >
            Sign up
          </Link>
        </>
      )}
    </div>
  );
}
