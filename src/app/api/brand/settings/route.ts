import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireBrand } from '@/lib/auth';
import { brandSettingsSchema, brandPatchSchema } from '@/lib/validation';
import { fail, ok } from '@/lib/http';
import { audit } from '@/lib/audit';

// Merges module settings into Brand.settings JSON and updates profile fields.
export async function PATCH(req: NextRequest) {
  try {
    const { brandId, userId } = await requireBrand();
    const body = await req.json();
    const profile = brandPatchSchema.parse(body);
    const settings = brandSettingsSchema.parse(body);

    const brand = await prisma.brand.findUnique({ where: { id: brandId } });
    const merged = {
      ...((brand?.settings as Record<string, unknown> | null) ?? {}),
      ...(settings.reviewRequestsEnabled !== undefined
        ? { reviewRequestsEnabled: settings.reviewRequestsEnabled }
        : {}),
      ...(settings.reviewRequestDelayDays !== undefined
        ? { reviewRequestDelayDays: settings.reviewRequestDelayDays }
        : {}),
      ...(settings.reviewAutoPublishMinRating !== undefined
        ? { reviewAutoPublishMinRating: settings.reviewAutoPublishMinRating }
        : {}),
    };

    const updated = await prisma.brand.update({
      where: { id: brandId },
      data: {
        ...(profile.name !== undefined ? { name: profile.name } : {}),
        ...(profile.domain !== undefined ? { domain: profile.domain || null } : {}),
        ...(settings.currency !== undefined ? { currency: settings.currency.toUpperCase() } : {}),
        settings: merged,
      },
    });
    await audit({ brandId, userId, action: 'settings.update', entity: 'brand', entityId: brandId });
    return ok({ brand: updated });
  } catch (e) {
    return fail(e);
  }
}
