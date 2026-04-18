'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import UserAvatar from '@/components/shared/UserAvatar';
import AvatarEditor from './AvatarEditor';

export default function AvatarUploader({
  username,
  displayName,
  initialUrl,
}: {
  username: string;
  displayName: string | null;
  initialUrl: string | null;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState<string | null>(initialUrl);
  const [busy, setBusy] = useState<'uploading' | 'removing' | null>(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<File | null>(null);

  async function upload(blob: Blob, filename: string) {
    setError('');
    setBusy('uploading');
    const fd = new FormData();
    fd.append('file', blob, filename);
    const res = await fetch('/api/avatar', { method: 'POST', body: fd });
    setBusy(null);
    if (res.ok) {
      const data = (await res.json()) as { avatar_url: string };
      setUrl(data.avatar_url);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Upload fehlgeschlagen');
    }
  }

  function onPick(f: File) {
    setError('');
    if (f.type === 'image/gif') {
      // Preserve animation — skip the editor entirely.
      upload(f, f.name);
      return;
    }
    setEditing(f);
  }

  async function remove() {
    setError('');
    setBusy('removing');
    const res = await fetch('/api/avatar', { method: 'DELETE' });
    setBusy(null);
    if (res.ok) {
      setUrl(null);
      router.refresh();
    } else {
      setError('Entfernen fehlgeschlagen');
    }
  }

  return (
    <div className="flex items-start gap-4">
      <UserAvatar
        username={username}
        displayName={displayName}
        avatarUrl={url}
        size={72}
      />

      <div className="min-w-0 flex-1 space-y-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onPick(f);
            e.target.value = '';
          }}
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy !== null}
            className="btn"
          >
            {busy === 'uploading' ? 'Lade…' : url ? 'Bild ersetzen' : 'Bild hochladen'}
          </button>
          {url && (
            <button
              type="button"
              onClick={remove}
              disabled={busy !== null}
              className="btn"
            >
              {busy === 'removing' ? 'Entferne…' : 'Entfernen'}
            </button>
          )}
        </div>
        <p className="text-[0.72rem] opacity-65 leading-snug">
          PNG, JPG, WEBP oder GIF · max. 8 MB. GIFs werden unverändert übernommen, damit die Animation erhalten bleibt.
        </p>
        {error && <p className="text-[0.78rem]"><span className="mark">! {error}</span></p>}
      </div>

      {editing && (
        <AvatarEditor
          file={editing}
          onCancel={() => setEditing(null)}
          onConfirm={(blob) => {
            const name = editing.name.replace(/\.[^.]+$/, '') + (blob.type === 'image/jpeg' ? '.jpg' : '.png');
            setEditing(null);
            upload(blob, name);
          }}
        />
      )}
    </div>
  );
}
