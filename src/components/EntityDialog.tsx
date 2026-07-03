'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogTrigger, DialogClose } from '@/components/ui/Dialog';
import { Input, Textarea, Select, FormField } from '@/components/ui/Input';

// Schema-driven create/edit dialog used by every module manager. Field specs
// are serializable so server components can define forms inline.
export type FieldSpec = {
  name: string;
  label: string;
  type: 'text' | 'number' | 'textarea' | 'select' | 'toggle' | 'date' | 'tags' | 'multiselect';
  options?: { value: string; label: string }[];
  placeholder?: string;
  hint?: string;
  required?: boolean;
  step?: string;
  min?: number;
  max?: number;
};

function coerce(field: FieldSpec, value: unknown): unknown {
  if (field.type === 'number') {
    if (value === '' || value === undefined || value === null) return undefined;
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
  }
  if (field.type === 'toggle') return !!value;
  if (field.type === 'tags') {
    const s = String(value ?? '').trim();
    return s ? s.split(',').map((t) => t.trim()).filter(Boolean) : [];
  }
  if (field.type === 'date') {
    const s = String(value ?? '').trim();
    return s ? new Date(s).toISOString() : undefined;
  }
  if (field.type === 'multiselect') return Array.isArray(value) ? value : [];
  return value;
}

export default function EntityDialog({
  title,
  description,
  endpoint,
  method = 'POST',
  fields,
  initial = {},
  triggerLabel,
  triggerVariant = 'primary',
  triggerSize = 'md',
  triggerIcon = 'plus',
  submitLabel = 'Save',
  wide = false,
}: {
  title: string;
  description?: string;
  endpoint: string;
  method?: 'POST' | 'PATCH';
  fields: FieldSpec[];
  initial?: Record<string, unknown>;
  triggerLabel: string;
  triggerVariant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  triggerSize?: 'sm' | 'md';
  triggerIcon?: 'plus' | 'pencil' | 'none';
  submitLabel?: string;
  wide?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [values, setValues] = useState<Record<string, unknown>>({});

  const valueOf = (f: FieldSpec) => {
    if (f.name in values) return values[f.name];
    const init = initial[f.name];
    if (f.type === 'tags' && Array.isArray(init)) return init.join(', ');
    if (f.type === 'date' && typeof init === 'string' && init) return init.slice(0, 10);
    return init ?? (f.type === 'multiselect' ? [] : f.type === 'toggle' ? false : '');
  };

  const submit = async () => {
    const payload: Record<string, unknown> = {};
    for (const f of fields) {
      const coerced = coerce(f, valueOf(f));
      if (coerced !== undefined) payload[f.name] = coerced;
    }
    setBusy(true);
    const res = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setBusy(false);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      toast.error(body?.error ?? 'Request failed');
      return;
    }
    toast.success('Saved');
    setOpen(false);
    setValues({});
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={triggerVariant}
          size={triggerSize}
          leftIcon={
            triggerIcon === 'plus' ? (
              <Plus className="h-4 w-4" />
            ) : triggerIcon === 'pencil' ? (
              <Pencil className="h-3.5 w-3.5" />
            ) : undefined
          }
        >
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent
        title={title}
        description={description}
        className={wide ? 'max-w-2xl max-h-[85vh] overflow-y-auto' : 'max-h-[85vh] overflow-y-auto'}
      >
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          {fields.map((f) => (
            <FormField key={f.name} label={f.label} hint={f.hint} required={f.required}>
              {f.type === 'textarea' ? (
                <Textarea
                  value={String(valueOf(f) ?? '')}
                  placeholder={f.placeholder}
                  onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                />
              ) : f.type === 'select' ? (
                <Select
                  value={String(valueOf(f) ?? '')}
                  onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                >
                  {(f.options ?? []).map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              ) : f.type === 'toggle' ? (
                <label className="flex h-10 cursor-pointer items-center gap-2 text-sm text-fg-muted">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[rgb(var(--accent))]"
                    checked={!!valueOf(f)}
                    onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.checked }))}
                  />
                  {f.placeholder ?? 'Enabled'}
                </label>
              ) : f.type === 'multiselect' ? (
                <div className="max-h-44 space-y-1 overflow-y-auto rounded-md border border-border bg-surface p-2">
                  {(f.options ?? []).length === 0 && (
                    <p className="px-1 py-2 text-xs text-fg-subtle">Nothing to select yet.</p>
                  )}
                  {(f.options ?? []).map((o) => {
                    const selected = (valueOf(f) as string[]).includes(o.value);
                    return (
                      <label
                        key={o.value}
                        className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-sm hover:bg-surface-2"
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-[rgb(var(--accent))]"
                          checked={selected}
                          onChange={(e) => {
                            const current = valueOf(f) as string[];
                            setValues((v) => ({
                              ...v,
                              [f.name]: e.target.checked
                                ? [...current, o.value]
                                : current.filter((x) => x !== o.value),
                            }));
                          }}
                        />
                        <span className="truncate">{o.label}</span>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <Input
                  type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
                  value={String(valueOf(f) ?? '')}
                  placeholder={f.placeholder}
                  step={f.step}
                  min={f.min}
                  max={f.max}
                  onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                />
              )}
            </FormField>
          ))}
          <div className="flex justify-end gap-2 pt-2">
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" loading={busy}>
              {submitLabel}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
