'use client';

import { useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function ImageUploader({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const upload = async (file: File) => {
    setBusy(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('kind', 'image');
    const res = await fetch('/api/brand/upload', { method: 'POST', body: fd });
    setBusy(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      toast.error('Upload failed', { description: j.error });
      return;
    }
    const j = await res.json();
    onChange(j.url);
    toast.success('Image uploaded');
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        {value ? (
          <div className="relative">
            <img
              src={value}
              alt=""
              className="h-16 w-16 rounded-md object-cover ring-1 ring-border"
            />
            <button
              type="button"
              onClick={() => onChange('')}
              className="absolute -right-2 -top-2 grid h-5 w-5 place-items-center rounded-full border border-border bg-bg text-fg-muted hover:text-fg"
              aria-label="Remove image"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div className="grid h-16 w-16 place-items-center rounded-md border border-dashed border-border bg-surface text-fg-subtle">
            <Upload className="h-4 w-4" />
          </div>
        )}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          loading={busy}
          onClick={() => fileRef.current?.click()}
        >
          {value ? 'Replace' : 'Upload'}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f);
            e.target.value = '';
          }}
        />
      </div>
      <Input
        placeholder="…or paste image URL"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
