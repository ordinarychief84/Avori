'use client';

import { useEffect, useState } from 'react';
import { getProviders, signIn } from 'next-auth/react';

// Renders "Continue with Google/GitHub" for whichever providers are configured
// on this deploy. getProviders() hits Auth.js's own /api/auth/providers, which
// exposes only provider names (never secrets), so nothing sensitive reaches the
// client. Renders nothing when no social provider is set up.
export default function OAuthButtons({ mode = 'login' }: { mode?: 'login' | 'signup' }) {
  const [providers, setProviders] = useState<string[] | null>(null);

  useEffect(() => {
    let alive = true;
    getProviders()
      .then((p) => {
        if (!alive) return;
        setProviders(p ? Object.keys(p).filter((k) => k === 'google' || k === 'github') : []);
      })
      .catch(() => alive && setProviders([]));
    return () => {
      alive = false;
    };
  }, []);

  if (!providers || providers.length === 0) return null;

  const verb = mode === 'signup' ? 'Sign up' : 'Continue';

  return (
    <div className="space-y-2.5">
      {providers.includes('google') && (
        <button
          type="button"
          onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
          className="flex w-full items-center justify-center gap-2.5 rounded-md border border-border bg-surface px-4 py-2.5 text-sm font-medium text-fg transition-colors hover:bg-surface-2"
        >
          <GoogleMark /> {verb} with Google
        </button>
      )}
      {providers.includes('github') && (
        <button
          type="button"
          onClick={() => signIn('github', { callbackUrl: '/dashboard' })}
          className="flex w-full items-center justify-center gap-2.5 rounded-md border border-border bg-surface px-4 py-2.5 text-sm font-medium text-fg transition-colors hover:bg-surface-2"
        >
          <GitHubMark /> {verb} with GitHub
        </button>
      )}
      <div className="flex items-center gap-3 py-1 text-2xs uppercase tracking-wider text-fg-subtle">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}

function GitHubMark() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 1a11 11 0 0 0-3.48 21.44c.55.1.75-.24.75-.53v-1.86c-3.06.67-3.71-1.47-3.71-1.47-.5-1.28-1.22-1.62-1.22-1.62-1-.68.08-.67.08-.67 1.1.08 1.68 1.13 1.68 1.13.98 1.68 2.57 1.2 3.2.92.1-.71.38-1.2.7-1.47-2.44-.28-5.01-1.22-5.01-5.43 0-1.2.43-2.18 1.13-2.95-.11-.28-.49-1.4.11-2.91 0 0 .92-.3 3.02 1.13a10.5 10.5 0 0 1 5.5 0c2.1-1.43 3.02-1.13 3.02-1.13.6 1.51.22 2.63.11 2.91.7.77 1.13 1.75 1.13 2.95 0 4.22-2.58 5.15-5.03 5.42.4.34.75 1.01.75 2.04v3.03c0 .29.2.64.76.53A11 11 0 0 0 12 1Z" />
    </svg>
  );
}
