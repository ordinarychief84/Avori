import 'server-only'; // build error if this secret-touching module is ever imported into client code
import Anthropic from '@anthropic-ai/sdk';
import { prisma } from './prisma';
import { HttpError } from './auth';

// Unified AI layer. Every feature routes through the two helpers below so
// model choice, error handling and the not-configured path live in one place.
// All AI features degrade gracefully: aiEnabled() gates them in the UI, and
// callers get a clear 400 rather than a crash when no key is set.

const MODEL = 'claude-opus-4-8';

export function aiEnabled(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

let _client: Anthropic | null = null;
function client(): Anthropic {
  if (!aiEnabled()) {
    throw new HttpError(400, 'AI is not configured. Set ANTHROPIC_API_KEY in .env to enable AI features.');
  }
  if (!_client) _client = new Anthropic();
  return _client;
}

async function aiText(system: string, user: string, maxTokens = 1024): Promise<string> {
  const response = await client().messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content: user }],
  });
  const block = response.content.find((b) => b.type === 'text');
  return block?.type === 'text' ? block.text : '';
}

async function aiJSON<T>(
  system: string,
  user: string,
  schema: Record<string, unknown>,
  maxTokens = 2048
): Promise<T> {
  const response = await client().messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content: user }],
    output_config: { format: { type: 'json_schema', schema } },
  });
  const block = response.content.find((b) => b.type === 'text');
  if (block?.type !== 'text') throw new Error('Empty AI response');
  return JSON.parse(block.text) as T;
}

// ---------------------------------------------------------------------------
// Review summaries
// ---------------------------------------------------------------------------

export async function generateReviewSummary(brandId: string, productId: string): Promise<string> {
  const product = await prisma.product.findFirst({ where: { id: productId, brandId } });
  if (!product) throw new HttpError(404, 'Product not found');

  const reviews = await prisma.review.findMany({
    where: { productId, status: 'APPROVED' },
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: { rating: true, title: true, body: true, verified: true },
  });
  if (reviews.length === 0) throw new HttpError(400, 'No approved reviews to summarize');

  const corpus = reviews
    .map((r) => `[${r.rating}/5${r.verified ? ', verified' : ''}] ${r.title ?? ''} ${r.body}`)
    .join('\n')
    .slice(0, 60_000);

  const summary = await aiText(
    'You summarize customer product reviews for an ecommerce storefront widget. Write 2-3 sentences shoppers would find useful: what customers consistently praise, and any recurring criticism. Neutral, concrete, no marketing fluff.',
    `Product: ${product.name}\n\nReviews:\n${corpus}`,
    512
  );

  await prisma.product.update({
    where: { id: productId },
    data: { aiReviewSummary: summary, aiReviewSummaryAt: new Date() },
  });
  return summary;
}

// ---------------------------------------------------------------------------
// Survey summaries
// ---------------------------------------------------------------------------

export async function generateSurveySummary(brandId: string, surveyId: string): Promise<string> {
  const survey = await prisma.survey.findFirst({ where: { id: surveyId, brandId } });
  if (!survey) throw new HttpError(404, 'Survey not found');

  const responses = await prisma.surveyResponse.findMany({
    where: { surveyId },
    orderBy: { createdAt: 'desc' },
    take: 300,
    select: { score: true, answer: true },
  });
  if (responses.length === 0) throw new HttpError(400, 'No responses to summarize');

  const corpus = responses
    .map((r) => `${r.score !== null ? `score=${r.score} ` : ''}${r.answer ?? ''}`.trim())
    .filter(Boolean)
    .join('\n')
    .slice(0, 60_000);

  const summary = await aiText(
    'You analyze survey responses for an ecommerce merchant. Summarize in 3-5 sentences: overall sentiment, the main recurring themes, and one concrete action the merchant should take. Be specific and grounded in the responses.',
    `Survey type: ${survey.type}\nQuestion: "${survey.question}"\n\nResponses (${responses.length}):\n${corpus}`,
    768
  );

  await prisma.survey.update({
    where: { id: surveyId },
    data: { aiSummary: summary, aiSummaryAt: new Date() },
  });
  return summary;
}

// ---------------------------------------------------------------------------
// Merchant insights
// ---------------------------------------------------------------------------

type InsightItem = { kind: string; title: string; body: string };

