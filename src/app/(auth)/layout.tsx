import Link from 'next/link';
import { Logo } from '@/components/Logo';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col px-6 py-8 sm:px-12 lg:px-16">
        <Link href="/" aria-label="Avori home">
          <Logo size="md" />
        </Link>
        <div className="flex flex-1 items-center">
          <div className="mx-auto w-full max-w-sm">{children}</div>
        </div>
        <p className="text-xs text-fg-subtle">
          © {new Date().getFullYear()} Avori. All rights reserved.
        </p>
      </div>
      <div className="hidden lg:block relative overflow-hidden border-l border-border/60 bg-surface/40">
        <div className="absolute inset-0 grid-radial opacity-50" />
        <div className="relative flex h-full items-center justify-center p-12">
          <div className="max-w-md text-center">
            <div className="mx-auto h-12 w-12 rounded-md bg-accent shadow-glow" />
            <h2 className="mt-8 text-balance text-3xl font-semibold leading-tight">
              Turn every video into a checkout.
            </h2>
            <p className="mt-4 text-fg-muted">
              Avori brands tag products inside vertical videos and embed them anywhere — inline,
              floating, or full-screen feed.
            </p>
            <div className="mt-10 grid grid-cols-3 gap-2 text-left">
              {['Tagging editor', 'Embed widget', 'Live analytics'].map((label) => (
                <div
                  key={label}
                  className="rounded-md border border-border bg-bg/60 p-3 text-xs text-fg-muted"
                >
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
