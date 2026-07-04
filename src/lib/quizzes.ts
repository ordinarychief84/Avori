import { prisma } from './prisma';
import { HttpError } from './auth';
import { track } from './events';
import { forwardToDestinations } from './connectors/destinations';

// One quiz engine shared by the REST API and the hosted/public quiz page:
// conditional-logic-aware payloads, weighted recommendation scoring, lead
// capture and post-result claim.

export type QuizOption = {
  id: string;
  label: string;
  imageUrl?: string;
  productIds?: string[];
  tags?: string[];
  weight?: number;
  nextQuestionId?: string | null;
};

export type QuizRecommendation = {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  productUrl: string;
};

export async function findActiveQuiz(brandId: string, slug: string) {
  const quiz = await prisma.quiz.findFirst({
    where: { brandId, slug, status: 'ACTIVE' },
    include: { questions: { orderBy: { sort: 'asc' } } },
  });
  if (!quiz) throw new HttpError(404, 'Quiz not found');
  return quiz;
}

// Shopper-facing payload (no product mappings or weights leak to the client).
export async function getPublicQuiz(brandId: string, slug: string, countView = true) {
  const quiz = await findActiveQuiz(brandId, slug);
  if (countView) {
    await prisma.quiz.update({ where: { id: quiz.id }, data: { views: { increment: 1 } } });
    await track({ brandId, type: 'QUIZ_VIEW', refType: 'quiz', refId: quiz.id });
  }
  return {
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
        imageUrl: o.imageUrl ?? null,
        nextQuestionId: o.nextQuestionId ?? null,
      })),
    })),
  };
}

export async function submitQuiz(
  brandId: string,
  slug: string,
  answers: Record<string, string | string[]>,
  email?: string | null
) {
  const quiz = await findActiveQuiz(brandId, slug);

  // Weighted votes: each selected option votes for its linked products.
  const votes = new Map<string, number>();
  for (const q of quiz.questions) {
    const answer = answers[q.id];
    if (!answer) continue;
    const selected = Array.isArray(answer) ? answer : [answer];
    for (const optionId of selected) {
      const option = (q.options as QuizOption[]).find((o) => o.id === optionId);
      const weight = option?.weight ?? 1;
      for (const pid of option?.productIds ?? []) {
        votes.set(pid, (votes.get(pid) ?? 0) + weight);
      }
    }
  }
  const ranked = [...votes.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);
  const products = await prisma.product.findMany({
    where: { id: { in: ranked.slice(0, 8) }, brandId, status: 'ACTIVE' },
  });
  const byId = new Map(products.map((p) => [p.id, p]));
  const recommended = ranked.map((id) => byId.get(id)).filter((p) => p !== undefined);

  const normalized = email?.trim().toLowerCase() || null;
  let customerId: string | null = null;
  if (normalized) {
    const existing = await prisma.customer.findUnique({
      where: { brandId_email: { brandId, email: normalized } },
      select: { id: true },
    });
    const customer = await prisma.customer.upsert({
      where: { brandId_email: { brandId, email: normalized } },
      update: {},
      create: { brandId, email: normalized, source: 'quiz' },
    });
    customerId = customer.id;
    if (!existing) {
      void forwardToDestinations(brandId, { kind: 'customer_created', email: normalized });
    }
  }

  const response = await prisma.quizResponse.create({
    data: {
      brandId,
      quizId: quiz.id,
      customerId,
      email: normalized,
      answers,
      recommendedProductIds: recommended.map((p) => p.id),
      completedAt: new Date(),
    },
  });
  await prisma.quiz.update({
    where: { id: quiz.id },
    data: { starts: { increment: 1 }, completions: { increment: 1 } },
  });
  await track({ brandId, type: 'QUIZ_COMPLETE', refType: 'quiz', refId: quiz.id });

  const recommendations: QuizRecommendation[] = recommended.map((p) => ({
    id: p.id,
    name: p.name,
    price: Number(p.price),
    imageUrl: p.imageUrl,
    productUrl: p.productUrl,
  }));
  return { responseId: response.id, recommendations };
}

// Post-result lead capture for shoppers who saw their matches first.
export async function claimQuizResponse(brandId: string, responseId: string, email: string) {
  const response = await prisma.quizResponse.findFirst({ where: { id: responseId, brandId } });
  if (!response) throw new HttpError(404, 'Quiz response not found');

  const normalized = email.trim().toLowerCase();
  const existing = await prisma.customer.findUnique({
    where: { brandId_email: { brandId, email: normalized } },
    select: { id: true },
  });
  const customer = await prisma.customer.upsert({
    where: { brandId_email: { brandId, email: normalized } },
    update: {},
    create: { brandId, email: normalized, source: 'quiz' },
  });
  await prisma.quizResponse.update({
    where: { id: response.id },
    data: { email: normalized, customerId: customer.id },
  });
  if (!existing) {
    void forwardToDestinations(brandId, { kind: 'customer_created', email: normalized });
  }
  return { saved: true };
}
