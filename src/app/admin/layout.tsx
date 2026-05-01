import { redirect } from 'next/navigation';
import { Building2, Film, Package, ShieldCheck } from 'lucide-react';
import { auth, signOut } from '@/lib/auth';
import AuthSessionProvider from '@/components/SessionProvider';
import { AppShell, type NavItem } from '@/components/AppShell';

const NAV: NavItem[] = [
  { href: '/admin', label: 'Brands', icon: Building2 },
  { href: '/admin/videos', label: 'Videos', icon: Film },
  { href: '/admin/products', label: 'Products', icon: Package },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role !== 'ADMIN') redirect('/dashboard');

  const handleSignOut = async () => {
    'use server';
    await signOut({ redirectTo: '/login' });
  };

  return (
    <AuthSessionProvider>
      <AppShell
        nav={NAV}
        brandName="Avori — Admin"
        email={session.user.email ?? ''}
        role="ADMIN"
        signOutAction={handleSignOut}
      >
        <div className="mb-4">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 text-2xs font-medium uppercase tracking-wide text-warning">
            <ShieldCheck className="h-3 w-3" /> Admin mode
          </span>
        </div>
        {children}
      </AppShell>
    </AuthSessionProvider>
  );
}
