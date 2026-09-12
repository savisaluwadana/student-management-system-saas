import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const isAuthenticated = Boolean(token);
  const pathname = request.nextUrl.pathname;

  const publicRoutes = ['/', '/login', '/signup', '/reset-password', '/docs'];
  const isPublicRoute =
    publicRoutes.includes(pathname) ||
    pathname.startsWith('/invite/') ||
    pathname.startsWith('/reset-password/');

  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  if (!isPublicRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isAuthenticated && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
