import { deleteSession, clearSessionCookie } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const token = req.cookies.get('session-token')?.value;
  if (token) {
    deleteSession(token);
  }
  return NextResponse.json(
    { ok: true },
    { headers: { 'Set-Cookie': clearSessionCookie() } }
  );
}
