import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth, signOut } from '@/lib/auth';
import AuthSessionProvider from '@/components/SessionProvider';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role !== 'ADMIN') redirect('/dashboard');

  return (
    <AuthSessionProvider>
      <div className="min-h-screen">
        <header className="border-b border-zinc-200 bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
            <Link href="/admin" className="text-lg font-bold tracking-tight">
              Avori <span className="text-zinc-400">/ admin</span>
            </Link>
            <nav className="hidden gap-5 md:flex">
              <Link href="/admin" className="text-sm text-zinc-600 hover:text-zinc-900">
                Brands
              </Link>
              <Link href="/admin/videos" className="text-sm text-zinc-600 hover:text-zinc-900">
                Videos
              </Link>
              <Link href="/admin/products" className="text-sm text-zinc-600 hover:text-zinc-900">
                Products
              </Link>
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
