import NextAuth, { type DefaultSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { redirect } from 'next/navigation';
import { prisma } from './prisma';
import { authConfig } from './auth.config';

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
  ...authConfig,
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

// For server pages under /dashboard. Belt-and-suspenders behind middleware:
// if a streaming/race lets a request slip through middleware, redirect here
// instead of crashing on a non-null assertion.
export async function pageBrandSession() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role === 'ADMIN') redirect('/admin');
  if (session.user.role !== 'BRAND' || !session.user.brandId) redirect('/login');
  return {
    userId: session.user.id,
    brandId: session.user.brandId,
    email: session.user.email ?? '',
  };
}
