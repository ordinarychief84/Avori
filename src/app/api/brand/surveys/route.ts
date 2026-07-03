import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireBrand } from '@/lib/auth';
import { surveySchema } from '@/lib/validation';
import { fail, ok } from '@/lib/http';

export async function POST(req: NextRequest) {
  try {
    const { brandId } = await requireBrand();
    const data = surveySchema.parse(await req.json());
    const survey = await prisma.survey.create({
      data: {
        brandId,
        title: data.title,
        type: data.type ?? 'CUSTOM',
        status: data.status ?? 'DRAFT',
        question: data.question,
        followUp: data.followUp || null,
      },
    });
    return ok({ survey }, 201);
  } catch (e) {
    return fail(e);
  }
}
