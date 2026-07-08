// Auth posture shared by the edge-safe config and by unit tests. Zero runtime
// deps on purpose, so importing it never pulls NextAuth/Prisma into a test env.
//
// Login-only social auth: sessions are stateless JWTs (Auth.js rotates them),
// and we store NO provider access/refresh tokens. "Token refresh" is therefore
// JWT rotation owned by Auth.js, not custom provider-token refresh.
export const SESSION_STRATEGY = 'jwt' as const;

// Link an OAuth sign-in to an existing account on a matching VERIFIED email.
// Safe because Google/GitHub verify primary emails; see src/lib/oauth.ts.
export const OAUTH_ALLOW_LINKING = true;

// We do not persist provider OAuth tokens (login only).
export const OAUTH_STORES_PROVIDER_TOKENS = false;
