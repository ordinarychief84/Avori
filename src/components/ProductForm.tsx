'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Input, Select, FormField } from '@/components/ui/Input';
import { Card, CardBody, CardFooter } from '@/components/ui/Card';
import ImageUploader from '@/components/ImageUploader';

type TryOnCategory = 'NONE' | 'LIPSTICK' | 'LIP_GLOSS' | 'BLUSH' | 'EYESHADOW' | 'EYELINER';

type ProductInput = {
  id?: string;
  name?: string;
  price?: number | string;
  imageUrl?: string;
  productUrl?: string;
  sku?: string | null;
  status?: 'ACTIVE' | 'INACTIVE';
  tryOnEnabled?: boolean;
  tryOnCategory?: TryOnCategory;
  tryOnTint?: string | null;
};

const TRYON_CATEGORIES: { value: TryOnCategory; label: string }[] = [
  { value: 'NONE', label: 'None' },
  { value: 'LIPSTICK', label: 'Lipstick' },
  { value: 'LIP_GLOSS', label: 'Lip gloss' },
  { value: 'BLUSH', label: 'Blush' },
  { value: 'EYESHADOW', label: 'Eyeshadow' },
  { value: 'EYELINER', label: 'Eyeliner' },
];

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
    tryOnEnabled: initial?.tryOnEnabled ?? false,
    tryOnCategory: (initial?.tryOnCategory ?? 'NONE') as TryOnCategory,
    tryOnTint: initial?.tryOnTint ?? '#C44569',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.imageUrl) {
      setError('Please add a product image.');
      return;
    }
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
        tryOnEnabled: form.tryOnEnabled,
        tryOnCategory: form.tryOnEnabled ? form.tryOnCategory : 'NONE',
        tryOnTint: form.tryOnEnabled ? form.tryOnTint : null,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? 'Save failed');
      toast.error('Save failed', { description: j.error });
      return;
    }
    toast.success(isEdit ? 'Product updated' : 'Product created');
    router.push('/dashboard/products');
    router.refresh();
  };

  return (
    <Card className="max-w-2xl">
      <form onSubmit={onSubmit}>
        <CardBody className="space-y-5">
          <FormField label="Name" required>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              placeholder="Iced Latte Lip Balm"
            />
          </FormField>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Price (USD)" required>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                required
                placeholder="18.00"
              />
            </FormField>
            <FormField label="SKU" hint="Optional">
              <Input
                value={form.sku ?? ''}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                placeholder="AV-IL-001"
              />
            </FormField>
          </div>
          <FormField label="Product image" required error={error ?? undefined}>
            <ImageUploader
              value={form.imageUrl}
              onChange={(url) => setForm({ ...form, imageUrl: url })}
            />
          </FormField>
          <FormField
            label="Product URL"
            required
            hint="Where the CTA in the widget will send shoppers."
          >
            <Input
              type="url"
              value={form.productUrl}
              onChange={(e) => setForm({ ...form, productUrl: e.target.value })}
              required
              placeholder="https://shop.example.com/products/iced-latte"
            />
          </FormField>
          <FormField label="Status">
            <Select
              value={form.status}
              onChange={(e) =>
                setForm({ ...form, status: e.target.value as 'ACTIVE' | 'INACTIVE' })
              }
            >
              <option value="ACTIVE">Active — visible inside the widget</option>
              <option value="INACTIVE">Inactive — hidden</option>
            </Select>
          </FormField>

          {/* AI try-on */}
          <div className="rounded-lg border border-border bg-bg/40 p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.tryOnEnabled}
                onChange={(e) => setForm({ ...form, tryOnEnabled: e.target.checked })}
                className="mt-1 h-4 w-4 cursor-pointer accent-accent"
              />
              <span className="flex-1">
                <span className="inline-flex items-center gap-2 text-sm font-medium text-fg">
                  <Sparkles className="h-3.5 w-3.5 text-accent" />
                  Enable AI Try-on
                </span>
                <span className="mt-1 block text-xs text-fg-muted">
                  Adds a "Try on" button to this product's card in the widget. Shoppers see
                  themselves wearing it via their webcam.
                </span>
              </span>
            </label>

            {form.tryOnEnabled && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <FormField label="Category">
                  <Select
                    value={form.tryOnCategory}
                    onChange={(e) =>
                      setForm({ ...form, tryOnCategory: e.target.value as TryOnCategory })
                    }
                  >
                    {TRYON_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </Select>
                </FormField>
                <FormField label="Tint" hint="Color applied to the chosen face region.">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.tryOnTint}
                      onChange={(e) => setForm({ ...form, tryOnTint: e.target.value })}
                      className="h-10 w-12 cursor-pointer rounded-md border border-border bg-surface"
                      aria-label="Tint color"
                    />
                    <Input
                      value={form.tryOnTint}
                      onChange={(e) => setForm({ ...form, tryOnTint: e.target.value })}
                      placeholder="#C44569"
                      className="font-mono text-xs"
                    />
                  </div>
                </FormField>
              </div>
            )}
          </div>
        </CardBody>
        <CardFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push('/dashboard/products')}
          >
            Cancel
          </Button>
          <Button type="submit" loading={busy}>
            {isEdit ? 'Save changes' : 'Create product'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
