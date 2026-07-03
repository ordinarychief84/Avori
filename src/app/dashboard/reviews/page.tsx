import Link from 'next/link';
import { Star } from 'lucide-react';
import { pageBrandSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { brandSettings } from '@/lib/orders';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Stat } from '@/components/ui/Stat';
import { PageHeader } from '@/components/AppShell';
import EntityDialog from '@/components/EntityDialog';
import RowAction from '@/components/RowAction';
import RowDelete from '@/components/RowDelete';
import { cn } from '@/lib/cn';
import { fmtDate } from '@/lib/format';

const TABS = [
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Published' },
  { key: 'all', label: 'All reviews' },
  { key: 'questions', label: 'Q&A' },
] as const;

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const { brandId } = await pageBrandSession();
  const tab = TABS.some((t) => t.key === searchParams.tab) ? searchParams.tab! : 'pending';
  const settings = (await brandSettings(brandId)) ?? {};

  const [pendingCount, approvedCount, avg, questions, reviews] = await Promise.all([
    prisma.review.count({ where: { brandId, status: 'PENDING' } }),
    prisma.review.count({ where: { brandId, status: 'APPROVED' } }),
    prisma.review.aggregate({ where: { brandId, status: 'APPROVED' }, _avg: { rating: true } }),
    tab === 'questions'
      ? prisma.productQuestion.findMany({
          where: { brandId },
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: { product: { select: { name: true } } },
        })
      : Promise.resolve([]),
    tab !== 'questions'
      ? prisma.review.findMany({
          where: {
            brandId,
            ...(tab === 'pending' ? { status: 'PENDING' as const } : {}),
            ...(tab === 'approved' ? { status: 'APPROVED' as const } : {}),
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: { product: { select: { id: true, name: true } } },
        })
      : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Reviews"
        description="Collect, moderate and publish customer reviews with verified-purchase badges and AI summaries."
        actions={
          <EntityDialog
            title="Review settings"
            description="Controls collection behavior across the store."
            endpoint="/api/brand/settings"
            method="PATCH"
            triggerLabel="Settings"
            triggerVariant="secondary"
            triggerIcon="none"
            initial={{
              reviewRequestsEnabled: settings.reviewRequestsEnabled !== false,
              reviewRequestDelayDays: Number(settings.reviewRequestDelayDays ?? 7),
              reviewAutoPublishMinRating: Number(settings.reviewAutoPublishMinRating ?? 6),
            }}
            fields={[
              {
                name: 'reviewRequestsEnabled',
                label: 'Review requests',
                type: 'toggle',
                placeholder: 'Send post-purchase review requests',
              },
              {
                name: 'reviewRequestDelayDays',
                label: 'Request delay (days after order)',
                type: 'number',
                min: 1,
                max: 60,
              },
              {
                name: 'reviewAutoPublishMinRating',
                label: 'Auto-publish threshold',
                type: 'number',
                min: 1,
                max: 6,
                hint: 'Ratings at or above this publish instantly. 6 = always moderate manually.',
              },
            ]}
          />
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Awaiting moderation" value={pendingCount} />
        <Stat label="Published" value={approvedCount} />
        <Stat
          label="Average rating"
          value={avg._avg.rating !== null ? avg._avg.rating.toFixed(2) : '—'}
        />
      </div>

      <div className="flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/dashboard/reviews?tab=${t.key}`}
            className={cn(
              'border-b-2 px-4 py-2 text-sm transition-colors',
              tab === t.key
                ? 'border-accent font-medium text-fg'
                : 'border-transparent text-fg-muted hover:text-fg'
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {tab === 'questions' ? (
        questions.length === 0 ? (
          <EmptyState icon={Star} title="No questions yet" description="Customer questions from the widget land here for you to answer." />
        ) : (
          <div className="space-y-4">
            {questions.map((q) => (
              <Card key={q.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-fg">{q.body}</div>
                    <div className="mt-1 text-xs text-fg-muted">
                      {q.product.name} · {q.authorName || 'Anonymous'} · {fmtDate(q.createdAt)}
                    </div>
                    {q.answer && (
                      <p className="mt-3 rounded-md bg-surface-2/60 p-3 text-sm text-fg-muted">
                        <span className="font-medium text-fg">Answer: </span>
                        {q.answer}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={q.status === 'PUBLISHED' ? 'success' : 'neutral'}>
                      {q.status.toLowerCase()}
                    </Badge>
                    <EntityDialog
                      title="Answer question"
                      endpoint={`/api/brand/questions/${q.id}`}
                      method="PATCH"
                      triggerLabel={q.answer ? 'Edit answer' : 'Answer'}
                      triggerVariant="secondary"
                      triggerSize="sm"
                      triggerIcon="none"
                      initial={{ answer: q.answer ?? '' }}
                      fields={[{ name: 'answer', label: 'Answer', type: 'textarea', required: true }]}
                    />
                    {q.status === 'PUBLISHED' && (
                      <RowAction
                        endpoint={`/api/brand/questions/${q.id}`}
                        body={{ status: 'HIDDEN' }}
                        label="Hide"
                      />
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )
      ) : reviews.length === 0 ? (
        <EmptyState
          icon={Star}
          title={tab === 'pending' ? 'Nothing awaiting moderation' : 'No reviews yet'}
          description="Reviews arrive from the storefront widget, the REST API, and post-purchase review requests."
        />
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <Card key={r.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-warning">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                    {r.title && <span className="text-sm font-medium text-fg">{r.title}</span>}
                    {r.verified && <Badge tone="success">verified purchase</Badge>}
                    <Badge tone={r.status === 'APPROVED' ? 'success' : r.status === 'PENDING' ? 'warning' : 'danger'}>
                      {r.status.toLowerCase()}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-fg-muted">{r.body}</p>
                  <div className="mt-2 text-xs text-fg-subtle">
                    {r.authorName} · {r.product.name} · {fmtDate(r.createdAt)}
                  </div>
                  {r.reply && (
                    <p className="mt-3 rounded-md bg-surface-2/60 p-3 text-sm text-fg-muted">
                      <span className="font-medium text-fg">Your reply: </span>
                      {r.reply}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {r.status !== 'APPROVED' && (
                    <RowAction
                      endpoint={`/api/brand/reviews/${r.id}`}
                      body={{ status: 'APPROVED' }}
                      label="Approve"
                      variant="primary"
                      successMessage="Review published"
                    />
                  )}
                  {r.status !== 'REJECTED' && (
                    <RowAction endpoint={`/api/brand/reviews/${r.id}`} body={{ status: 'REJECTED' }} label="Reject" />
                  )}
                  {r.status !== 'SPAM' && (
                    <RowAction endpoint={`/api/brand/reviews/${r.id}`} body={{ status: 'SPAM' }} label="Spam" variant="ghost" />
                  )}
                  <EntityDialog
                    title="Reply to review"
                    endpoint={`/api/brand/reviews/${r.id}`}
                    method="PATCH"
                    triggerLabel={r.reply ? 'Edit reply' : 'Reply'}
                    triggerVariant="secondary"
                    triggerSize="sm"
                    triggerIcon="none"
                    initial={{ reply: r.reply ?? '' }}
                    fields={[{ name: 'reply', label: 'Public reply', type: 'textarea', required: true }]}
                  />
                  <RowDelete endpoint={`/api/brand/reviews/${r.id}`} confirm="Delete this review permanently?" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
