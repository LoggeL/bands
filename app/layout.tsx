import type { Metadata } from 'next';
import './globals.css';
import { cookies } from 'next/headers';
import { getUserByToken } from '@/lib/auth';
import Header from '@/components/Header';

export const metadata: Metadata = {
  title: 'Setlist - Song Diary',
  description: 'Your personal music diary. Track what you listen to, concerts you attend, and artists on your wishlist.',
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🎸</text></svg>",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('session-token')?.value;
  const currentUser = token ? getUserByToken(token) : null;

  const authUser = currentUser
    ? { id: currentUser.id, username: currentUser.username, display_name: currentUser.display_name }
    : null;

  return (
    <html lang="de">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700;900&family=Manrope:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,1,0"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen antialiased">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between pt-4 pb-2">
            <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <span className="text-xl">🎸</span>
              <span className="text-base font-black font-[family-name:var(--font-display)] uppercase tracking-tight">
                Setlist
              </span>
            </a>
            <Header currentUser={authUser} />
          </div>
        </div>
        {children}
      </body>
    </html>
  );
}
