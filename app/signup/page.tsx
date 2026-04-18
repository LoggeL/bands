'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        display_name: displayName,
        password,
        email: email || undefined,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      router.push(`/${data.username}`);
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error || 'Registrierung fehlgeschlagen');
    }
    setLoading(false);
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-12 md:py-16">
      <div className="mono text-[0.68rem] uppercase tracking-[0.28em] opacity-70 flex items-center gap-2 mb-3">
        <span className="equalizer text-ember w-[16px]">
          <i /><i /><i /><i /><i />
        </span>
        <span>Seite&nbsp;A · Neu hier</span>
      </div>

      <h1 className="serif text-[clamp(2.2rem,6.5vw,3rem)] leading-[0.95] font-medium tracking-tight">
        <span className="italic text-ember">dein</span>{' '}
        <span className="marker">setlist</span>{' '}
        <span className="italic opacity-80">starten.</span>
      </h1>

      <p className="text-sm opacity-70 mt-3 leading-relaxed">
        Ein hangebundenes Tagebuch für Tracks, Konzerte und Platten — für dich selbst von morgen.
      </p>

      <form onSubmit={handleSubmit} className="cassette mt-7 p-5 space-y-5">
        <Field
          label="Benutzername"
          hint="a-z 0-9 _ -"
        >
          <input
            value={username}
            onChange={(e) =>
              setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))
            }
            placeholder="dein_benutzername"
            required
            autoComplete="username"
          />
        </Field>

        <Field label="Anzeigename" optional>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Dein Name"
            autoComplete="name"
          />
        </Field>

        <Field
          label="E-Mail"
          optional
          hint="Für Benachrichtigungen und Passwort-Reset."
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="du@example.com"
            autoComplete="email"
          />
        </Field>

        <Field label="Passwort" hint="mind. 8 Zeichen">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="new-password"
            minLength={8}
          />
        </Field>

        {error && (
          <p className="text-[0.8rem]">
            <span className="mark">! {error}</span>
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn btn-ember w-full justify-center mt-1"
        >
          {loading ? (
            <>
              <span className="equalizer w-[14px]">
                <i /><i /><i /><i /><i />
              </span>
              <span>Lege auf…</span>
            </>
          ) : (
            <>Seite&nbsp;A einlegen →</>
          )}
        </button>
      </form>

      <p className="text-center text-[0.8rem] mt-5 opacity-80">
        Schon ein Konto?{' '}
        <Link
          href="/login"
          className="serif italic font-semibold underline decoration-[var(--color-ember)] decoration-2 underline-offset-[3px]"
        >
          einloggen
        </Link>
      </p>
    </div>
  );
}

function Field({
  label,
  optional,
  hint,
  children,
}: {
  label: string;
  optional?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1">
      <span className="mono text-[0.66rem] uppercase tracking-[0.22em] font-semibold opacity-80 flex items-baseline gap-1.5">
        {label}
        {optional && <span className="font-normal opacity-55">(optional)</span>}
      </span>
      {children}
      {hint && <span className="mono text-[0.65rem] opacity-55">{hint}</span>}
    </label>
  );
}
