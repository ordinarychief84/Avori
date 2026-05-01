'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/Dialog';

export default function RowDelete({
  endpoint,
  confirm = 'Delete this item?',
  redirectTo,
  label = 'Delete',
}: {
  endpoint: string;
  confirm?: string;
  redirectTo?: string;
  label?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);

  const onConfirm = async () => {
    setBusy(true);
    const res = await fetch(endpoint, { method: 'DELETE' });
    setBusy(false);
    if (!res.ok) {
      toast.error('Delete failed');
      return;
    }
    toast.success('Deleted');
    setOpen(false);
    if (redirectTo) router.push(redirectTo);
    else router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="danger" leftIcon={<Trash2 className="h-3.5 w-3.5" />}>
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent title="Delete confirmation" description={confirm}>
        <div className="mt-4 flex justify-end gap-2">
          <DialogClose asChild>
            <Button variant="secondary">Cancel</Button>
          </DialogClose>
          <Button variant="danger" loading={busy} onClick={onConfirm}>
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
