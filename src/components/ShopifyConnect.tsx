'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function ShopifyConnect({ configured }: { configured: boolean }) {
  const [domain, setDomain] = useState('');
  const [busy, setBusy] = useState(false);

  const connect = async () => {
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

  if (!configured) {
    return (
      <p className="text-sm text-fg-muted">
        Set <code className="font-mono text-xs">SHOPIFY_API_KEY</code> and{' '}
        <code className="font-mono text-xs">SHOPIFY_API_SECRET</code> in{' '}
        <code className="font-mono text-xs">.env</code> (from your Shopify Partner app) to enable
        one-click store connection. Until then, use the REST API with an API key.
      </p>
    );
  }

  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        void connect();
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
    </form>
  );
}
