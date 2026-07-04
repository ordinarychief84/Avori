'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Circle,
  Code2,
  Download,
  Plug,
  Rocket,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import CopyField from '@/components/CopyField';
import { cn } from '@/lib/cn';

type StepState = {
  profileComplete: boolean;
  hasProducts: boolean;
  hasIngestion: boolean; // connector connected OR api key created
  hasWidget: boolean; // widget seen on a real domain
  hasTeam: boolean;
};

type Platform = 'shopify' | 'woocommerce' | 'magento' | 'bigcommerce' | 'custom';

const PLATFORMS: Array<{ key: Platform; label: string }> = [
  { key: 'shopify', label: 'Shopify' },
  { key: 'woocommerce', label: 'WooCommerce' },
  { key: 'magento', label: 'Magento' },
  { key: 'bigcommerce', label: 'BigCommerce' },
  { key: 'custom', label: 'Custom site' },
];

function PlatformGuide({ platform }: { platform: Platform }) {
  const guides: Record<Platform, { copy: string; actions: Array<{ label: string; href: string; download?: boolean }> }> = {
    shopify: {
      copy: 'Enter your my-store.myshopify.com domain, approve read access, and the first sync of products, customers and orders runs automatically. New orders arrive by webhook in real time.',
      actions: [{ label: 'Connect Shopify', href: '/dashboard/settings#integrations' }],
    },
    woocommerce: {
      copy: 'Fastest path: install the Avori Connect WordPress plugin, paste your Brand ID and API key, done. It embeds the widget and pushes orders in real time. Prefer keys only? Use the connector with WooCommerce REST keys.',
      actions: [
        { label: 'Download WordPress plugin', href: '/downloads/avori-connect.zip', download: true },
        { label: 'Or connect with REST keys', href: '/dashboard/settings#integrations' },
      ],
    },
    magento: {
      copy: 'Magento and Adobe Commerce integrate through the REST API: an API key, one order webhook from your Magento instance, and the widget snippet in your theme footer.',
      actions: [
        { label: 'Read the Magento guide', href: '/help/connect-magento' },
        { label: 'Create an API key', href: '/dashboard/settings#apikeys' },
      ],
    },
    bigcommerce: {
      copy: 'BigCommerce integrates through the REST API: an API key, a Script Manager entry for the widget, and order forwarding from webhooks or your checkout.',
      actions: [
        { label: 'Read the BigCommerce guide', href: '/help/connect-bigcommerce' },
        { label: 'Create an API key', href: '/dashboard/settings#apikeys' },
      ],
    },
    custom: {
      copy: 'Any stack that can run one script tag or send one HTTP request works. Create an API key, POST /api/v1/orders from your backend, and drop the widget or SDK on your site.',
      actions: [
        { label: 'Create an API key', href: '/dashboard/settings#apikeys' },
        { label: 'Open the docs', href: '/docs' },
      ],
    },
  };
  const g = guides[platform];
  return (
    <div className="mt-3 rounded-lg border border-border bg-surface-2/40 p-4">
      <p className="text-sm leading-relaxed text-fg-muted">{g.copy}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {g.actions.map((a, i) =>
          a.download ? (
            <a key={a.label} href={a.href} download>
              <Button size="sm" variant={i === 0 ? 'primary' : 'secondary'} leftIcon={<Download className="h-3.5 w-3.5" />}>
                {a.label}
              </Button>
            </a>
          ) : (
            <Link key={a.label} href={a.href}>
              <Button size="sm" variant={i === 0 ? 'primary' : 'secondary'}>
                {a.label}
              </Button>
            </Link>
          )
        )}
      </div>
    </div>
  );
}

