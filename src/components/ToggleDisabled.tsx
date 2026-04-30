'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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
    <button
      className={disabled ? 'btn-secondary' : 'btn-danger'}
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        const res = await fetch(endpoint, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ disabled: !disabled }),
        });
        setBusy(false);
        if (!res.ok) {
          alert('Failed');
          return;
        }
        router.refresh();
      }}
    >
      {busy ? '…' : label}
    </button>
  );
}
