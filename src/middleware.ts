import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';

// Single source of truth for route gating: the `authorized` callback in
// authConfig. Auth.js redirects unauthenticated users to /login automatically
// when `authorized` returns false. The admin role check also lives there.
export const { auth: middleware } = NextAuth(authConfig);
export default middleware;

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
};
