import { cn } from '@/lib/cn';

type LogoProps = {
  variant?: 'full' | 'mark';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const SIZE_MAP = {
  sm: { mark: 'h-5 w-5', text: 'text-[15px]', dot: 'h-[5px] w-[5px] -translate-y-[1px]' },
  md: { mark: 'h-6 w-6', text: 'text-lg', dot: 'h-[7px] w-[7px] -translate-y-[2px]' },
  lg: { mark: 'h-8 w-8', text: 'text-2xl', dot: 'h-[10px] w-[10px] -translate-y-[3px]' },
} as const;

export function Logo({ variant = 'full', size = 'md', className }: LogoProps) {
  const s = SIZE_MAP[size];
  return (
    <span className={cn('inline-flex items-center gap-2', className)} aria-label="Avori">
      <LogoMark className={cn(s.mark, 'text-fg')} />
      {variant === 'full' && (
        <span className={cn('font-bold tracking-tight text-fg leading-none', s.text)}>
          avor
          {/* Dotless ı (U+0131) so the natural tittle doesn't compete with the purple dot. */}
          <span className="relative inline-block">
            {'ı'}
            <span
              aria-hidden
              className={cn(
                'absolute left-1/2 top-0 -translate-x-1/2 rounded-full bg-accent',
                s.dot
              )}
            />
          </span>
        </span>
      )}
    </span>
  );
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Avori"
    >
      {/* Top-right arm: top edge → corner arc → short descent into the gap */}
      <path
        d="M14 4h36a10 10 0 0 1 10 10v8"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Bottom-right arm wrapping back around to the top-left */}
      <path
        d="M60 42v8a10 10 0 0 1-10 10H14a10 10 0 0 1-10-10V14a10 10 0 0 1 10-10"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Upper bar: bright purple parallelogram */}
      <path d="M16 26h36l4 6H20z" fill="#7C3AED" />
      {/* Lower bar: dark parallelogram, slight opacity so it reads off the frame */}
      <path d="M16 36h36l4 6H20z" fill="currentColor" opacity="0.9" />
    </svg>
  );
}
