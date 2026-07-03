import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Download, Sparkles } from 'lucide-react';
import { pageBrandSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { aiEnabled } from '@/lib/ai';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Stat } from '@/components/ui/Stat';
import { PageHeader } from '@/components/AppShell';
import RowAction from '@/components/RowAction';
import { fmtDateTime } from '@/lib/format';

export default async function SurveyDetailPage({ params }: { params: { id: string } }) {
  const { brandId } = await pageBrandSession();
  const survey = await prisma.survey.findFirst({
    where: { id: params.id, brandId },
    include: { responses: { orderBy: { createdAt: 'desc' }, take: 100 } },
  });
  if (!survey) notFound();

  const scored = survey.responses.filter((r) => r.score !== null);
  const avgScore =
    scored.length > 0 ? scored.reduce((s, r) => s + (r.score ?? 0), 0) / scored.length : null;

  // NPS: promoters (9-10) minus detractors (0-6), as a percentage.
  let nps: number | null = null;
  if (survey.type === 'NPS' && scored.length > 0) {
    const promoters = scored.filter((r) => (r.score ?? 0) >= 9).length;
    const detractors = scored.filter((r) => (r.score ?? 0) <= 6).length;
    nps = Math.round(((promoters - detractors) / scored.length) * 100);
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={survey.title}
        description={survey.question}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/dashboard/surveys" className="inline-flex items-center gap-1 text-sm text-fg-muted hover:text-fg">
              <ArrowLeft className="h-4 w-4" /> All surveys
            </Link>
            <a
              href={`/api/brand/surveys/${survey.id}?format=csv`}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg hover:bg-surface-2"
            >
              <Download className="h-4 w-4" /> Export CSV
            </a>
            {aiEnabled() && (
              <RowAction
                endpoint={`/api/brand/surveys/${survey.id}/summary`}
                method="POST"
                label="Generate AI summary"
                variant="primary"
                size="md"
                successMessage="Summary generated"
              />
            )}
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Responses" value={survey.responsesCount} />
        <Stat label="Average score" value={avgScore !== null ? avgScore.toFixed(1) : '—'} />
        <Stat label={survey.type === 'NPS' ? 'NPS' : 'Type'} value={nps !== null ? nps : survey.type} />
      </div>

      {survey.aiSummary && (
        <Card className="border-accent/30 bg-accent-subtle/40">
          <CardBody className="flex gap-3">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
            <div>
              <div className="text-sm font-medium text-fg">AI summary</div>
              <p className="mt-1 whitespace-pre-wrap text-sm text-fg-muted">{survey.aiSummary}</p>
            </div>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Responses</CardTitle>
        </CardHeader>
        <CardBody className="p-0">
          {survey.responses.length === 0 ? (
            <p className="px-5 pb-5 text-sm text-fg-muted">No responses yet.</p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {survey.responses.map((r) => (
                  <tr key={r.id} className="border-t border-border/60">
                    <td className="w-16 px-5 py-3">
                      {r.score !== null ? (
                        <Badge tone={r.score >= 9 ? 'success' : r.score >= 7 ? 'warning' : 'danger'}>
                          {r.score}
                        </Badge>
                      ) : (
                        <span className="text-fg-subtle">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-fg-muted">{r.answer ?? ''}</td>
                    <td className="px-5 py-3 text-fg-muted">{r.email ?? 'Anonymous'}</td>
                    <td className="px-5 py-3 text-right text-xs text-fg-subtle">{fmtDateTime(r.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
