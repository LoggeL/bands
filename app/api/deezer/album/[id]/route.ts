import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const n = parseInt(id, 10);
  if (!n) return NextResponse.json({ genre: null });

  try {
    const res = await fetch(`https://api.deezer.com/album/${n}`);
    if (!res.ok) return NextResponse.json({ genre: null });
    const data = await res.json();
    const first = data?.genres?.data?.[0]?.name ?? null;
    return NextResponse.json({ genre: first });
  } catch {
    return NextResponse.json({ genre: null });
  }
}
