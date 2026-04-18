'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LogoutButton({
  className = 'btn',
}: {
  className?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handle() {
    setLoading(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  }

  return (
    <button type="button" onClick={handle} disabled={loading} className={className}>
      {loading ? '…' : 'Ausloggen'}
    </button>
  );
}
