import { NextRequest } from 'next/server';
import { ok } from '@/lib/http';
import { runPendingJobs, enqueueJob } from '@/lib/jobs';
import { retryDueWebhooks } from '@/lib/webhooks';
import { prisma } from '@/lib/prisma';

export const maxDuration = 60;
// Never execute at build time, this route touches the job queue.
export const dynamic = 'force-dynamic';

// Serverless-friendly job tick. Point a scheduler (Vercel Cron, GitHub
// Actions, crontab curl) at this route every few minutes. Locally,
// `npm run worker` loops the same work.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    // Never run an unauthenticated job tick in production.
    if (process.env.NODE_ENV === 'production') {
      return new Response('CRON_SECRET is not configured', { status: 503 });
    }
  } else {
    const header = req.headers.get('authorization');
    if (header !== `Bearer ${secret}`) return new Response('unauthorized', { status: 401 });
  }

  // Ensure the daily birthday-rewards job exists (idempotent per day).
  const today = new Date().toISOString().slice(0, 10);
  const existing = await prisma.job.findFirst({
    where: { type: 'birthday_rewards', createdAt: { gte: new Date(`${today}T00:00:00Z`) } },
  });
  if (!existing) await enqueueJob('birthday_rewards');

  const jobs = await runPendingJobs(25);
  const webhooks = await retryDueWebhooks(25);
  return ok({ jobs, webhooksRetried: webhooks });
}
