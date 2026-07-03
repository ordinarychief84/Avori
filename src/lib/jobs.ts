import { prisma } from './prisma';
import { retryDueWebhooks } from './webhooks';

// Minimal DB-backed job queue. Jobs are claimed atomically (updateMany with
// a status guard) so multiple runners can't double-process. The runner is
// invoked by `npm run worker` locally or by hitting /api/cron on a schedule
// in serverless deployments.

export async function enqueueJob(
  type: string,
  payload?: Record<string, unknown>,
  opts?: { brandId?: string; runAt?: Date; maxAttempts?: number }
) {
  return prisma.job.create({
    data: {
      type,
      payload: payload ? JSON.parse(JSON.stringify(payload)) : undefined,
      brandId: opts?.brandId ?? null,
      runAt: opts?.runAt ?? new Date(),
      maxAttempts: opts?.maxAttempts ?? 3,
    },
  });
}

type JobRecord = Awaited<ReturnType<typeof prisma.job.create>>;

const handlers: Record<string, (job: JobRecord) => Promise<void>> = {
  // Retries failed outbound webhook deliveries that are due.
  webhook_retry: async () => {
    await retryDueWebhooks();
  },

  // "Sends" the post-purchase review request. Email transport is an
  // integration point — until one is configured this logs the send and
  // records it in the audit trail so the dashboard shows activity.
  review_request: async (job) => {
    const p = (job.payload ?? {}) as { brandId?: string; orderId?: string; customerId?: string };
    if (!p.brandId || !p.orderId) return;
    const order = await prisma.order.findFirst({
      where: { id: p.orderId, brandId: p.brandId },
      include: { customer: true, items: true },
    });
    if (!order?.customer || order.status === 'CANCELLED' || order.status === 'REFUNDED') return;
    console.log(
      `[review-request] to=${order.customer.email} order=${order.orderNumber} items=${order.items.length}`
    );
    await prisma.auditLog.create({
      data: {
        brandId: p.brandId,
        action: 'review_request.sent',
        entity: 'order',
        entityId: order.id,
        meta: { email: order.customer.email },
      },
    });
  },

  // Grants birthday loyalty bonuses for every brand with a program.
  birthday_rewards: async () => {
    const { grantBirthdayBonuses } = await import('./loyalty');
    const programs = await prisma.loyaltyProgram.findMany({
      where: { enabled: true, birthdayBonus: { gt: 0 } },
      select: { brandId: true },
    });
    for (const p of programs) await grantBirthdayBonuses(p.brandId);
  },

  // Regenerates AI merchant insights for a brand.
  ai_insights: async (job) => {
    const p = (job.payload ?? {}) as { brandId?: string };
    if (!p.brandId) return;
    const { generateInsights } = await import('./ai');
    await generateInsights(p.brandId);
  },

  // Pulls products / customers / orders from a connected Shopify store.
  shopify_sync: async (job) => {
    const p = (job.payload ?? {}) as { brandId?: string };
    if (!p.brandId) return;
    const { runShopifySync } = await import('./connectors/shopify');
    await runShopifySync(p.brandId);
  },

  // Pulls products / customers / orders from a connected WooCommerce store.
  woo_sync: async (job) => {
    const p = (job.payload ?? {}) as { brandId?: string };
    if (!p.brandId) return;
    const { runWooSync } = await import('./connectors/woocommerce');
    await runWooSync(p.brandId);
  },
};

export async function runPendingJobs(limit = 20): Promise<{ ran: number; failed: number }> {
  const due = await prisma.job.findMany({
    where: { status: 'PENDING', runAt: { lte: new Date() } },
    orderBy: { runAt: 'asc' },
    take: limit,
  });

  let ran = 0;
  let failed = 0;
  for (const job of due) {
    // Atomic claim — skip if another runner got here first.
    const claimed = await prisma.job.updateMany({
      where: { id: job.id, status: 'PENDING' },
      data: { status: 'RUNNING', startedAt: new Date(), attempts: { increment: 1 } },
    });
    if (claimed.count === 0) continue;

    const handler = handlers[job.type];
    try {
      if (!handler) throw new Error(`No handler for job type "${job.type}"`);
      await handler(job);
      await prisma.job.update({
        where: { id: job.id },
        data: { status: 'DONE', finishedAt: new Date() },
      });
      ran++;
    } catch (e) {
      failed++;
      const attempts = job.attempts + 1;
      const giveUp = attempts >= job.maxAttempts;
      await prisma.job.update({
        where: { id: job.id },
        data: {
          status: giveUp ? 'FAILED' : 'PENDING',
          lastError: e instanceof Error ? e.message : String(e),
          finishedAt: giveUp ? new Date() : null,
          // Exponential backoff: 2, 4, 8 minutes.
          runAt: giveUp ? job.runAt : new Date(Date.now() + 2 ** attempts * 60_000),
        },
      });
    }
  }
  return { ran, failed };
}
