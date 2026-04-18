import Link from 'next/link';
import { cookies } from 'next/headers';
import { getUserByToken } from '@/lib/auth';
import { getFeed } from '@/lib/queries';
import DiaryCard from '@/components/diary/DiaryCard';

const TICKER_WORDS = [
  'seite A',
  'nadel runter',
  'bandrauschen',
  'erste reihe',
  'erstes mal',
  'langsame rotation',
  'zugabe',
  'seite B',
  'lo-fi',
  'handgepresst',
  'tiefe rillen',
  'dauerschleife',
];

function formatDayHeading(day: string): string {
  const [y, m, d] = day.split('-').map(Number);
  if (!y || !m || !d) return day;
  const date = new Date(Date.UTC(y, m - 1, d));
  const today = new Date();
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const diffDays = Math.round((todayUtc - date.getTime()) / 86400000);
  if (diffDays === 0) return 'Heute';
  if (diffDays === 1) return 'Gestern';
  return date.toLocaleDateString('de-DE', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: date.getUTCFullYear() !== today.getUTCFullYear() ? 'numeric' : undefined,
    timeZone: 'UTC',
  });
}

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<{ scope?: string }>;
}) {
  const resolved = searchParams ? await searchParams : undefined;
  const cookieStore = await cookies();
  const token = cookieStore.get('session-token')?.value;
  const viewer = token ? getUserByToken(token) : null;

  const scopeParam = resolved?.scope === 'friends' && viewer ? 'friends' : 'everyone';
  const days = getFeed({ viewerId: viewer?.id ?? null, scope: scopeParam });
  const totalTracks = days.reduce((s, d) => s + d.items.length, 0);

  return (
    <div className="max-w-3xl mx-auto px-4 pb-24 md:pl-20">
      {!viewer && <LandingHero />}

      <section className="pt-8">
        <FeedHeader scope={scopeParam} authed={!!viewer} count={totalTracks} />

        {days.length === 0 ? (
          <EmptyState scope={scopeParam} authed={!!viewer} />
        ) : (
          <div className="space-y-10 mt-8">
            {days.map((day) => (
              <section key={day.date}>
                <DayHeader label={formatDayHeading(day.date)} count={day.items.length} />
                <ol className="setlist mt-4">
                  {day.items.map((item) => (
                    <li key={`d-${item.id}`}>
                      <DiaryCard
                        entry={item}
                        authorUsername={item.author_username}
                        authorDisplayName={item.author_display_name}
                        authorAvatarUrl={item.author_avatar_url}
                        viewerLoggedIn={!!viewer}
                        viewerSeen={item.viewer_seen}
                        viewerWishlisted={item.viewer_wishlisted}
                        canEdit={!!viewer && viewer.username === item.author_username}
                        showAuthor
                      />
                    </li>
                  ))}
                </ol>
              </section>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function LandingHero() {
  return (
    <section className="pt-10 pb-12 -ml-0 md:-ml-16">
      <div className="mono text-[0.68rem] uppercase tracking-[0.28em] opacity-70 flex items-center gap-2">
        <span className="equalizer text-ember w-[16px]">
          <i /><i /><i /><i /><i />
        </span>
        <span>Vol.&nbsp;01 · das Tagebuch für Musikfans</span>
      </div>

      <div className="grid md:grid-cols-[1fr_auto] gap-8 items-end pt-4">
        <div>
          <h1 className="serif text-[clamp(3rem,9.2vw,6.4rem)] leading-[0.92] font-medium tracking-tight">
            <span className="italic text-ember">setlist</span>
            <span className="block mt-1 text-ink">
              halt fest, <span className="marker">was du gehört hast</span>.
            </span>
          </h1>

          <p className="mt-6 max-w-lg text-[1.02rem] leading-relaxed opacity-85">
            Ein ruhiges, handgeschriebenes Tagebuch für Musikfans — für Tracks,
            Konzerte und Platten, die dir nicht mehr aus dem Kopf gehen. Trag
            den heutigen Song ein, notier dir das Konzert, hinterlass eine
            Randnotiz für dich selbst von morgen.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-2.5">
            <Link href="/signup" className="btn btn-ember">
              Starte deine Seite&nbsp;A →
            </Link>
            <Link href="/login" className="btn">Einloggen</Link>
            <span className="mono text-[0.7rem] opacity-55 ml-1">
              kein Algorithmus · keine Metriken · keine Werbung
            </span>
          </div>
        </div>

        <aside className="hidden md:block relative pr-2">
          <div className="vinyl w-[180px] lg:w-[220px]" aria-hidden />
          <span
            className="wobble absolute -top-2 -left-3 chip chip-solid"
            style={{ background: 'var(--color-ember)', borderColor: 'var(--color-ember)' }}
          >
            SEITE&nbsp;A
          </span>
        </aside>
      </div>

      <div className="mt-10 perf-b">
        <div className="ticker serif italic text-[1.25rem] text-ember-soft opacity-85 py-1.5">
          <div>
            {[...TICKER_WORDS, ...TICKER_WORDS].map((w, i) => (
              <span key={i} className="flex items-center gap-6 shrink-0">
                <span>{w}</span>
                <span className="text-ink opacity-30">✺</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="rule-ember mt-10" />
    </section>
  );
}

function FeedHeader({
  scope,
  authed,
  count,
}: {
  scope: 'friends' | 'everyone';
  authed: boolean;
  count: number;
}) {
  return (
    <div className="flex items-end justify-between gap-4 flex-wrap">
      <div>
        <div className="mono text-[0.68rem] uppercase tracking-[0.28em] opacity-70 flex items-center gap-2 mb-2">
          <span className="equalizer text-ember w-[16px]">
            <i /><i /><i /><i /><i />
          </span>
          Läuft gerade
          {count > 0 && (
            <span className="opacity-50">
              · <span className="mono-num">{count.toString().padStart(2, '0')}</span> Track{count === 1 ? '' : 's'}
            </span>
          )}
        </div>
        <h2 className="serif text-[2.35rem] md:text-[2.75rem] leading-[1.02] font-medium tracking-tight">
          {scope === 'friends' ? (
            <>
              <span className="italic">aus</span>{' '}
              <span className="marker">deinem Kreis</span>
            </>
          ) : (
            <>
              <span className="italic">das</span>{' '}
              <span className="marker-ember">gemeinsame Mixtape</span>
            </>
          )}
        </h2>
        <p className="text-sm opacity-65 mt-1.5">
          {scope === 'friends'
            ? "Tagebuchseiten von Leuten aus deinem Kreis. Näher am Puls."
            : "Was alle zuletzt gehört haben, sortiert nach dem Tag, an dem's auf den Plattenteller kam."}
        </p>
      </div>

      {authed && (
        <div className="cassette flex gap-1 text-xs">
          <Link
            href="/"
            className={`btn ${scope === 'everyone' ? 'btn-solid' : ''}`}
          >
            Alle
          </Link>
          <Link
            href="/?scope=friends"
            className={`btn ${scope === 'friends' ? 'btn-solid' : ''}`}
          >
            Freunde
          </Link>
        </div>
      )}
    </div>
  );
}

function DayHeader({ label, count }: { label: string; count: number }) {
  return (
    <header className="flex items-baseline gap-3 pb-2 rule">
      <h3 className="serif italic text-[1.45rem] leading-none tracking-tight">
        {label}
      </h3>
      <span className="mono text-[0.68rem] uppercase tracking-[0.22em] opacity-55">
        {count.toString().padStart(2, '0')} Track{count === 1 ? '' : 's'}
      </span>
    </header>
  );
}

function EmptyState({ scope, authed }: { scope: 'friends' | 'everyone'; authed: boolean }) {
  return (
    <div className="mt-8 block p-8 md:p-10 text-center relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-70 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 85% 20%, rgba(217,114,48,0.14), transparent 42%),' +
            'radial-gradient(circle at 10% 90%, rgba(255,214,107,0.28), transparent 42%)',
        }}
      />
      <div className="relative">
        <span className="equalizer text-ember w-5 mx-auto mb-2 block">
          <i /><i /><i /><i /><i />
        </span>
        <p className="serif italic text-[1.6rem] leading-tight">
          {scope === 'friends' ? 'Ein leiser Groove aus deinem Kreis.' : 'Noch nichts auf dem Teller.'}
        </p>
        <p className="text-sm mt-3 opacity-80 max-w-sm mx-auto">
          {scope === 'friends'
            ? "Noch keine Seiten aus deinem Kreis — versuch's mit dem ganzen Mixtape unter Alle."
            : authed
              ? 'Nadel runter: leg über dein Profil einen Eintrag an.'
              : 'Registriere dich, um Tracks und Konzerte einzukleben.'}
        </p>
      </div>
    </div>
  );
}
