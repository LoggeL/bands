'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    setSent(true);
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-16">
      <div className="rule-t-2 py-3 mb-6">
        <h1 className="text-xs uppercase tracking-widest font-bold">PASSWORT ZURÜCKSETZEN</h1>
      </div>

      {sent ? (
        <div className="block p-4 space-y-3">
          <p className="text-sm">
            Falls <span className="font-semibold">{email}</span> bei uns hinterlegt ist, ist ein Reset-Link unterwegs. Er läuft in 1 Stunde ab.
          </p>
          <p className="text-xs opacity-70">
            Schau auch im Spam-Ordner nach, falls er nicht auftaucht.
          </p>
          <Link href="/login" className="btn btn-solid w-full justify-center">
            Zurück zum Login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="block p-4 space-y-4">
          <div>
            <label className="block text-[0.7rem] uppercase tracking-wider font-bold mb-1">
              E-Mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="du@example.com"
              required
              autoComplete="email"
            />
          </div>

          <button type="submit" disabled={loading} className="btn btn-solid w-full justify-center">
            {loading ? 'SENDE…' : 'RESET-LINK SENDEN →'}
          </button>
        </form>
      )}

      <p className="text-center text-xs mt-4">
        <Link href="/login" className="underline">
          Zurück zum Login
        </Link>
      </p>
    </div>
  );
}
