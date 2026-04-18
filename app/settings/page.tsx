import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getUserByToken } from '@/lib/auth';
import SettingsForm from '@/components/settings/SettingsForm';
import AvatarUploader from '@/components/settings/AvatarUploader';

export default async function SettingsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session-token')?.value;
  const me = token ? getUserByToken(token) : null;

  if (!me) redirect('/login');

  return (
    <div className="max-w-xl mx-auto px-4 pb-16 pt-8">
      <div className="mono text-[0.68rem] uppercase tracking-[0.22em] opacity-70 flex items-center justify-between gap-3 mb-2">
        <span>Einstellungen</span>
        <Link
          href={`/@${me.username}`}
          className="underline decoration-1 underline-offset-[3px] opacity-70 hover:opacity-100"
        >
          ← zurück zum Profil
        </Link>
      </div>
      <h1 className="serif text-[2.2rem] leading-none font-medium tracking-tight mb-10">
        <span className="italic opacity-85">hallo</span>, {me.display_name || me.username}.
      </h1>

      <section className="space-y-4 mb-10">
        <header>
          <h2 className="mono text-[0.72rem] uppercase tracking-[0.22em] font-semibold">
            Profilbild
          </h2>
          <p className="text-[0.78rem] opacity-65 mt-1 leading-snug">
            Erscheint neben deinem Namen auf deinem Profil und in Kommentaren.
          </p>
        </header>
        <AvatarUploader
          username={me.username}
          displayName={me.display_name}
          initialUrl={me.avatar_url}
        />
      </section>

      <SettingsForm
        initial={{
          display_name: me.display_name || '',
          bio: me.bio || '',
          visibility: me.visibility,
          email: me.email || '',
          notify_email: !!me.notify_email,
        }}
      />
    </div>
  );
}
