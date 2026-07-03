'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';

// One-click mutation button (approve, reject, sync, generate...). Sends a
// JSON body to an endpoint and refreshes the page on success.
export default function RowAction({
  endpoint,
  method = 'PATCH',
  body,
  label,
  variant = 'secondary',
  size = 'sm',
  successMessage = 'Done',
}: {
  endpoint: string;
  method?: 'PATCH' | 'POST' | 'DELETE';
  body?: Record<string, unknown>;
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md';
  successMessage?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true);
    const res = await fetch(endpoint, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      toast.error(data?.error ?? 'Request failed');
      return;
    }
    toast.success(successMessage);
    router.refresh();
  };

  return (
    <Button variant={variant} size={size} loading={busy} onClick={run}>
      {label}
    </Button>
  );
}
