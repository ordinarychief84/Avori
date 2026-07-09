import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Download } from 'lucide-react';
import { pageBrandSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { QuizConfig } from '@/lib/quizzes';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Stat } from '@/components/ui/Stat';
import { PageHeader } from '@/components/AppShell';
import EntityDialog from '@/components/EntityDialog';
import QuizBranding from '@/components/QuizBranding';
import RowAction from '@/components/RowAction';
import QuizBuilder from '@/components/QuizBuilder';
import { fmtDateTime } from '@/lib/format';

type QuizOption = {
  id: string;
  label: string;
  productIds?: string[];
  nextQuestionId?: string | null;
};

export default async function QuizBuilderPage({ params }: { params: { id: string } }) {
  const { brandId } = await pageBrandSession();
  const [quiz, products] = await Promise.all([
    prisma.quiz.findFirst({
      where: { id: params.id, brandId },
      include: {
        questions: { orderBy: { sort: 'asc' } },
        responses: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    }),
    prisma.product.findMany({
      where: { brandId, status: 'ACTIVE' },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ]);
  if (!quiz) notFound();

  return (
    <div className="space-y-8">
      <PageHeader
        title={quiz.title}
        description={
          <span className="flex items-center gap-2">
            <span className="font-mono text-xs">/{quiz.slug}</span>
            <Badge tone={quiz.status === 'ACTIVE' ? 'success' : 'neutral'}>{quiz.status.toLowerCase()}</Badge>
          </span>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/dashboard/quizzes" className="inline-flex items-center gap-1 text-sm text-fg-muted hover:text-fg">
              <ArrowLeft className="h-4 w-4" /> All quizzes
            </Link>
            <EntityDialog
              title="Quiz settings"
              endpoint={`/api/brand/quizzes/${quiz.id}`}
              method="PATCH"
              triggerLabel="Settings"
              triggerVariant="secondary"
              triggerIcon="none"
              initial={{
                title: quiz.title,
                description: quiz.description ?? '',
                leadCapture: quiz.leadCapture,
              }}
              fields={[
                { name: 'title', label: 'Title', type: 'text', required: true },
                { name: 'description', label: 'Description', type: 'textarea' },
                { name: 'leadCapture', label: 'Lead capture', type: 'toggle', placeholder: 'Ask for email before results' },
              ]}
            />
            <QuizBranding
              quizId={quiz.id}
              brandId={quiz.brandId}
              slug={quiz.slug}
              appUrl={process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}
              initial={quiz.config as QuizConfig | null}
            />
            <RowAction
              endpoint={`/api/brand/quizzes/${quiz.id}`}
              body={{ status: quiz.status === 'ACTIVE' ? 'DRAFT' : 'ACTIVE' }}
              label={quiz.status === 'ACTIVE' ? 'Unpublish' : 'Publish'}
              variant={quiz.status === 'ACTIVE' ? 'secondary' : 'primary'}
              size="md"
            />
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Views" value={quiz.views} />
        <Stat label="Completions" value={quiz.completions} />
        <Stat
          label="Completion rate"
          value={quiz.views > 0 ? `${Math.round((quiz.completions / quiz.views) * 100)}%` : '—'}
        />
      </div>

      <QuizBuilder
        quizId={quiz.id}
        products={products.map((p) => ({ value: p.id, label: p.name }))}
        questions={quiz.questions.map((q) => ({
          id: q.id,
          sort: q.sort,
          type: q.type,
          prompt: q.prompt,
          helpText: q.helpText,
          options: (q.options as QuizOption[]).map((o) => ({
            id: o.id,
            label: o.label,
            productIds: o.productIds ?? [],
            nextQuestionId: o.nextQuestionId ?? null,
          })),
        }))}
      />

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Recent responses</CardTitle>
          <a
            href={`/api/brand/quizzes/${quiz.id}/responses?format=csv`}
            className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
          >
            <Download className="h-4 w-4" /> Export CSV
          </a>
        </CardHeader>
        <CardBody className="p-0">
          {quiz.responses.length === 0 ? (
            <p className="px-5 pb-5 text-sm text-fg-muted">
              No responses yet. Serve this quiz with GET /api/v1/quizzes/{quiz.slug} and submit answers back to the same endpoint.
            </p>
          ) : (
            <div className="-mx-px overflow-x-auto"><table className="w-full min-w-[560px] text-sm">
              <tbody>
                {quiz.responses.map((r) => (
                  <tr key={r.id} className="border-t border-border/60">
                    <td className="px-5 py-3 text-fg">{r.email ?? 'Anonymous'}</td>
                    <td className="px-5 py-3 text-fg-muted">
                      {r.recommendedProductIds.length} recommendation
                      {r.recommendedProductIds.length === 1 ? '' : 's'}
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={r.completedAt ? 'success' : 'neutral'}>
                        {r.completedAt ? 'completed' : 'partial'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-right text-xs text-fg-muted">{fmtDateTime(r.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
