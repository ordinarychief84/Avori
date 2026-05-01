'use client';

import { useState } from 'react';
import { Copy, Check, Code2, Globe, Layers } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';

const MODES = [
  {
    id: 'floating',
    label: 'Floating bubble',
    icon: Globe,
    desc: 'Bottom-right, click to open. Sits over any page.',
  },
  {
    id: 'inline',
    label: 'Inline block',
    icon: Code2,
    desc: 'Drops into any container. 9:16 player.',
  },
  {
    id: 'feed',
    label: 'Vertical feed',
    icon: Layers,
    desc: 'Full-screen TikTok-style scroll, opened by trigger.',
  },
] as const;

const THEMES = ['auto', 'dark', 'light'] as const;

export default function EmbedSnippet({ brandId }: { brandId: string }) {
  const [mode, setMode] = useState<(typeof MODES)[number]['id']>('floating');
  const [theme, setTheme] = useState<(typeof THEMES)[number]>('auto');
  const [copied, setCopied] = useState(false);
  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  const snippet = [
    `<script src="${origin}/widget.js" async></script>`,
    `<div`,
    `  class="shop-video-widget"`,
    `  data-brand-id="${brandId}"`,
    `  data-api="${origin}"`,
    `  data-mode="${mode}"`,
    `  data-theme="${theme}">`,
    `</div>`,
  ].join('\n');

  const copy = async () => {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    toast.success('Embed code copied');
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-5">
      <div>
        <div className="mb-2 text-2xs uppercase tracking-[0.2em] text-fg-subtle">Mode</div>
        <div className="grid gap-3 sm:grid-cols-3">
          {MODES.map((m) => {
            const active = mode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={
                  'rounded-lg border p-4 text-left transition-all ' +
                  (active
                    ? 'border-accent bg-accent-subtle ring-1 ring-accent shadow-glow'
                    : 'border-border bg-surface hover:border-border-strong')
                }
              >
                <div className="flex items-center gap-2">
                  <m.icon className={'h-4 w-4 ' + (active ? 'text-accent' : 'text-fg-muted')} />
                  <span className="font-medium">{m.label}</span>
                </div>
                <p className="mt-2 text-xs text-fg-muted">{m.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="mb-2 text-2xs uppercase tracking-[0.2em] text-fg-subtle">Theme</div>
        <div className="inline-flex rounded-md border border-border bg-surface p-1">
          {THEMES.map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={
                'rounded px-3 py-1.5 text-xs font-medium capitalize transition ' +
                (theme === t ? 'bg-bg text-fg shadow-soft' : 'text-fg-muted hover:text-fg')
              }
            >
              {t}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-fg-subtle">
          Auto matches the host site. Light/Dark forces a fixed look.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        <div className="flex items-center justify-between border-b border-border px-4 py-2">
          <span className="font-mono text-2xs uppercase tracking-wide text-fg-subtle">
            paste into your site
          </span>
          <Button
            size="sm"
            variant={copied ? 'secondary' : 'primary'}
            leftIcon={copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            onClick={copy}
          >
            {copied ? 'Copied' : 'Copy code'}
          </Button>
        </div>
        <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-fg">
          {snippet}
        </pre>
      </div>
    </div>
  );
}
