import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireBrand } from '@/lib/auth';
import { apiKeyCreateSchema } from '@/lib/validation';
import { fail, ok } from '@/lib/http';
import { generateApiKey } from '@/lib/apikey';
import { audit } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const { brandId, userId } = await requireBrand();
    const data = apiKeyCreateSchema.parse(await req.json());
    const { key, prefix, hashedKey } = generateApiKey();
    const apiKey = await prisma.apiKey.create({
      data: { brandId, name: data.name, prefix, hashedKey },
    });
    await audit({ brandId, userId, action: 'apikey.create', entity: 'apiKey', entityId: apiKey.id });
    // The plaintext key is returned exactly once, only its hash is stored.
    return ok({ apiKey: { id: apiKey.id, name: apiKey.name, prefix: apiKey.prefix }, key }, 201);
  } catch (e) {
    return fail(e);
  }
}
