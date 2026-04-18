'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { FriendState } from '@/lib/queries';

export default function FriendButton({
  targetUsername,
  initialState,
}: {
  targetUsername: string;
  initialState: FriendState;
}) {
  const router = useRouter();
  const [state, setState] = useState<FriendState>(initialState);
  const [busy, setBusy] = useState(false);

  if (state === 'self' || state === 'anonymous') return null;

  async function call(path: string, method: 'POST' | 'DELETE') {
    setBusy(true);
    const res = await fetch(path, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: targetUsername }),
    });
    setBusy(false);
    if (res.ok) {
      const data = (await res.json()) as { state: FriendState };
      setState(data.state);
      router.refresh();
    }
  }

  if (state === 'none') {
    return (
      <button disabled={busy} onClick={() => call('/api/friends', 'POST')} className="btn btn-solid">
        + FREUND
      </button>
    );
  }

  if (state === 'outgoing_pending') {
    return (
      <button disabled={busy} onClick={() => call('/api/friends', 'DELETE')} className="btn">
        × ANFRAGE ZURÜCKZIEHEN
      </button>
    );
  }

  if (state === 'incoming_pending') {
    return (
      <div className="flex gap-2">
        <button
          disabled={busy}
          onClick={() => call('/api/friends/accept', 'POST')}
          className="btn btn-solid"
        >
          ✓ ANNEHMEN
        </button>
        <button
          disabled={busy}
          onClick={() => call('/api/friends/decline', 'POST')}
          className="btn"
        >
          × ABLEHNEN
        </button>
      </div>
    );
  }

  // friends
  return (
    <button disabled={busy} onClick={() => call('/api/friends', 'DELETE')} className="btn">
      ✓ FREUNDE · ENTFREUNDEN
    </button>
  );
}
