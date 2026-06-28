import { NextRequest, NextResponse } from 'next/server';

// Simple mocked auth middleware - check for session cookie
export function middleware(request: NextRequest) {
  const session = request.cookies.get('r53_session');
  const isLoginPage = request.nextUrl.pathname === '/login';

  // If no session and not on login page, redirect to login
  if (!session && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If session exists and on login page, redirect to dashboard
  if (session && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
