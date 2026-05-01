import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';

export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
};

export default middleware((req) => {
  if (!req.auth?.user) {
    const path = req.nextUrl.pathname;
    if (path.startsWith('/dashboard') || path.startsWith('/admin')) {
      const url = req.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('callbackUrl', path);
      return Response.redirect(url);
    }
  }
});
