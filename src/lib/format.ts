// Shared display formatting for dashboard pages (server-safe).
// `value` accepts numbers, strings and Prisma Decimal (anything stringable).
export function fmtMoney(
  value: number | string | { toString(): string } | null | undefined,
  currency = 'USD'
): string {
  const n = Number(value ?? 0);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(n);
}

export function fmtNum(value: number | null | undefined): string {
  return new Intl.NumberFormat('en-US').format(value ?? 0);
}

export function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function fmtDateTime(d: Date | string | null | undefined): string {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function customerName(c: {
  firstName?: string | null;
  lastName?: string | null;
  email: string;
}): string {
  const name = [c.firstName, c.lastName].filter(Boolean).join(' ');
  return name || c.email;
}
