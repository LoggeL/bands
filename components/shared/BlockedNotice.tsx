import type { Visibility } from '@/lib/db';

export default function BlockedNotice({ visibility }: { visibility: Visibility }) {
  const headline =
    visibility === 'private' ? 'PRIVATES PROFIL' : 'NUR FREUNDE';
  const sub =
    visibility === 'private'
      ? 'Hier gibt\u2019s nichts zu sehen — diese Person hält alles privat.'
      : 'Werdet Freunde, um diese Inhalte zu sehen.';

  return (
    <div className="block p-6 text-center stripe">
      <div className="inline-block mark font-bold px-2">{headline}</div>
      <p className="text-sm mt-3 opacity-90">{sub}</p>
    </div>
  );
}
