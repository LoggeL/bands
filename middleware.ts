import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware runs in the Edge runtime — no DB access here.
 * We just read the session cookie and forward it as a request header
 * so server components and API routes can validate it via lib/auth.ts.
 */
export function middleware(request: NextRequest) {
  const token = request.cookies.get('session-token')?.value;
  const requestHeaders = new Headers(request.headers);

  if (token) {
    requestHeaders.set('x-session-token', token);
  } else {
    requestHeaders.delete('x-session-token');
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
