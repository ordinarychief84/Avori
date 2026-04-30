import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { fail, ok } from '@/lib/http';

const patch = z.object({ disabled: z.boolean().optional() });

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    const data = patch.parse(await req.json());
    const video = await prisma.video.update({ where: { id: params.id }, data });
    return ok({ video });
  } catch (e) {
    return fail(e);
  }
}
