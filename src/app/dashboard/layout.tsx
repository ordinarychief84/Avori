import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth, signOut } from '@/lib/auth';
import AuthSessionProvider from '@/components/SessionProvider';

const nav = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/dashboard/products', label: 'Products' },
  { href: '/dashboard/videos', label: 'Videos' },
  { href: '/dashboard/analytics', label: 'Analytics' },
  { href: '/dashboard/embed', label: 'Embed' },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role !== 'BRAND' || !session.user.brandId) {
    if (session.user.role === 'ADMIN') redirect('/admin');
    redirect('/login');
  }

  return (
    <AuthSessionProvider>
      <div className="min-h-screen">
        <header className="border-b border-zinc-200 bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
            <Link href="/dashboard" className="text-lg font-bold tracking-tight">
              Avori
            </Link>
            <nav className="hidden gap-5 md:flex">
              {nav.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className="text-sm text-zinc-600 hover:text-zinc-900"
                >
                  {n.label}
                </Link>
              ))}
            </nav>
            <form
              action={async () => {
                'use server';
                await signOut({ redirectTo: '/login' });
              }}
            >
              <button className="text-sm text-zinc-600 hover:text-zinc-900" type="submit">
                Sign out
              </button>
            </form>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
      </div>
    </AuthSessionProvider>
  );
}
