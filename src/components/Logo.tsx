import { cn } from '@/lib/cn';

type LogoProps = {
  variant?: 'full' | 'mark';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const SIZE_MAP = {
  sm: { mark: 'h-5 w-5', text: 'text-[15px]', dot: 'h-1 w-1 -translate-y-[3px]' },
  md: { mark: 'h-6 w-6', text: 'text-lg', dot: 'h-1.5 w-1.5 -translate-y-[5px]' },
  lg: { mark: 'h-8 w-8', text: 'text-2xl', dot: 'h-2 w-2 -translate-y-[7px]' },
} as const;

export function Logo({ variant = 'full', size = 'md', className }: LogoProps) {
  const s = SIZE_MAP[size];
  return (
    <span className={cn('inline-flex items-center gap-2', className)} aria-label="Avori">
      <LogoMark className={cn(s.mark, 'text-fg')} />
      {variant === 'full' && (
        <span className={cn('font-extrabold tracking-tight text-fg leading-none', s.text)}>
          avor
          <span className="relative inline-block">
            i
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
      <path
        d="M14 6h36a8 8 0 0 1 8 8v8"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M58 42v8a8 8 0 0 1-8 8H14a8 8 0 0 1-8-8V14a8 8 0 0 1 8-8"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M14 24h42l4 5H18z" fill="#7C3AED" />
      <path d="M14 34h42l4 5H18z" fill="currentColor" opacity="0.85" />
    </svg>
  );
}
