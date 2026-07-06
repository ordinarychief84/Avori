import { pageBrandSession, signOut } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import AuthSessionProvider from '@/components/SessionProvider';
import { AppShell } from '@/components/AppShell';
import ModuleSetupGuide from '@/components/ModuleSetupGuide';

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
        <ModuleSetupGuide
          brandId={brandId}
          appUrl={process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}
        />
        {children}
      </AppShell>
    </AuthSessionProvider>
  );
}