export default function OnboardingWizard({
  state,
  brandId,
  appUrl,
}: {
  state: StepState;
  brandId: string;
  appUrl: string;
}) {
  const router = useRouter();
  const [finishing, setFinishing] = useState(false);
  const [platform, setPlatform] = useState<Platform>('shopify');

  const snippet = `<script src="${appUrl}/widget.js" async></script>\n<div class="shop-video-widget" data-brand-id="${brandId}" data-mode="floating"></div>`;

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

  const Step = ({
    index,
    done,
    icon: Icon,
    title,
    copy,
    children,
    actions,
  }: {
    index: number;
    done: boolean;
    icon: React.ElementType;
    title: string;
    copy: string;
    children?: React.ReactNode;
    actions?: React.ReactNode;
  }) => (
    <Card className={done ? 'border-success/30' : undefined}>
      <CardBody>
        <div className="flex flex-wrap items-start gap-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-subtle">
            <Icon className="h-5 w-5 text-accent" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-2xs font-bold text-fg-subtle">STEP {index}</span>
              {done ? (
                <span className="flex items-center gap-1 text-2xs font-semibold text-success">
                  <CheckCircle2 className="h-3.5 w-3.5" /> done
                </span>
              ) : (
                <Circle className="h-3 w-3 text-fg-subtle" />
              )}
            </div>
            <h3 className="mt-0.5 font-semibold text-fg">{title}</h3>
            <p className="mt-0.5 text-sm text-fg-muted">{copy}</p>
            {children}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
      </CardBody>
    </Card>
  );

  return (
    <div className="space-y-4">
      <Step
        index={1}
        done={state.profileComplete}
        icon={Building2}
        title="Complete your workspace profile"
        copy="Store name, primary domain and currency appear on widgets, hosted pages and receipts."
        actions={
          <Link href="/dashboard/settings">
            <Button variant={state.profileComplete ? 'secondary' : 'primary'} size="sm">
              Open settings
            </Button>
          </Link>
        }
      />

      <Step
        index={2}
        done={state.hasProducts && state.hasIngestion}
        icon={Plug}
        title="Connect your store"
        copy="Pick your platform. Connectors sync your catalog and stream orders automatically; everything else takes one API key."
      >
        <div className="mt-3 flex flex-wrap gap-1.5">
          {PLATFORMS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setPlatform(p.key)}
              className={cn(
                'rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
                platform === p.key
                  ? 'border-accent bg-accent text-white shadow-glow'
                  : 'border-border bg-surface text-fg-muted hover:border-accent/40 hover:text-fg'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
        <PlatformGuide platform={platform} />
      </Step>

      <Step
        index={3}
        done={state.hasWidget}
        icon={Code2}
        title="Put Avori on your storefront"
        copy="One line of code renders the shoppable widget. Shopify and the WordPress plugin inject it for you; on any other site, paste this before </body>."
      >
        <div className="mt-3 space-y-2">
          <CopyField value={snippet} className="max-w-full whitespace-pre-wrap text-left" />
          <p className="text-2xs text-fg-subtle">
            Prefer building your own UI? Load {appUrl}/sdk.js and call Avori.init, Avori.reviews,
            Avori.openQuiz or Avori.openShadeAnalyzer. Full reference in the docs.
          </p>
        </div>
      </Step>

      <Step
        index={4}
        done={false}
        icon={Rocket}
        title="Launch your first module"
        copy="Reviews is the fastest win. The shade analyzer and quizzes come with hosted pages you can share immediately."
        actions={
          <>
            <Link href="/dashboard/reviews">
              <Button variant="primary" size="sm">
                Reviews
              </Button>
            </Link>
            <Link href="/dashboard/shade">
              <Button variant="ghost" size="sm">
                Shade Studio
              </Button>
            </Link>
          </>
        }
      />

      <Step
        index={5}
        done={state.hasTeam}
        icon={Users}
        title="Invite your team (optional)"
        copy="Managers run modules; Staff moderate reviews and Q&A."
        actions={
          <Link href="/dashboard/settings">
            <Button variant={state.hasTeam ? 'secondary' : 'primary'} size="sm">
              Invite teammates
            </Button>
          </Link>
        }
      />

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
