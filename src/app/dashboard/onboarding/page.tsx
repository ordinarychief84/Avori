import { pageBrandSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/AppShell';
import OnboardingWizard from '@/components/OnboardingWizard';

export default async function OnboardingPage() {
  const { brandId } = await pageBrandSession();

  const [brand, productCount, apiKeyCount, connectorCount, widgetInstalls, teamCount] =
    await Promise.all([
      prisma.brand.findUnique({ where: { id: brandId } }),
      prisma.product.count({ where: { brandId } }),
      prisma.apiKey.count({ where: { brandId, revokedAt: null } }),
      prisma.integration.count({
        where: { brandId, status: 'CONNECTED', provider: { in: ['SHOPIFY', 'WOOCOMMERCE'] } },
      }),
      prisma.widgetInstall.count({ where: { brandId } }),
      prisma.user.count({ where: { brandId } }),
    ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Welcome to Avori, ${brand?.name ?? 'friend'}`}
        description="Five steps to a fully wired commerce experience, most brands finish in under 15 minutes."
      />
      <OnboardingWizard
        brandId={brandId}
        appUrl={process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}
        state={{
          profileComplete: !!brand?.domain,
          hasProducts: productCount > 0,
          hasIngestion: apiKeyCount > 0 || connectorCount > 0,
          hasWidget: widgetInstalls > 0,
          hasTeam: teamCount > 1,
        }}
      />
    </div>
  );
}
