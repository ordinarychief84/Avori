import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiKey } from '@/lib/apikey';
import { HttpError } from '@/lib/auth';
import { surveySubmitSchema } from '@/lib/validation';
import { fail, ok } from '@/lib/http';
import { track } from '@/lib/events';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { brandId } = await requireApiKey(req);
    const data = surveySubmitSchema.parse(await req.json());
    const survey = await prisma.survey.findFirst({
      where: { id: params.id, brandId, status: 'ACTIVE' },
    });
    if (!survey) throw new HttpError(404, 'Survey not found or not active');

    const email = data.email?.trim().toLowerCase() || null;
    const customer = email
      ? await prisma.customer.findUnique({ where: { brandId_email: { brandId, email } } })
      : null;

    const response = await prisma.surveyResponse.create({
      data: {
        brandId,
        surveyId: survey.id,
        customerId: customer?.id ?? null,
        email,
        orderId: data.orderId ?? null,
        score: data.score ?? null,
        answer: data.answer || null,
      },
    });
    await prisma.survey.update({
      where: { id: survey.id },
      data: { responsesCount: { increment: 1 } },
    });
    await track({ brandId, type: 'SURVEY_SUBMIT', refType: 'survey', refId: survey.id, meta: { score: data.score ?? null } });
    return ok({ responseId: response.id }, 201);
  } catch (e) {
    return fail(e);
  }
}
