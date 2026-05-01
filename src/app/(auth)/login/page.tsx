'use client';

import { Suspense, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Input, FormField } from '@/components/ui/Input';

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginSkeleton() {
  return (
    <div>
      <div className="h-7 w-40 skeleton rounded" />
      <div className="mt-2 h-4 w-56 skeleton rounded" />
      <div className="mt-8 space-y-4">
        <div className="h-16 skeleton rounded" />
        <div className="h-16 skeleton rounded" />
        <div className="h-10 skeleton rounded" />
      </div>
    </div>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn('credentials', { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError('Invalid email or password');
      toast.error("Couldn't sign you in", { description: 'Double-check your email and password.' });
      return;
    }
    toast.success('Welcome back');
    router.push(params.get('callbackUrl') || '/dashboard');
    router.refresh();
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
      <p className="mt-1 text-sm text-fg-muted">Log in to your Avori dashboard.</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <FormField label="Email" required>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </FormField>
        <FormField label="Password" required error={error ?? undefined}>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </FormField>
        <Button className="w-full" type="submit" loading={loading}>
          Log in
        </Button>
      </form>

      <p className="mt-6 text-sm text-fg-muted">
        New to Avori?{' '}
        <Link href="/signup" className="font-medium text-accent hover:text-accent-hover">
          Create an account
        </Link>
      </p>
    </div>
  );
}
