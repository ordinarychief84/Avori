import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiKey } from '@/lib/apikey';
import { HttpError } from '@/lib/auth';
import { quizSubmitSchema } from '@/lib/validation';
import { fail, ok } from '@/lib/http';
import { track } from '@/lib/events';

type QuizOption = {
  id: string;
  label: string;
  imageUrl?: string;
  productIds?: string[];
  tags?: string[];
  nextQuestionId?: string | null;
};

async function findActiveQuiz(brandId: string, slug: string) {
  const quiz = await prisma.quiz.findFirst({
    where: { brandId, slug, status: 'ACTIVE' },
    include: { questions: { orderBy: { sort: 'asc' } } },
  });
  if (!quiz) throw new HttpError(404, 'Quiz not found');
  return quiz;
}

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const { brandId } = await requireApiKey(req);
    const quiz = await findActiveQuiz(brandId, params.slug);
    await prisma.quiz.update({ where: { id: quiz.id }, data: { views: { increment: 1 } } });
    await track({ brandId, type: 'QUIZ_VIEW', refType: 'quiz', refId: quiz.id });
    return ok({
      quiz: {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        leadCapture: quiz.leadCapture,
        questions: quiz.questions.map((q) => ({
          id: q.id,
          type: q.type,
          prompt: q.prompt,
          helpText: q.helpText,
          options: (q.options as QuizOption[]).map((o) => ({
            id: o.id,
            label: o.label,
            imageUrl: o.imageUrl,
            nextQuestionId: o.nextQuestionId ?? null,
          })),
        })),
      },
    });
  } catch (e) {
    return fail(e);
  }
}

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const { brandId } = await requireApiKey(req);
    const data = quizSubmitSchema.parse(await req.json());
    const quiz = await findActiveQuiz(brandId, params.slug);

    // Recommendation engine: selected options vote for their linked products.
    const votes = new Map<string, number>();
    for (const q of quiz.questions) {
      const answer = data.answers[q.id];
      if (!answer) continue;
      const selected = Array.isArray(answer) ? answer : [answer];
      for (const optionId of selected) {
        const option = (q.options as QuizOption[]).find((o) => o.id === optionId);
        for (const pid of option?.productIds ?? []) {
          votes.set(pid, (votes.get(pid) ?? 0) + 1);
        }
      }
    }
    const ranked = [...votes.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);
    const products = await prisma.product.findMany({
      where: { id: { in: ranked.slice(0, 8) }, brandId, status: 'ACTIVE' },
    });
    // Preserve vote ordering.
    const byId = new Map(products.map((p) => [p.id, p]));
    const recommended = ranked.map((id) => byId.get(id)).filter((p) => p !== undefined);

    // Lead capture: quiz emails become customers in the unified database.
    const email = data.email?.trim().toLowerCase() || null;
    let customerId: string | null = null;
    if (email) {
      const customer = await prisma.customer.upsert({
        where: { brandId_email: { brandId, email } },
        update: {},
        create: { brandId, email, source: 'quiz' },
      });
      customerId = customer.id;
    }

    const response = await prisma.quizResponse.create({
      data: {
        brandId,
        quizId: quiz.id,
        customerId,
        email,
        answers: data.answers,
        recommendedProductIds: recommended.map((p) => p.id),
        completedAt: new Date(),
      },
    });
    await prisma.quiz.update({
      where: { id: quiz.id },
      data: { starts: { increment: 1 }, completions: { increment: 1 } },
    });
    await track({ brandId, type: 'QUIZ_COMPLETE', refType: 'quiz', refId: quiz.id });

    return ok(
      {
        responseId: response.id,
        recommendations: recommended.map((p) => ({
          id: p.id,
          name: p.name,
          price: Number(p.price),
          imageUrl: p.imageUrl,
          productUrl: p.productUrl,
        })),
      },
      201
    );
  } catch (e) {
    return fail(e);
  }
}