export async function generateInsights(brandId: string): Promise<InsightItem[]> {
  const since = new Date(Date.now() - 90 * 86_400_000);
  const [orders, topProducts, reviewAgg, loyalty, referrals, quizzes, upsells, customers] =
    await Promise.all([
      prisma.order.aggregate({
        where: { brandId, placedAt: { gte: since }, status: { notIn: ['CANCELLED', 'REFUNDED'] } },
        _sum: { total: true },
        _count: true,
        _avg: { total: true },
      }),
      prisma.orderItem.groupBy({
        by: ['name'],
        where: { order: { brandId, placedAt: { gte: since } } },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 10,
      }),
      prisma.review.groupBy({
        by: ['status'],
        where: { brandId, createdAt: { gte: since } },
        _count: true,
      }),
      prisma.pointsTransaction.groupBy({
        by: ['type'],
        where: { brandId, createdAt: { gte: since } },
        _sum: { points: true },
      }),
      prisma.referral.aggregate({
        where: { brandId },
        _sum: { clicks: true, conversions: true, revenue: true },
      }),
      prisma.quiz.findMany({
        where: { brandId },
        select: { title: true, views: true, starts: true, completions: true },
      }),
      prisma.upsellOffer.findMany({
        where: { brandId },
        select: { name: true, placement: true, impressions: true, clicks: true, conversions: true, revenue: true },
      }),
      prisma.customer.aggregate({ where: { brandId }, _count: true }),
    ]);

  const repeatCustomers = await prisma.customer.count({
    where: { brandId, ordersCount: { gte: 2 } },
  });

  const context = {
    period: 'last 90 days',
    revenue: Number(orders._sum.total ?? 0),
    ordersCount: orders._count,
    averageOrderValue: Number(orders._avg.total ?? 0),
    customersTotal: customers._count,
    repeatCustomers,
    topProducts: topProducts.map((p) => ({ name: p.name, unitsSold: p._sum.quantity })),
    reviewsByStatus: reviewAgg.map((r) => ({ status: r.status, count: r._count })),
    loyaltyPointsByType: loyalty.map((l) => ({ type: l.type, points: l._sum.points })),
    referrals: {
      clicks: referrals._sum.clicks ?? 0,
      conversions: referrals._sum.conversions ?? 0,
      revenue: Number(referrals._sum.revenue ?? 0),
    },
    quizzes,
    upsells: upsells.map((u) => ({ ...u, revenue: Number(u.revenue) })),
  };

  const { insights } = await aiJSON<{ insights: InsightItem[] }>(
    'You are the analytics brain of a commerce platform. Given store metrics, produce 3-6 sharp, actionable insights for the merchant. Each insight: a kind slug (revenue, retention, reviews, loyalty, referrals, quiz, upsell, catalog), a short title, and a 1-3 sentence body with a concrete recommendation. Only claim what the data supports; if a module has no data, suggest activating it at most once.',
    JSON.stringify(context),
    {
      type: 'object',
      properties: {
        insights: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              kind: { type: 'string' },
              title: { type: 'string' },
              body: { type: 'string' },
            },
            required: ['kind', 'title', 'body'],
            additionalProperties: false,
          },
        },
      },
      required: ['insights'],
      additionalProperties: false,
    },
    4096
  );

  await prisma.aiInsight.deleteMany({ where: { brandId } });
  await prisma.aiInsight.createMany({
    data: insights.map((i) => ({ brandId, kind: i.kind, title: i.title, body: i.body })),
  });
  return insights;
}

// ---------------------------------------------------------------------------
// AI assistant (merchant chat)
// ---------------------------------------------------------------------------

