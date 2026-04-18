import { NextRequest } from 'next/server';

const ALLOWED_HOSTS = [
  'cdn-images.dzcdn.net',
  'e-cdns-images.dzcdn.net',
  'api.deezer.com',
];

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) return new Response('missing url', { status: 400 });

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return new Response('invalid url', { status: 400 });
  }
  if (parsed.protocol !== 'https:' || !ALLOWED_HOSTS.includes(parsed.hostname)) {
    return new Response('forbidden', { status: 403 });
  }

  const upstream = await fetch(parsed.toString(), {
    cache: 'force-cache',
  });
  if (!upstream.ok) return new Response('upstream error', { status: 502 });

  const buf = await upstream.arrayBuffer();
  return new Response(buf, {
    headers: {
      'Content-Type': upstream.headers.get('content-type') || 'image/jpeg',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
