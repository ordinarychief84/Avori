import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the DB layer so these are fast, deterministic unit tests with no real
// database. $transaction runs its callback against the same mock (tx === prisma).
vi.mock('@/lib/prisma', () => {
  const prisma: Record<string, unknown> = {
    user: { findUnique: vi.fn(), create: vi.fn() },
    brand: { findUnique: vi.fn(), create: vi.fn() },
  };
  prisma.$transaction = vi.fn(async (cb: (tx: unknown) => unknown) => cb(prisma));
  return { prisma };
});

import { upsertOAuthUser } from '@/lib/oauth';
import { prisma } from '@/lib/prisma';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const p = prisma as any;

beforeEach(() => {
  vi.clearAllMocks();
  p.$transaction.mockImplementation(async (cb: (tx: unknown) => unknown) => cb(p));
});

describe('upsertOAuthUser — signup (brand-new user)', () => {
  it('creates a User + Brand as OWNER, normalizes email, and flags consent needed', async () => {
    p.user.findUnique.mockResolvedValue(null); // no existing account
    p.brand.findUnique.mockResolvedValue(null); // slug is free
    p.brand.create.mockResolvedValue({ id: 'brand_1' });
    p.user.create.mockResolvedValue({
      id: 'user_1',
      role: 'BRAND',
      brandId: 'brand_1',
      termsAcceptedAt: null,
    });

    const res = await upsertOAuthUser({
      provider: 'google',
      email: 'New@Shop.com',
      emailVerified: true,
      name: 'Maya',
    });

    expect(res).toEqual({
      userId: 'user_1',
      brandId: 'brand_1',
      role: 'BRAND',
      needsConsent: true,
    });
    expect(p.brand.create).toHaveBeenCalledOnce();
    expect(p.user.create).toHaveBeenCalledOnce();

    const userData = p.user.create.mock.calls[0][0].data;
    expect(userData.email).toBe('new@shop.com'); // lowercased
    expect(userData.brandRole).toBe('OWNER');
    expect(userData.passwordHash ?? null).toBeNull(); // OAuth-only: no password
    expect(userData.termsAcceptedAt ?? null).toBeNull(); // consent captured later
  });
});

describe('upsertOAuthUser — login (existing user, account linking)', () => {
  it('links to the existing account by email and creates no new brand', async () => {
    p.user.findUnique.mockResolvedValue({
      id: 'user_9',
      role: 'BRAND',
      brandId: 'brand_9',
      termsAcceptedAt: new Date(),
      brand: { disabled: false },
    });

    const res = await upsertOAuthUser({
      provider: 'github',
      email: 'maya@shop.com',
      emailVerified: true,
    });

    expect(res).toEqual({
      userId: 'user_9',
      brandId: 'brand_9',
      role: 'BRAND',
      needsConsent: false,
    });
    expect(p.brand.create).not.toHaveBeenCalled();
    expect(p.user.create).not.toHaveBeenCalled();
  });

  it('flags consent needed when the existing user has not accepted terms yet', async () => {
    p.user.findUnique.mockResolvedValue({
      id: 'u',
      role: 'BRAND',
      brandId: 'b',
      termsAcceptedAt: null,
      brand: { disabled: false },
    });

    const res = await upsertOAuthUser({ provider: 'google', email: 'x@y.com', emailVerified: true });
    expect(res.needsConsent).toBe(true);
  });
});

describe('upsertOAuthUser — error cases', () => {
  it('rejects a profile with no email', async () => {
    await expect(
      upsertOAuthUser({ provider: 'google', email: null, emailVerified: true })
    ).rejects.toMatchObject({ status: 400 });
    expect(p.user.create).not.toHaveBeenCalled();
  });

  it('rejects an unverified provider email (this is what makes linking safe)', async () => {
    await expect(
      upsertOAuthUser({ provider: 'github', email: 'spoofed@shop.com', emailVerified: false })
    ).rejects.toMatchObject({ status: 403 });
    expect(p.user.findUnique).not.toHaveBeenCalled();
  });

  it('blocks sign-in when the linked workspace is disabled', async () => {
    p.user.findUnique.mockResolvedValue({
      id: 'u',
      role: 'BRAND',
      brandId: 'b',
      termsAcceptedAt: new Date(),
      brand: { disabled: true },
    });
    await expect(
      upsertOAuthUser({ provider: 'google', email: 'x@y.com', emailVerified: true })
    ).rejects.toMatchObject({ status: 403 });
  });
});

describe('requiresConsentGate — GDPR gate scoping', () => {
  it('gates an OAuth-only account that has not accepted terms', async () => {
    const { requiresConsentGate } = await import('@/lib/oauth');
    expect(requiresConsentGate({ passwordHash: null, termsAcceptedAt: null })).toBe(true);
  });
  it('does NOT gate an OAuth user who already accepted', async () => {
    const { requiresConsentGate } = await import('@/lib/oauth');
    expect(requiresConsentGate({ passwordHash: null, termsAcceptedAt: new Date() })).toBe(false);
  });
  it('does NOT gate a grandfathered credentials user (has a password, no terms)', async () => {
    const { requiresConsentGate } = await import('@/lib/oauth');
    expect(requiresConsentGate({ passwordHash: '$2a$hash', termsAcceptedAt: null })).toBe(false);
  });
  it('does NOT gate a normal credentials user', async () => {
    const { requiresConsentGate } = await import('@/lib/oauth');
    expect(requiresConsentGate({ passwordHash: '$2a$hash', termsAcceptedAt: new Date() })).toBe(false);
  });
});

describe('session / token-refresh posture (login-only social auth)', () => {
  it('uses stateless JWT sessions, so refresh is JWT rotation, not stored provider tokens', async () => {
    // auth.config.ts drives its real strategy off this same constant, so this
    // assertion tracks the actual runtime config without importing NextAuth.
    const { SESSION_STRATEGY, OAUTH_STORES_PROVIDER_TOKENS } = await import('@/lib/auth-policy');
    expect(SESSION_STRATEGY).toBe('jwt');
    expect(OAUTH_STORES_PROVIDER_TOKENS).toBe(false);
  });

  it('enables account linking on verified emails (fails loudly if a refactor drops it)', async () => {
    const mod = await import('@/lib/oauth');
    expect(mod.OAUTH_ALLOW_LINKING).toBe(true);
  });
});
