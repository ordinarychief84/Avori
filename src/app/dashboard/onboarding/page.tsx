import { pageBrandSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/AppShell';
import OnboardingWizard from '@/components/OnboardingWizard';

export default async function OnboardingPage() {
  const { brandId } = await pageBrandSession();

  const [brand, productCount, apiKeyCount, connectorCount, teamCount] = await Promise.all([
    prisma.brand.findUnique({ where: { id: brandId } }),
    prisma.product.count({ where: { brandId } }),
    prisma.apiKey.count({ where: { brandId, revokedAt: null } }),
    prisma.integration.count({
      where: { brandId, status: 'CONNECTED', provider: { in: ['SHOPIFY', 'WOOCOMMERCE'] } },
    }),
    prisma.user.count({ where: { brandId } }),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Welcome to Avori, ${brand?.name ?? 'friend'}`}
        description="Five steps to a fully wired commerce experience, most brands finish in under 15 minutes."
      />
      <OnboardingWizard
        state={{
          profileComplete: !!brand?.domain,
          hasProducts: productCount > 0,
          hasIngestion: apiKeyCount > 0 || connectorCount > 0,
          hasTeam: teamCount > 1,
        }}
      />
    </div>
  );
}
