import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { fail, ok } from '@/lib/http';
import { HttpError } from '@/lib/errors';

// Records GDPR consent for an OAuth signup that reached the dashboard without
// the up-front terms checkbox. Idempotent: only stamps termsAcceptedAt if unset.
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user) throw new HttpError(401, 'Unauthorized');
    await prisma.user.updateMany({
      where: { id: session.user.id, termsAcceptedAt: null },
      data: { termsAcceptedAt: new Date() },
    });
    return ok({ accepted: true });
  } catch (e) {
    return fail(e);
  }
}
