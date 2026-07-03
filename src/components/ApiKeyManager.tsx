'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogTrigger, DialogClose } from '@/components/ui/Dialog';
import { Input, FormField } from '@/components/ui/Input';
import CopyField from '@/components/CopyField';

// API key creation with the show-once reveal flow: the plaintext key exists
// only in this dialog, the server stores a hash.
export default function ApiKeyManager() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  const create = async () => {
    if (!name.trim()) return;
    setBusy(true);
    const res = await fetch('/api/brand/apikeys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim() }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      toast.error(data?.error ?? 'Failed to create key');
      return;
    }
    const data = await res.json();
    setCreatedKey(data.key);
    router.refresh();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) {
          setCreatedKey(null);
          setName('');
        }
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary" leftIcon={<Plus className="h-3.5 w-3.5" />}>
          Create API key
        </Button>
      </DialogTrigger>
      <DialogContent title={createdKey ? 'Save your API key' : 'Create API key'}>
        {createdKey ? (
          <div className="space-y-4">
            <p className="text-sm text-fg-muted">
              This is the only time the full key is shown. Store it somewhere safe, requests send it
              as <code className="font-mono text-xs">Authorization: Bearer &lt;key&gt;</code>.
            </p>
            <div className="flex items-center gap-2 rounded-md border border-accent/30 bg-accent-subtle/50 p-3">
              <KeyRound className="h-4 w-4 shrink-0 text-accent" />
              <CopyField value={createdKey} className="max-w-full" />
            </div>
            <div className="flex justify-end">
              <DialogClose asChild>
                <Button>Done</Button>
              </DialogClose>
            </div>
          </div>
        ) : (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void create();
            }}
          >
            <FormField label="Key name" required hint="e.g. Production storefront, Staging">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Production storefront" />
            </FormField>
            <div className="flex justify-end gap-2">
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" loading={busy}>
                Create key
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
