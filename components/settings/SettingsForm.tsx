'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Visibility } from '@/lib/db';
import { VISIBILITY_OPTIONS } from '@/lib/constants';

export default function SettingsForm({
  initial,
}: {
  initial: {
    display_name: string;
    bio: string;
    visibility: Visibility;
    email: string;
    notify_email: boolean;
  };
}) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<'' | 'saved' | 'error'>('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setStatus('');
    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setStatus(res.ok ? 'saved' : 'error');
    if (res.ok) router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-10">
      <Section
        title="Profil"
        hint="Was andere sehen, wenn sie auf deinem Profil landen."
      >
        <Field label="Anzeigename">
          <input
            value={form.display_name}
            onChange={(e) => setForm((p) => ({ ...p, display_name: e.target.value }))}
            placeholder="Dein Name"
          />
        </Field>
        <Field label="Bio">
          <textarea
            value={form.bio}
            onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
            placeholder="Eine Zeile über dich"
            rows={2}
            className="resize-none"
          />
        </Field>
      </Section>

      <Section
        title="Kontakt"
        hint="Für Freundschafts-Benachrichtigungen und das Zurücksetzen des Passworts. Leer lassen heißt: keine E-Mails."
      >
        <Field label="E-Mail">
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            placeholder="du@example.com"
            autoComplete="email"
          />
        </Field>

        <label className="flex items-start gap-2.5 text-sm cursor-pointer select-none">
          <input
            type="checkbox"
            checked={form.notify_email}
            onChange={(e) => setForm((p) => ({ ...p, notify_email: e.target.checked }))}
            className="w-auto mt-0.5"
          />
          <span className="leading-snug">
            E-Mail, wenn jemand eine Freundschaftsanfrage sendet oder annimmt.
          </span>
        </label>
      </Section>

      <Section
        title="Sichtbarkeit"
        hint="Gilt für Tagebuch, Bands, Live und Wunschliste — nicht für dein Profil selbst."
      >
        <div className="divide-y divide-rule">
          {VISIBILITY_OPTIONS.map((opt) => {
            const selected = form.visibility === opt.value;
            return (
              <label
                key={opt.value}
                className={`flex items-start gap-3 py-3 cursor-pointer ${
                  selected ? '' : 'opacity-80 hover:opacity-100'
                }`}
              >
                <input
                  type="radio"
                  name="visibility"
                  value={opt.value}
                  checked={selected}
                  onChange={() => setForm((p) => ({ ...p, visibility: opt.value }))}
                  className="mt-1 w-auto"
                />
                <div className="min-w-0">
                  <div
                    className={`mono text-[0.7rem] uppercase tracking-[0.22em] ${
                      selected ? 'font-semibold' : 'opacity-75'
                    }`}
                  >
                    {opt.label}
                  </div>
                  <div className="text-sm opacity-75 mt-0.5">{opt.hint}</div>
                </div>
              </label>
            );
          })}
        </div>
      </Section>

      <footer className="flex items-center justify-between gap-3 rule-t pt-4 flex-wrap">
        <span className="text-sm min-h-[1.25rem]">
          {status === 'saved' && <span className="mark">Gespeichert ✓</span>}
          {status === 'error' && <span className="opacity-70">Etwas ist schiefgelaufen.</span>}
        </span>
        <button type="submit" disabled={saving} className="btn btn-solid">
          {saving ? 'Speichere…' : 'Speichern'}
        </button>
      </footer>
    </form>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <header>
        <h2 className="mono text-[0.72rem] uppercase tracking-[0.22em] font-semibold">
          {title}
        </h2>
        {hint && <p className="text-[0.78rem] opacity-65 mt-1 leading-snug">{hint}</p>}
      </header>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1">
      <span className="mono text-[0.68rem] uppercase tracking-[0.2em] opacity-75">
        {label}
      </span>
      {children}
    </label>
  );
}
