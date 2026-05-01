'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';

export default function ToggleDisabled({
  endpoint,
  disabled,
  label,
}: {
  endpoint: string;
  disabled: boolean;
  label: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      size="sm"
      variant={disabled ? 'secondary' : 'danger'}
      loading={busy}
      onClick={async () => {
        setBusy(true);
        const res = await fetch(endpoint, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ disabled: !disabled }),
        });
        setBusy(false);
        if (!res.ok) {
          toast.error('Update failed');
          return;
        }
        toast.success(disabled ? 'Enabled' : 'Disabled');
        router.refresh();
      }}
    >
      {label}
    </Button>
  );
}
