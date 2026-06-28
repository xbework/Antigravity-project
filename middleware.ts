import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';
import { getRoleRedirect, ROLES, type Role } from '@/lib/roles';

const { auth } = NextAuth(authConfig);

const PROTECTED_ROUTES = [
  { path: '/admin', allowed: [ROLES.ADMIN] },
  { path: '/master', allowed: [ROLES.MASTER, ROLES.ADMIN] },
  { path: '/staff/users', allowed: [ROLES.MASTER, ROLES.ADMIN] }, // Strict restriction
  { path: '/staff', allowed: [ROLES.STAFF, ROLES.MASTER, ROLES.ADMIN] },
  { path: '/academics', allowed: [ROLES.STAFF, ROLES.MASTER, ROLES.ADMIN] },
  { path: '/student', allowed: [ROLES.STUDENT, ROLES.ADMIN] },
  { path: '/freetrial', allowed: [ROLES.FREE_TRIAL, ROLES.STUDENT, ROLES.MASTER, ROLES.STAFF, ROLES.ADMIN] },
];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Find if current path matches a protected route (most specific first)
  const protectedEntry = PROTECTED_ROUTES.find(({ path }) =>
    pathname.startsWith(path)
  );

  if (!protectedEntry) return NextResponse.next();

  const allowedRoles = protectedEntry.allowed;

  // Not logged in → redirect to login
  if (!session?.user) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const userRole = (session.user as { role?: Role }).role;

  // Wrong role → redirect to their proper dashboard
  if (userRole && !allowedRoles.includes(userRole)) {
    return NextResponse.redirect(new URL(getRoleRedirect(userRole), req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/admin/:path*', '/master/:path*', '/staff/:path*', '/student/:path*', '/freetrial/:path*', '/academics/:path*'],
};
