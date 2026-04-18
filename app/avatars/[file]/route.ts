import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import path from 'path';

const EXT_TO_MIME: Record<string, string> = {
  gif: 'image/gif',
  png: 'image/png',
  webp: 'image/webp',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  svg: 'image/svg+xml',
  avif: 'image/avif',
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ file: string }> }
) {
  const { file } = await params;
  if (!file || file.includes('/') || file.includes('..') || file.includes('\\')) {
    return new NextResponse('not found', { status: 404 });
  }

  const filepath = path.join(process.cwd(), 'public', 'avatars', file);

  try {
    const info = await stat(filepath);
    if (!info.isFile()) throw new Error('not a file');

    const body = await readFile(filepath);
    const ext = file.split('.').pop()?.toLowerCase() ?? '';
    const contentType = EXT_TO_MIME[ext] ?? 'application/octet-stream';

    return new NextResponse(body as unknown as BodyInit, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(info.size),
        'Cache-Control': 'public, max-age=60, must-revalidate',
      },
    });
  } catch {
    return new NextResponse('not found', { status: 404 });
  }
}
