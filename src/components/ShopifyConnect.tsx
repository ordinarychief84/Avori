'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

// Two ways in: platform OAuth (when the deploy has a Shopify Partner app
// configured) and a merchant custom-app token, which works on any deploy.
export default function ShopifyConnect({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [domain, setDomain] = useState('');
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [showToken, setShowToken] = useState(!configured);

  const startOAuth = async () => {
    if (!domain.trim()) return;
    setBusy(true);
    const res = await fetch('/api/integrations/shopify/install', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shopDomain: domain.trim() }),
    });
    setBusy(false);
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      toast.error(data?.error ?? 'Could not start the Shopify install');
      return;
    }
    window.location.href = data.url;
  };

  const connectToken = async () => {
    if (!domain.trim() || !token.trim()) {
      toast.error('Enter your store domain and the Admin API access token');
      return;
    }
    setBusy(true);
    const res = await fetch('/api/integrations/shopify/connect-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shopDomain: domain.trim(), accessToken: token.trim() }),
    });
    setBusy(false);
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      toast.error(data?.error ?? 'Connection failed');
      return;
    }
    toast.success('Shopify connected, the first sync is running');
    setToken('');
    router.refresh();
  };

  return (
    <div className="w-full max-w-xl space-y-3">
      {configured && (
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void startOAuth();
          }}
        >
          <Input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="your-store.myshopify.com"
            className="max-w-xs"
          />
          <Button type="submit" loading={busy}>
            Connect Shopify
          </Button>
          <button
            type="button"
            onClick={() => setShowToken((v) => !v)}
            className="text-xs font-semibold text-accent hover:text-accent-hover"
          >
            {showToken ? 'Hide token option' : 'Or connect with an access token'}
          </button>
        </form>
      )}

      {showToken && (
        <form
          className="space-y-2 rounded-lg border border-border bg-surface-2/40 p-4"
          onSubmit={(e) => {
            e.preventDefault();
            void connectToken();
          }}
        >
          <div className="text-sm font-semibold text-fg">Connect with an Admin API token</div>
          <ol className="list-decimal space-y-1 pl-4 text-xs leading-relaxed text-fg-muted">
            <li>
              In Shopify admin open{' '}
              <span className="font-medium text-fg">
                Settings → Apps and sales channels → Develop apps
              </span>
              , then <span className="font-medium text-fg">Create an app</span> (name it Avori).
            </li>
            <li>
              Under <span className="font-medium text-fg">Configuration → Admin API integration</span>{' '}
              grant read access to Products, Customers and Orders, then save.
            </li>
            <li>
              Press <span className="font-medium text-fg">Install app</span> and copy the{' '}
              <span className="font-medium text-fg">Admin API access token</span> (starts with
              shpat_, shown once).
            </li>
          </ol>
          <div className="flex flex-col gap-2 pt-1 sm:flex-row">
            <Input
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="your-store.myshopify.com"
            />
            <Input
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="shpat_…"
              type="password"
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-2xs text-fg-subtle">
              Products, customers and orders sync now and on schedule.
            </span>
            <Button type="submit" size="sm" loading={busy}>
              Connect
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
