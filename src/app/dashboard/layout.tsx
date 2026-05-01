import { pageBrandSession, signOut } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import AuthSessionProvider from '@/components/SessionProvider';
import { AppShell } from '@/components/AppShell';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { brandId, email } = await pageBrandSession();

  const brand = await prisma.brand.findUnique({
    where: { id: brandId },
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
        email={email}
        role="BRAND"
        signOutAction={handleSignOut}
      >
        {children}
      </AppShell>
    </AuthSessionProvider>
  );
}
