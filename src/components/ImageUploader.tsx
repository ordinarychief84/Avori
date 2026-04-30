'use client';

import { useState } from 'react';

export default function ImageUploader({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File) => {
    setError(null);
    setBusy(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('kind', 'image');
    const res = await fetch('/api/brand/upload', { method: 'POST', body: fd });
    setBusy(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? 'Upload failed');
      return;
    }
    const j = await res.json();
    onChange(j.url);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        {value ? (
          <img src={value} className="h-16 w-16 rounded object-cover" alt="" />
        ) : (
          <div className="h-16 w-16 rounded bg-zinc-100" />
        )}
        <label className="btn-secondary cursor-pointer">
          {busy ? 'Uploading…' : value ? 'Replace' : 'Upload'}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) upload(f);
            }}
          />
        </label>
      </div>
      <input
        className="input"
        placeholder="…or paste image URL"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
