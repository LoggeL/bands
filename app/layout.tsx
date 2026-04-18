import type { Metadata } from 'next';
import { JetBrains_Mono, Inter, Fraunces } from 'next/font/google';
import './globals.css';
import { cookies } from 'next/headers';
import { getUserByToken } from '@/lib/auth';
import { friendCounts } from '@/lib/queries';
import Header from '@/components/Header';
import FloatingVolume from '@/components/shared/FloatingVolume';

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-mono',
  display: 'swap',
});

const sans = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const serif = Fraunces({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  axes: ['SOFT', 'opsz'],
  variable: '--font-serif-stack',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SETLIST',
  description: 'Das Tagebuch für Musikfans. Trag ein, was du hörst, welche Konzerte du besuchst und welche Künstler du live sehen willst.',
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='48' fill='%231c140d'/><circle cx='50' cy='50' r='42' fill='none' stroke='%232a1f15' stroke-width='0.6'/><circle cx='50' cy='50' r='34' fill='none' stroke='%232a1f15' stroke-width='0.6'/><circle cx='50' cy='50' r='26' fill='none' stroke='%232a1f15' stroke-width='0.6'/><circle cx='50' cy='50' r='18' fill='%23b64319'/><circle cx='50' cy='50' r='3.5' fill='%23f5ecd6'/></svg>",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('session-token')?.value;
  const currentUser = token ? getUserByToken(token) : null;

  const authUser = currentUser
    ? { id: currentUser.id, username: currentUser.username, display_name: currentUser.display_name }
    : null;

  const incoming = currentUser ? friendCounts(currentUser.id).incoming : 0;

  return (
    <html lang="de" className={`${mono.variable} ${sans.variable} ${serif.variable}`}>
      <body className="min-h-screen">
        <Header currentUser={authUser} incomingRequests={incoming} />
        {children}
        <FloatingVolume />
      </body>
    </html>
  );
}
