'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DeleteButton({
  endpoint,
  label = 'Delete',
  confirm = 'Delete this item?',
  redirectTo,
}: {
  endpoint: string;
  label?: string;
  confirm?: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <button
      className="btn-danger"
      disabled={busy}
      onClick={async () => {
        if (!window.confirm(confirm)) return;
        setBusy(true);
        const res = await fetch(endpoint, { method: 'DELETE' });
        setBusy(false);
        if (!res.ok) {
          alert('Delete failed');
          return;
        }
        if (redirectTo) router.push(redirectTo);
        else router.refresh();
      }}
    >
      {busy ? '…' : label}
    </button>
  );
}
