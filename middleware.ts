import { NextResponse, type NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth/auth';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const user = token ? verifyToken(token) : null;

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/signup', '/reset-password'];
  const isPublicRoute = publicRoutes.includes(request.nextUrl.pathname);

  // Allow API auth routes without authentication
  if (request.nextUrl.pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // Protect all non-public routes
  if (!isPublicRoute && !user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect authenticated users away from auth pages
  if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
