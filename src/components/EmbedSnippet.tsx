'use client';

import { useState } from 'react';

const MODES = [
  { id: 'floating', label: 'Floating bubble', help: 'Bottom-right, click to open.' },
  { id: 'inline', label: 'Inline block', help: 'Fits inside any container.' },
  { id: 'feed', label: 'Vertical feed', help: 'Full-screen TikTok-style stack.' },
] as const;

export default function EmbedSnippet({ brandId }: { brandId: string }) {
  const [mode, setMode] = useState<(typeof MODES)[number]['id']>('floating');
  const [copied, setCopied] = useState(false);
  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  const snippet = [
    `<script src="${origin}/widget.js" async></script>`,
    `<div`,
    `  class="shop-video-widget"`,
    `  data-brand-id="${brandId}"`,
    `  data-api="${origin}"`,
    `  data-mode="${mode}">`,
    `</div>`,
  ].join('\n');

  const copy = async () => {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="card p-6">
      <div className="grid gap-3 sm:grid-cols-3">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={
              'rounded-md border p-4 text-left transition ' +
              (mode === m.id
                ? 'border-brand-500 bg-brand-50'
                : 'border-zinc-200 hover:border-zinc-300')
            }
          >
            <div className="font-medium">{m.label}</div>
            <div className="mt-1 text-xs text-zinc-500">{m.help}</div>
          </button>
        ))}
      </div>

      <pre className="mt-6 overflow-auto rounded-md bg-zinc-900 p-4 text-xs leading-relaxed text-zinc-100">
        {snippet}
      </pre>

      <button onClick={copy} className="btn-primary mt-4">
        {copied ? 'Copied!' : 'Copy embed code'}
      </button>
    </div>
  );
}
