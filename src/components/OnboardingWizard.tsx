'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Circle,
  KeyRound,
  Package,
  Rocket,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';

type StepState = {
  profileComplete: boolean;
  hasProducts: boolean;
  hasIngestion: boolean; // connector connected OR api key created
  hasTeam: boolean;
};

export default function OnboardingWizard({ state }: { state: StepState }) {
  const router = useRouter();
  const [finishing, setFinishing] = useState(false);

  const steps = [
    {
      icon: Building2,
      done: state.profileComplete,
      title: 'Complete your workspace profile',
      copy: 'Set your store name, primary domain and currency, they appear on widgets and receipts.',
      action: { label: 'Open settings', href: '/dashboard/settings' },
    },
    {
      icon: Package,
      done: state.hasProducts,
      title: 'Add your catalog',
      copy: 'Connect Shopify or WooCommerce for an automatic sync, or add products by hand.',
      action: { label: 'Connect a store', href: '/dashboard/settings' },
      secondary: { label: 'Add manually', href: '/dashboard/products/new' },
    },
    {
      icon: KeyRound,
      done: state.hasIngestion,
      title: 'Get orders flowing',
      copy: 'Connectors stream orders automatically. On a custom stack, create an API key and POST /api/v1/orders.',
      action: { label: 'API & webhooks', href: '/dashboard/settings' },
      secondary: { label: 'Read the docs', href: '/docs' },
    },
    {
      icon: Rocket,
      done: false,
      title: 'Launch your first module',
      copy: 'Reviews is the fastest win, or start with the shade analyzer, a quiz or loyalty.',
      action: { label: 'Reviews', href: '/dashboard/reviews' },
      secondary: { label: 'Shade Studio', href: '/dashboard/shade' },
    },
    {
      icon: Users,
      done: state.hasTeam,
      title: 'Invite your team (optional)',
      copy: 'Managers run modules; Staff moderate reviews and Q&A.',
      action: { label: 'Invite teammates', href: '/dashboard/settings' },
    },
  ];

  const finish = async () => {
    setFinishing(true);
    const res = await fetch('/api/brand/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ onboarded: true }),
    });
    setFinishing(false);
    if (!res.ok) {
      toast.error('Could not save, try again');
      return;
    }
    toast.success('You’re all set');
    router.push('/dashboard');
    router.refresh();
  };

  return (
    <div className="space-y-4">
      {steps.map((s, i) => (
        <Card key={s.title} className={s.done ? 'border-success/30' : undefined}>
          <CardBody className="flex flex-wrap items-center gap-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-subtle">
              <s.icon className="h-5 w-5 text-accent" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-2xs font-bold text-fg-subtle">STEP {i + 1}</span>
                {s.done ? (
                  <span className="flex items-center gap-1 text-2xs font-semibold text-success">
                    <CheckCircle2 className="h-3.5 w-3.5" /> done
                  </span>
                ) : (
                  <Circle className="h-3 w-3 text-fg-subtle" />
                )}
              </div>
              <h3 className="mt-0.5 font-semibold text-fg">{s.title}</h3>
              <p className="mt-0.5 text-sm text-fg-muted">{s.copy}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {s.secondary && (
                <Link href={s.secondary.href}>
                  <Button variant="ghost" size="sm">
                    {s.secondary.label}
                  </Button>
                </Link>
              )}
              <Link href={s.action.href}>
                <Button variant={s.done ? 'secondary' : 'primary'} size="sm">
                  {s.action.label}
                </Button>
              </Link>
            </div>
          </CardBody>
        </Card>
      ))}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface-2/40 p-5">
        <p className="text-sm text-fg-muted">
          Explore at your own pace, you can finish this checklist anytime.
        </p>
        <div className="flex items-center gap-2">
          <Link href="/dashboard">
            <Button variant="ghost">Skip for now</Button>
          </Link>
          <Button onClick={finish} loading={finishing} rightIcon={<ArrowRight className="h-4 w-4" />}>
            Finish setup
          </Button>
        </div>
      </div>
    </div>
  );
}
