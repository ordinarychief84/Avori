import Link from 'next/link';
import { ListChecks } from 'lucide-react';
import { pageBrandSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/AppShell';
import EntityDialog from '@/components/EntityDialog';
import RowDelete from '@/components/RowDelete';

export default async function QuizzesPage() {
  const { brandId } = await pageBrandSession();
  const quizzes = await prisma.quiz.findMany({
    where: { brandId },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { questions: true, responses: true } } },
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Product Quizzes"
        description="Guided finders with conditional logic that recommend products and capture leads into the customer database."
        actions={
          <EntityDialog
            title="New quiz"
            endpoint="/api/brand/quizzes"
            triggerLabel="New quiz"
            fields={[
              { name: 'title', label: 'Title', type: 'text', required: true, placeholder: 'Find your perfect shade' },
              { name: 'description', label: 'Description', type: 'textarea' },
              { name: 'leadCapture', label: 'Lead capture', type: 'toggle', placeholder: 'Ask for email before showing results' },
            ]}
          />
        }
      />

      {quizzes.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="No quizzes yet"
          description="Build a skin-type quiz, gift finder or size guide — completions feed recommendations and your customer list."
        />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2/40 text-left text-2xs uppercase tracking-[0.15em] text-fg-subtle">
                <th className="px-5 py-3">Quiz</th>
                <th className="px-5 py-3">Questions</th>
                <th className="px-5 py-3">Views</th>
                <th className="px-5 py-3">Completions</th>
                <th className="px-5 py-3">Completion rate</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {quizzes.map((q) => (
                <tr key={q.id} className="border-b border-border/60 last:border-0 hover:bg-surface-2/30">
                  <td className="px-5 py-3.5">
                    <Link href={`/dashboard/quizzes/${q.id}`} className="font-medium text-fg hover:text-accent">
                      {q.title}
                    </Link>
                    <div className="font-mono text-2xs text-fg-subtle">/{q.slug}</div>
                  </td>
                  <td className="px-5 py-3.5 text-fg-muted">{q._count.questions}</td>
                  <td className="px-5 py-3.5 text-fg-muted">{q.views}</td>
                  <td className="px-5 py-3.5 text-fg-muted">
                    {q.completions}
                    <span className="text-xs text-fg-subtle"> ({q._count.responses} responses)</span>
                  </td>
                  <td className="px-5 py-3.5 text-fg-muted">
                    {q.views > 0 ? `${Math.round((q.completions / q.views) * 100)}%` : '—'}
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge tone={q.status === 'ACTIVE' ? 'success' : 'neutral'}>{q.status.toLowerCase()}</Badge>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex justify-end gap-2">
                      <Link href={`/dashboard/quizzes/${q.id}`} className="text-sm text-accent hover:underline">
                        Open builder
                      </Link>
                      <RowDelete endpoint={`/api/brand/quizzes/${q.id}`} confirm={`Delete quiz "${q.title}"?`} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
