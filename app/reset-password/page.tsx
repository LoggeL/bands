'use client';

import { useState, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Passwörter stimmen nicht überein');
      return;
    }
    setLoading(true);
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    });
    setLoading(false);
    if (res.ok) {
      setDone(true);
      setTimeout(() => router.push('/login'), 1500);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Zurücksetzen fehlgeschlagen');
    }
  }

  if (!token) {
    return (
      <div className="block p-4 space-y-3">
        <p className="text-sm">Diesem Link fehlt ein Token.</p>
        <Link href="/forgot-password" className="btn btn-solid w-full justify-center">
          Neuen Link anfordern
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="block p-4 space-y-3">
        <p className="text-sm">
          <span className="mark">Passwort aktualisiert.</span> Weiterleitung zum Login…
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="block p-4 space-y-4">
      <div>
        <label className="block text-[0.7rem] uppercase tracking-wider font-bold mb-1">
          Neues Passwort
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          autoComplete="new-password"
          minLength={8}
        />
        <p className="text-[0.65rem] opacity-60 mt-1">mind. 8 Zeichen</p>
      </div>

      <div>
        <label className="block text-[0.7rem] uppercase tracking-wider font-bold mb-1">
          Passwort bestätigen
        </label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="••••••••"
          required
          autoComplete="new-password"
          minLength={8}
        />
      </div>

      {error && <p className="text-xs"><span className="mark">! {error}</span></p>}

      <button type="submit" disabled={loading} className="btn btn-solid w-full justify-center">
        {loading ? 'SETZE ZURÜCK…' : 'NEUES PASSWORT SPEICHERN →'}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="max-w-sm mx-auto px-4 py-16">
      <div className="rule-t-2 py-3 mb-6">
        <h1 className="text-xs uppercase tracking-widest font-bold">NEUES PASSWORT</h1>
      </div>

      <Suspense fallback={<div className="block p-4 text-sm opacity-70">Lade…</div>}>
        <ResetForm />
      </Suspense>

      <p className="text-center text-xs mt-4">
        <Link href="/login" className="underline">
          Zurück zum Login
        </Link>
      </p>
    </div>
  );
}
