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
      router.push(`/@${data.username}`);
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error || 'Login fehlgeschlagen');
    }
    setLoading(false);
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 md:py-16">
      <div className="mono text-[0.68rem] uppercase tracking-[0.28em] opacity-70 flex items-center gap-2">
        <span className="equalizer text-ember w-[16px]">
          <i /><i /><i /><i /><i />
        </span>
        <span>Seite&nbsp;B · Rückpass</span>
      </div>

      <div className="grid md:grid-cols-[1.05fr_1fr] gap-10 md:gap-14 items-start pt-5">
        {/* Decorative liner-note panel */}
        <aside className="relative">
          <h1 className="serif text-[clamp(2.6rem,7.5vw,5rem)] leading-[0.94] font-medium tracking-tight">
            <span className="italic text-ember">willkommen</span>
            <span className="block">
              zurück auf <span className="marker">seite B</span>.
            </span>
          </h1>

          <p className="mt-5 max-w-md text-[1rem] leading-relaxed opacity-85 serif italic">
            &ldquo;Die Nadel merkt sich, wo du aufgehört hast — deine Randnotizen,
            deine Ticketabrisse, deine Wiederholungen um drei Uhr morgens.&rdquo;
          </p>
          <p className="mt-2 mono text-[0.7rem] uppercase tracking-wider opacity-55">
            — Liner Note, setlist
          </p>

          <div className="mt-8 flex items-center gap-5">
            <div className="vinyl w-[120px]" aria-hidden />
            <div>
              <div className="mono text-[0.66rem] uppercase tracking-[0.22em] opacity-60">
                Track&nbsp;B1
              </div>
              <div className="serif italic text-[1.35rem] leading-tight mt-0.5">
                dein Tagebuch
              </div>
              <div className="mono-num text-[0.7rem] opacity-55 mt-0.5">
                fortgesetzt — ∞:∞∞
              </div>
            </div>
          </div>
        </aside>

        {/* Form panel */}
        <div className="relative">
          <div className="cassette p-5 md:p-6 relative">
            {/* little reel dots */}
            <div className="absolute top-3 right-4 flex gap-2 opacity-60">
              <span className="block w-2 h-2 rounded-full bg-ink" />
              <span className="block w-2 h-2 rounded-full bg-ink" />
            </div>

            <div className="flex items-baseline justify-between gap-2 mb-5 pb-2 rule-2">
              <h2 className="serif text-[1.7rem] leading-none font-medium italic">
                einloggen
              </h2>
              <span className="mono text-[0.66rem] uppercase tracking-[0.22em] opacity-55">
                00:00 / ∞
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block">
                <span className="mono text-[0.66rem] uppercase tracking-[0.22em] font-semibold opacity-75 block mb-1">
                  Benutzername
                </span>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="dein_benutzername"
                  required
                  autoComplete="username"
                />
              </label>

              <label className="block">
                <span className="mono text-[0.66rem] uppercase tracking-[0.22em] font-semibold opacity-75 block mb-1">
                  Passwort
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </label>

              {error && (
                <div className="flex items-start gap-2 text-[0.8rem]">
                  <span className="serif italic text-ember text-[1.1rem] leading-none">✺</span>
                  <span className="mark">{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn btn-ember w-full justify-center"
              >
                {loading ? (
                  <>
                    <span className="equalizer w-[16px]">
                      <i /><i /><i /><i /><i />
                    </span>
                    <span>Nadel ansetzen…</span>
                  </>
                ) : (
                  <>Nadel absenken →</>
                )}
              </button>

              <p className="text-center text-[0.75rem] opacity-75">
                <Link href="/forgot-password" className="underline decoration-1 underline-offset-[3px]">
                  Passwort vergessen?
                </Link>
              </p>
            </form>
          </div>

          <p className="text-center text-[0.8rem] mt-5 opacity-80">
            Zum ersten Mal im Plattenladen?{' '}
            <Link href="/signup" className="serif italic font-semibold underline decoration-[var(--color-ember)] decoration-2 underline-offset-[3px]">
              leg ein neues Tagebuch an
            </Link>
          </p>
        </div>
      </div>

      <div className="rule-ember mt-14" />
    </div>
  );
}
