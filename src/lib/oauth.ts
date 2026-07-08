import { prisma } from './prisma';
import { HttpError } from './errors';
import { slugify } from './http';
import { OAUTH_ALLOW_LINKING } from './auth-policy';

// Re-exported from auth-policy (single source of truth). Linking an OAuth
// sign-in to an existing account on a matching verified email is safe because
// Google/GitHub verify primary emails. Asserted by a test.
export { OAUTH_ALLOW_LINKING };

export type OAuthProfile = {
  provider: 'google' | 'github';
  email: string | null;
  emailVerified: boolean;
  name?: string | null;
};

export type OAuthResult = {
  userId: string;
  brandId: string | null;
  role: 'ADMIN' | 'BRAND';
  // true when the user has not yet accepted the Terms/Privacy (GDPR). The auth
  // gate routes these users to the consent screen before the dashboard.
  needsConsent: boolean;
};

// Whether a signed-in user must pass the GDPR consent screen before the
// dashboard. Scoped to OAuth-only accounts (no password) that haven't accepted
// terms. Credentials signups accept up front; pre-terms credential users are
// grandfathered — neither is gated.
export function requiresConsentGate(u: {
  passwordHash: string | null;
  termsAcceptedAt: Date | null;
}): boolean {
  return u.passwordHash === null && u.termsAcceptedAt === null;
}

// Find-or-create the tenant for an OAuth sign-in. Existing verified email →
// sign into that account (link). New email → create Brand + OWNER user with no
// password and consent pending. This mirrors what credentials signup does,
// minus the password and the up-front terms checkbox.
export async function upsertOAuthUser(profile: OAuthProfile): Promise<OAuthResult> {
  if (!profile.emailVerified) {
    throw new HttpError(
      403,
      'Your provider email is not verified. Verify it with your provider, or sign in with a password.'
    );
  }
  const email = profile.email?.trim().toLowerCase();
  if (!email) {
    throw new HttpError(400, 'Your provider did not share an email address.');
  }

  const existing = await prisma.user.findUnique({
    where: { email },
    include: { brand: { select: { disabled: true } } },
  });

  if (existing) {
    if (existing.brand?.disabled) throw new HttpError(403, 'This workspace is disabled');
    return {
      userId: existing.id,
      brandId: existing.brandId,
      role: existing.role,
      needsConsent: existing.termsAcceptedAt == null,
    };
  }

  const baseName = profile.name?.trim() || email.split('@')[0] || 'brand';
  const baseSlug = slugify(baseName) || 'brand';

  const created = await prisma.$transaction(async (tx) => {
    let slug = baseSlug;
    for (let attempt = 0; attempt < 5; attempt++) {
      const taken = await tx.brand.findUnique({ where: { slug } });
      if (!taken) break;
      slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
    }
    const brand = await tx.brand.create({ data: { name: baseName, slug } });
    const user = await tx.user.create({
      data: {
        email,
        name: profile.name ?? null,
        passwordHash: null, // OAuth-only account: password login is impossible
        role: 'BRAND',
        brandRole: 'OWNER',
        brandId: brand.id,
        termsAcceptedAt: null, // captured on the post-OAuth consent screen
      },
    });
    return { user, brand };
  });

  return {
    userId: created.user.id,
    brandId: created.brand.id,
    role: created.user.role,
    needsConsent: true,
  };
}
