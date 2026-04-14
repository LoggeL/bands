'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (res.ok) {
      const data = await res.json();
      router.push(`/${data.username}`);
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error || 'Login failed');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-4xl">🎸</span>
          <h1 className="text-2xl font-black font-[family-name:var(--font-display)] uppercase tracking-tight mt-2">
            Setlist
          </h1>
          <p className="text-text-muted text-sm mt-1">Welcome back</p>
        </div>

        <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-xs text-text-muted uppercase tracking-wider font-bold mb-1.5">
              Username
            </label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="your_username"
              required
              autoComplete="username"
              className="w-full bg-bg rounded-lg px-3 py-2.5 text-sm border border-border focus:border-pink outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs text-text-muted uppercase tracking-wider font-bold mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              className="w-full bg-bg rounded-lg px-3 py-2.5 text-sm border border-border focus:border-pink outline-none transition-colors"
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-pink text-bg-card rounded-lg font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <p className="text-center text-sm text-text-muted mt-4">
          No account?{' '}
          <Link href="/signup" className="text-pink hover:underline font-semibold">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