export async function assistantReply(brandId: string, conversationId: string): Promise<string> {
  const [brand, messages, insights] = await Promise.all([
    prisma.brand.findUnique({ where: { id: brandId }, select: { name: true, currency: true } }),
    prisma.aiMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: 30,
    }),
    prisma.aiInsight.findMany({ where: { brandId }, take: 10 }),
  ]);

  // Fresh store snapshot on every turn keeps answers grounded.
  const since = new Date(Date.now() - 30 * 86_400_000);
  const [orders, customerCount, reviewCount, pendingReviews] = await Promise.all([
    prisma.order.aggregate({
      where: { brandId, placedAt: { gte: since }, status: { notIn: ['CANCELLED', 'REFUNDED'] } },
      _sum: { total: true },
      _count: true,
    }),
    prisma.customer.count({ where: { brandId } }),
    prisma.review.count({ where: { brandId, status: 'APPROVED' } }),
    prisma.review.count({ where: { brandId, status: 'PENDING' } }),
  ]);

  const system = [
    `You are Avori's AI assistant for the merchant "${brand?.name}". You help them understand their store data and decide what to do next. Be concise and concrete. Currency: ${brand?.currency ?? 'USD'}.`,
    `Store snapshot (last 30 days): revenue ${Number(orders._sum.total ?? 0).toFixed(2)}, orders ${orders._count}, customers total ${customerCount}, approved reviews ${reviewCount}, reviews awaiting moderation ${pendingReviews}.`,
    insights.length > 0
      ? `Current stored insights:\n${insights.map((i) => `- [${i.kind}] ${i.title}: ${i.body}`).join('\n')}`
      : 'No stored insights yet, the merchant can generate them from the Analytics page.',
  ].join('\n\n');

  const response = await client().messages.create({
    model: MODEL,
    max_tokens: 1024,
    system,
    messages: messages.map((m) => ({
      role: m.role === 'assistant' ? ('assistant' as const) : ('user' as const),
      content: m.content,
    })),
  });
  const block = response.content.find((b) => b.type === 'text');
  return block?.type === 'text' ? block.text : '';
}

// ---------------------------------------------------------------------------
// Shade analysis (vision)
// ---------------------------------------------------------------------------

export type ShadeAnalysis = {
  skinTone: string;
  undertone: string;
  lipTone: string;
  hairColor: string;
  eyeColor: string;
  season: string;
  notes: string;
};

const SHADE_MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;
type ShadeMediaType = (typeof SHADE_MEDIA_TYPES)[number];

export async function analyzeShadeImage(
  imageBase64: string,
  mediaType: string
): Promise<ShadeAnalysis> {
  if (!SHADE_MEDIA_TYPES.includes(mediaType as ShadeMediaType)) {
    throw new HttpError(400, `Unsupported image type. Use one of: ${SHADE_MEDIA_TYPES.join(', ')}`);
  }
  const response = await client().messages.create({
    model: MODEL,
    max_tokens: 1024,
    system:
      'You are a professional beauty shade-matching analyst. Analyze the person in the photo and report cosmetic color attributes. Use these vocabularies, skinTone: fair | light | medium | tan | deep | rich; undertone: cool | neutral | warm | olive; season: spring | summer | autumn | winter. lipTone, hairColor and eyeColor are short free-form descriptions (e.g. "rosy pink", "dark brown", "hazel"). notes: one sentence of shade-matching guidance. If no face is clearly visible, describe attributes as "unknown".',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType as ShadeMediaType, data: imageBase64 },
          },
          { type: 'text', text: 'Analyze this photo for cosmetic shade matching.' },
        ],
      },
    ],
    output_config: {
      format: {
        type: 'json_schema',
        schema: {
          type: 'object',
          properties: {
            skinTone: { type: 'string', enum: ['fair', 'light', 'medium', 'tan', 'deep', 'rich', 'unknown'] },
            undertone: { type: 'string', enum: ['cool', 'neutral', 'warm', 'olive', 'unknown'] },
            lipTone: { type: 'string' },
            hairColor: { type: 'string' },
            eyeColor: { type: 'string' },
            season: { type: 'string', enum: ['spring', 'summer', 'autumn', 'winter', 'unknown'] },
            notes: { type: 'string' },
          },
          required: ['skinTone', 'undertone', 'lipTone', 'hairColor', 'eyeColor', 'season', 'notes'],
          additionalProperties: false,
        },
      },
    },
  });
  const block = response.content.find((b) => b.type === 'text');
  if (block?.type !== 'text') throw new Error('Empty AI response');
  return JSON.parse(block.text) as ShadeAnalysis;
}

// Match analyzed attributes against the catalog. Products declare which
// tones/undertones they suit (Product.shadeTones / Product.undertones);
// unscoped products never match, so merchants opt products in explicitly.
export async function matchProductsForShade(
  brandId: string,
  analysis: ShadeAnalysis,
  limit = 6
): Promise<string[]> {
  const products = await prisma.product.findMany({
    where: {
      brandId,
      status: 'ACTIVE',
      OR: [
        { shadeTones: { has: analysis.skinTone } },
        { undertones: { has: analysis.undertone } },
      ],
    },
    select: { id: true, shadeTones: true, undertones: true },
  });
  const scored = products
    .map((p) => ({
      id: p.id,
      score:
        (p.shadeTones.includes(analysis.skinTone) ? 2 : 0) +
        (p.undertones.includes(analysis.undertone) ? 1 : 0),
    }))
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((p) => p.id);
}
