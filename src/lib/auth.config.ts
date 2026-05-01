import type { NextAuthConfig } from 'next-auth';

// Edge-safe shared config — no Node-only deps (bcrypt, Prisma).
// Used by middleware. The full credentials provider lives in auth.ts.
export const authConfig: NextAuthConfig = {
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.role = (user as { role: 'ADMIN' | 'BRAND' }).role;
        token.brandId = (user as { brandId: string | null }).brandId;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as 'ADMIN' | 'BRAND';
        session.user.brandId = (token.brandId as string | null) ?? null;
      }
      return session;
    },
    authorized: async ({ auth: session, request }) => {
      const path = request.nextUrl.pathname;
      const isDashboard = path.startsWith('/dashboard');
      const isAdmin = path.startsWith('/admin');
      if (!isDashboard && !isAdmin) return true;
      if (!session?.user) return false;
      if (isAdmin && session.user.role !== 'ADMIN') return false;
      return true;
    },
  },
};
