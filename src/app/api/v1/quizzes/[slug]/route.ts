import { NextRequest } from 'next/server';
import { requireApiKey } from '@/lib/apikey';
import { quizSubmitSchema } from '@/lib/validation';
import { fail, ok } from '@/lib/http';
import { getPublicQuiz, submitQuiz } from '@/lib/quizzes';

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const { brandId } = await requireApiKey(req);
    const quiz = await getPublicQuiz(brandId, params.slug);
    return ok({ quiz });
  } catch (e) {
    return fail(e);
  }
}

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const { brandId } = await requireApiKey(req);
    const data = quizSubmitSchema.parse(await req.json());
    const result = await submitQuiz(brandId, params.slug, data.answers, data.email || null);
    return ok(result, 201);
  } catch (e) {
    return fail(e);
  }
}
