import NextAuth, { type DefaultSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import GitHub from 'next-auth/providers/github';
import type { Provider } from 'next-auth/providers';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from './prisma';
import { authConfig } from './auth.config';
import { rateLimit } from './ratelimit';
import { upsertOAuthUser, requiresConsentGate } from './oauth';
// HttpError lives in ./errors (no heavy imports) so it's usable from unit tests
// and edge code; imported for local use here and re-exported for existing importers.
import { HttpError } from './errors';

export { HttpError };

// Social login is optional: providers are only registered when their secrets
// exist, so the app runs fine without OAuth configured (buttons hide via
// oauthProviders()). Secrets are server-only env vars.
const socialProviders: Provider[] = [];
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  socialProviders.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  socialProviders.push(
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    })
  );
}

/** Which social providers are configured on this deploy (for the login UI). */
export function oauthProviders(): Array<'google' | 'github'> {
  const out: Array<'google' | 'github'> = [];
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) out.push('google');
  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) out.push('github');
  return out;
}

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

// Precomputed bcrypt hash of a random secret, used to spend the same CPU
// time on missing-account login attempts as on real ones, so an attacker
// can't enumerate accounts via response timing.
const DUMMY_HASH = bcrypt.hashSync(
  `dummy-${Math.random()}-${Date.now()}`,
  12
);

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

        // Throttle by IP+email so a single attacker can't brute-force a target
        // and a single shared IP (office/NAT) can't lock everyone out.
        const ip =
          headers().get('x-forwarded-for')?.split(',')[0]?.trim() ||
          headers().get('x-real-ip') ||
          'unknown';
        const { ok: allowed } = rateLimit(`login:${ip}:${email.toLowerCase()}`, 10);
        if (!allowed) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        // No account, or an OAuth-only account (null passwordHash) that can't
        // password-login. Always spend a bcrypt round so timing can't tell the
        // two apart from a real account.
        if (!user || !user.passwordHash) {
          await bcrypt.compare(password, DUMMY_HASH);
          return null;
        }
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
    ...socialProviders,
  ],
  callbacks: {
    ...authConfig.callbacks,
    // OAuth sign-in: resolve the tenant (find-or-create) and stamp our own
    // user id / role / brandId onto the user object so the shared jwt callback
    // (in auth.config) puts them on the token. Returning false denies sign-in
    // (unverified email, no email, or disabled workspace).
    async signIn({ user, account, profile }) {
      if (!account || account.provider === 'credentials') return true;
      if (account.provider !== 'google' && account.provider !== 'github') return true;
      try {
        const email = ((profile?.email as string | undefined) ?? user.email) || null;
        // Google reports email_verified explicitly. GitHub only returns the
        // account's primary email, which GitHub itself verifies, so treat a
        // present GitHub email as verified.
        const emailVerified =
          account.provider === 'google' ? profile?.email_verified === true : Boolean(email);
        const res = await upsertOAuthUser({
          provider: account.provider,
          email,
          emailVerified,
          name: (user.name as string | undefined) ?? (profile?.name as string | undefined) ?? null,
        });
        user.id = res.userId;
        (user as { role?: string }).role = res.role;
        (user as { brandId?: string | null }).brandId = res.brandId;
        return true;
      } catch {
        return false;
      }
    },
  },
});


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
  // GDPR consent gate, scoped to OAuth signups (passwordHash null). Credentials
  // signups accept terms up front, and pre-existing credential users are
  // grandfathered, so we don't force them through a consent wall. Only an
  // OAuth-only account that hasn't consented yet is redirected. Cheap indexed
  // lookup; reads live state so it can't go stale like a token flag would.
  const consent = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { termsAcceptedAt: true, passwordHash: true },
  });
  if (consent && requiresConsentGate(consent)) redirect('/complete-signup');
  return {
    userId: session.user.id,
    brandId: session.user.brandId,
    email: session.user.email ?? '',
  };
}
