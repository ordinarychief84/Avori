'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ImageUploader from './ImageUploader';

type ProductInput = {
  id?: string;
  name?: string;
  price?: number | string;
  imageUrl?: string;
  productUrl?: string;
  sku?: string | null;
  status?: 'ACTIVE' | 'INACTIVE';
};

export default function ProductForm({ initial }: { initial?: ProductInput }) {
  const router = useRouter();
  const isEdit = !!initial?.id;
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    price: String(initial?.price ?? ''),
    imageUrl: initial?.imageUrl ?? '',
    productUrl: initial?.productUrl ?? '',
    sku: initial?.sku ?? '',
    status: (initial?.status ?? 'ACTIVE') as 'ACTIVE' | 'INACTIVE',
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const url = isEdit ? `/api/brand/products/${initial!.id}` : '/api/brand/products';
    const res = await fetch(url, {
      method: isEdit ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        price: Number(form.price),
        imageUrl: form.imageUrl,
        productUrl: form.productUrl,
        sku: form.sku || undefined,
        status: form.status,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? 'Save failed');
      return;
    }
    router.push('/dashboard/products');
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="card max-w-2xl space-y-5 p-6">
      <Field label="Name">
        <input
          className="input"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Price (USD)">
          <input
            className="input"
            type="number"
            step="0.01"
            min="0"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            required
          />
        </Field>
        <Field label="SKU (optional)">
          <input
            className="input"
            value={form.sku ?? ''}
            onChange={(e) => setForm({ ...form, sku: e.target.value })}
          />
        </Field>
      </div>
      <Field label="Product image">
        <ImageUploader
          value={form.imageUrl}
          onChange={(url) => setForm({ ...form, imageUrl: url })}
        />
      </Field>
      <Field label="Product URL">
        <input
          className="input"
          type="url"
          placeholder="https://shop.example.com/products/iced-latte"
          value={form.productUrl}
          onChange={(e) => setForm({ ...form, productUrl: e.target.value })}
          required
        />
      </Field>
      <Field label="Status">
        <select
          className="input"
          value={form.status}
          onChange={(e) =>
            setForm({ ...form, status: e.target.value as 'ACTIVE' | 'INACTIVE' })
          }
        >
          <option value="ACTIVE">Active (visible in widget)</option>
          <option value="INACTIVE">Inactive (hidden)</option>
        </select>
      </Field>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-3">
        <button className="btn-primary" type="submit" disabled={busy}>
          {busy ? 'Saving…' : isEdit ? 'Save changes' : 'Create product'}
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => router.push('/dashboard/products')}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
