import { requireBrand } from '@/lib/auth';
import { importReviewUgc } from '@/lib/ugc';
import { audit } from '@/lib/audit';
import { fail, ok } from '@/lib/http';

export async function POST() {
  try {
    const { brandId, userId } = await requireBrand();
    const created = await importReviewUgc(brandId);
    await audit({
      brandId,
      userId,
      action: 'ugc.import_reviews',
      entity: 'ugc',
      meta: { created },
    });
    return ok({ created });
  } catch (e) {
    return fail(e);
  }
}
