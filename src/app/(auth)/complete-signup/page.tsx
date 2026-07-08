'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';

// Post-OAuth consent screen. OAuth signups reach here (via the pageBrandSession
// gate) with no terms acceptance on file; the dashboard stays blocked until
// they accept. Credentials signups never see this (they accept up front).
export default function CompleteSignupPage() {
  const router = useRouter();
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);

  const finish = async () => {
    if (!accepted) {
      toast.error('Please agree to the Terms and Privacy Policy to continue.');
      return;
    }
    setBusy(true);
    const res = await fetch('/api/auth/accept-terms', { method: 'POST' });
    setBusy(false);
    if (!res.ok) {
      toast.error('Could not save, try again');
      return;
    }
    router.push('/dashboard');
    router.refresh();
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">One last step</h1>
      <p className="mt-1 text-sm text-fg-muted">
        You signed in with a social account. Review and accept our terms to finish setting up your
        workspace.
      </p>

      <label className="mt-8 flex items-start gap-2.5 rounded-lg border border-border bg-surface-2/40 p-3 text-sm text-fg-muted">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-[rgb(var(--accent))]"
        />
        <span>
          I agree to the{' '}
          <Link href="/terms" target="_blank" className="font-medium text-accent hover:text-accent-hover">
            Terms of Service
          </Link>{' '}
          and the{' '}
          <Link href="/privacy" target="_blank" className="font-medium text-accent hover:text-accent-hover">
            Privacy Policy
          </Link>
          , and I consent to Avori processing my account data as described there.
        </span>
      </label>

      <Button onClick={finish} loading={busy} className="mt-4 w-full">
        Finish and go to dashboard
      </Button>
    </div>
  );
}
