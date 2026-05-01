import { redirect } from 'next/navigation';
import { auth, signOut } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import AuthSessionProvider from '@/components/SessionProvider';
import { AppShell } from '@/components/AppShell';

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
