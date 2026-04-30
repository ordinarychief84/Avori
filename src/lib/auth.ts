import NextAuth, { type DefaultSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from './prisma';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: 'ADMIN' | 'BRAND';
      brandId: string | null;
    } & DefaultSession['user'];
  }
}

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (raw) => {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name ?? null,
          role: user.role,
          brandId: user.brandId,
        };
      },
    }),
  ],
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
});

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function requireBrand() {
  const session = await auth();
  if (!session?.user) throw new HttpError(401, 'Unauthorized');
  if (session.user.role !== 'BRAND' || !session.user.brandId) {
    throw new HttpError(403, 'Forbidden');
  }
  return { userId: session.user.id, brandId: session.user.brandId };
}

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new HttpError(401, 'Unauthorized');
  if (session.user.role !== 'ADMIN') throw new HttpError(403, 'Forbidden');
  return { userId: session.user.id };
}
