import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16 md:py-24">
      <div className="mono text-[0.68rem] uppercase tracking-[0.28em] opacity-70 flex items-center gap-2 mb-4">
        <span className="equalizer text-ember w-[16px]">
          <i /><i /><i /><i /><i />
        </span>
        <span>Seite&nbsp;B · Nadel übersprungen</span>
      </div>

      <div className="grid md:grid-cols-[1fr_auto] gap-8 items-end">
        <div>
          <h1 className="serif text-[clamp(3.2rem,10vw,6rem)] leading-[0.9] font-medium tracking-tight">
            <span className="italic text-ember">4</span>
            <span className="marker">0</span>
            <span className="italic text-ember">4</span>
          </h1>

          <p className="serif italic text-[1.35rem] md:text-[1.55rem] mt-4 leading-snug">
            Dieser Track ist nicht im Katalog.
          </p>

          <p className="mt-4 max-w-md text-[0.95rem] leading-relaxed opacity-80">
            Vielleicht hat jemand die Platte rausgenommen — oder die URL ist nur
            ein Tippfehler. Kein Weltuntergang, geh zurück zur Seite&nbsp;A.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-2.5">
            <Link href="/" className="btn btn-ember">
              Zum Feed →
            </Link>
            <Link href="/explore" className="btn">
              Entdecken
            </Link>
            <span className="mono text-[0.7rem] opacity-55 ml-1">
              Route nicht gefunden
            </span>
          </div>
        </div>

        <aside className="hidden md:block relative pr-2">
          <div className="vinyl w-[180px] lg:w-[200px]" aria-hidden />
          <span
            className="wobble absolute -top-2 -left-3 chip chip-solid"
            style={{
              background: 'var(--color-ember)',
              borderColor: 'var(--color-ember)',
            }}
          >
            B-SEITE&nbsp;LEER
          </span>
        </aside>
      </div>

      <div className="rule-ember mt-12" />
    </div>
  );
}
