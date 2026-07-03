import { requireBrand } from '@/lib/auth';
import { fail, ok } from '@/lib/http';
import { runWooSync } from '@/lib/connectors/woocommerce';

// Manual "Sync now" from the integrations settings page.
export async function POST() {
  try {
    const { brandId } = await requireBrand();
    const result = await runWooSync(brandId);
    return ok({ result });
  } catch (e) {
    return fail(e);
  }
}
