'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight, Rocket } from 'lucide-react';
import CopyField from '@/components/CopyField';
import { moduleGuides } from '@/content/module-guides';

// Collapsible setup guide rendered above every module page. One mount point
// in the dashboard layout; the pathname picks the right content.
export default function ModuleSetupGuide({
  brandId,
  appUrl,
}: {
  brandId: string;
  appUrl: string;
}) {
  const pathname = usePathname();
  const segment = pathname?.split('/')[2] ?? '';
  const guide = moduleGuides[segment];
  if (!guide) return null;

  const snippet = guide.snippetMode
    ? `<script src="${appUrl}/widget.js" async></script>\n<div class="shop-video-widget" data-brand-id="${brandId}" data-mode="${guide.snippetMode}"></div>`
    : null;
  const hostedUrl = guide.hostedPath
    ? `${appUrl}${guide.hostedPath.replace('{brandId}', brandId)}`
    : null;

  return (
    <details className="group mb-6 rounded-xl border border-accent/25 bg-accent-subtle/40">
      <summary className="flex cursor-pointer list-none items-center gap-2.5 px-4 py-3 [&::-webkit-details-marker]:hidden">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-subtle">
          <Rocket className="h-3.5 w-3.5 text-accent" />
        </span>
        <span className="text-sm font-semibold text-fg">
          Set up {guide.name}
          <span className="ml-2 hidden font-normal text-fg-muted sm:inline">{guide.intro}</span>
        </span>
        <span className="ml-auto text-2xs font-semibold uppercase tracking-wide text-accent group-open:hidden">
          Show steps
        </span>
        <span className="ml-auto hidden text-2xs font-semibold uppercase tracking-wide text-fg-subtle group-open:inline">
          Hide
        </span>
      </summary>
      <div className="border-t border-accent/15 px-4 pb-4 pt-3">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {guide.steps.map((s, i) => (
            <div key={s.title} className="rounded-lg border border-border bg-surface p-3">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-2xs font-bold text-white">
                  {i + 1}
                </span>
                <span className="text-xs font-semibold text-fg">{s.title}</span>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-fg-muted">{s.copy}</p>
              {s.href && (
                <Link
                  href={s.href}
                  className="mt-1.5 inline-flex items-center gap-1 text-2xs font-semibold text-accent hover:text-accent-hover"
                >
                  {s.linkLabel ?? 'Open'} <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>
          ))}
        </div>
        {snippet && (
          <div className="mt-3">
            <div className="mb-1 text-2xs font-semibold uppercase tracking-wide text-fg-subtle">
              Your embed snippet
            </div>
            <CopyField value={snippet} className="max-w-full whitespace-pre-wrap text-left" />
          </div>
        )}
        {hostedUrl && (
          <div className="mt-3">
            <div className="mb-1 text-2xs font-semibold uppercase tracking-wide text-fg-subtle">
              Your hosted page
            </div>
            <CopyField value={hostedUrl} className="max-w-full text-left" />
          </div>
        )}
        {guide.apiNote && (
          <p className="mt-3 font-mono text-2xs text-fg-subtle">
            {guide.apiNote.replace('{brandId}', brandId)}
          </p>
        )}
      </div>
    </details>
  );
}
