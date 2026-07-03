'use client';

import { useState } from 'react';
import { Send, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select, FormField } from '@/components/ui/Input';

export default function ContactForm() {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', topic: 'General question', message: '' });

  if (sent) {
    return (
      <div className="rounded-xl border border-success/40 bg-success/5 p-8 text-center">
        <CheckCircle2 className="mx-auto h-8 w-8 text-success" />
        <h3 className="mt-3 font-semibold text-fg">Message received</h3>
        <p className="mt-1 text-sm text-fg-muted">
          Thanks, {form.name.split(' ')[0] || 'friend'}, we’ll get back to you at {form.email}.
        </p>
      </div>
    );
  }

  return (
    <form
      className="space-y-4 rounded-xl border border-border bg-surface p-6 shadow-soft"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const res = await fetch('/api/public/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        setBusy(false);
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          toast.error(data?.error ?? 'Could not send, try again');
          return;
        }
        setSent(true);
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Name" required>
          <Input
            value={form.name}
            required
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Amara Okafor"
          />
        </FormField>
        <FormField label="Email" required>
          <Input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="you@brand.com"
          />
        </FormField>
      </div>
      <FormField label="Topic">
        <Select
          value={form.topic}
          onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
        >
          {['General question', 'Sales & pricing', 'Support', 'Partnerships', 'Press'].map((t) => (
            <option key={t}>{t}</option>
          ))}
        </Select>
      </FormField>
      <FormField label="Message" required>
        <Textarea
          required
          rows={5}
          value={form.message}
          onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
          placeholder="Tell us about your store and what you’re trying to grow…"
        />
      </FormField>
      <Button type="submit" loading={busy} leftIcon={<Send className="h-4 w-4" />}>
        Send message
      </Button>
    </form>
  );
}
