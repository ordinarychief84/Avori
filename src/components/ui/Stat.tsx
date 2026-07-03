import { Card } from './Card';
import { cn } from '@/lib/cn';

export function Stat({
  label,
  value,
  sub,
  className,
}: {
  label: string;
  value: string | number;
  sub?: string;
  className?: string;
}) {
  return (
    <Card className={cn('px-5 py-4', className)}>
      <div className="text-2xs uppercase tracking-[0.15em] text-fg-subtle">{label}</div>
      <div className="mt-1.5 text-2xl font-semibold tracking-tight text-fg">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-fg-muted">{sub}</div>}
    </Card>
  );
}
