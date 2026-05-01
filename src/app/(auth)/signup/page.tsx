'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Input, FormField } from '@/components/ui/Input';

type Step = 'account' | 'brand';

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('account');
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    brandName: '',
    domain: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onAccountNext = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setStep('brand');
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? 'Signup failed');
      toast.error("Couldn't create your account", { description: j.error });
      setLoading(false);
      return;
    }
    const signInRes = await signIn('credentials', {
      email: form.email,
      password: form.password,
      redirect: false,
    });
    setLoading(false);
    if (signInRes?.error) {
      setError('Account created but sign-in failed. Please log in manually.');
      toast.error('Sign-in failed', {
        description: 'Your account was created — log in to continue.',
      });
      router.push(`/login?email=${encodeURIComponent(form.email)}`);
      return;
    }
    toast.success('Welcome to Avori');
    router.push('/dashboard?onboarding=1');
    router.refresh();
  };

  return (
    <div>
      <div className="flex items-center gap-2 text-2xs uppercase tracking-[0.2em] text-fg-subtle">
        Step {step === 'account' ? '1' : '2'} of 2
      </div>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        {step === 'account' ? 'Create your account' : 'Set up your brand'}
      </h1>
      <p className="mt-1 text-sm text-fg-muted">
        {step === 'account'
          ? 'You can change everything later.'
          : 'This is the brand profile your widget will display.'}
      </p>

      {step === 'account' && (
        <form onSubmit={onAccountNext} className="mt-8 space-y-4">
          <FormField label="Your name">
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              autoComplete="name"
            />
          </FormField>
          <FormField label="Email" required>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              autoComplete="email"
              required
            />
          </FormField>
          <FormField
            label="Password"
            required
            hint="At least 8 characters."
            error={error ?? undefined}
          >
            <Input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </FormField>
          <Button type="submit" className="w-full">
            Continue
          </Button>
        </form>
      )}

      {step === 'brand' && (
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <FormField label="Brand name" required>
            <Input
              value={form.brandName}
              onChange={(e) => setForm({ ...form, brandName: e.target.value })}
              required
            />
          </FormField>
          <FormField label="Website domain" hint="Optional. We'll match analytics installs to this.">
            <Input
              value={form.domain}
              onChange={(e) => setForm({ ...form, domain: e.target.value })}
              placeholder="shop.example.com"
            />
          </FormField>
          {error && <p className="text-xs text-danger">{error}</p>}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setStep('account')}>
              Back
            </Button>
            <Button type="submit" className="flex-1" loading={loading}>
              Create brand
            </Button>
          </div>
        </form>
      )}

      <p className="mt-6 text-sm text-fg-muted">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-accent hover:text-accent-hover">
          Log in
        </Link>
      </p>
    </div>
  );
}
