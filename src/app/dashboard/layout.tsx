import { redirect } from 'next/navigation';
import { LayoutDashboard, Package, Film, BarChart3, Code2 } from 'lucide-react';
import { auth, signOut } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import AuthSessionProvider from '@/components/SessionProvider';
import { AppShell, type NavItem } from '@/components/AppShell';

const NAV: NavItem[] = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/products', label: 'Products', icon: Package },
  { href: '/dashboard/videos', label: 'Videos', icon: Film },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/dashboard/embed', label: 'Embed', icon: Code2 },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role !== 'BRAND' || !session.user.brandId) {
    if (session.user.role === 'ADMIN') redirect('/admin');
    redirect('/login');
  }

  const brand = await prisma.brand.findUnique({
    where: { id: session.user.brandId },
    select: { name: true },
  });

  const handleSignOut = async () => {
    'use server';
    await signOut({ redirectTo: '/login' });
  };

  return (
    <AuthSessionProvider>
      <AppShell
        nav={NAV}
        brandName={brand?.name ?? 'Your brand'}
        email={session.user.email ?? ''}
        role="BRAND"
        signOutAction={handleSignOut}
      >
        {children}
      </AppShell>
    </AuthSessionProvider>
  );
}
