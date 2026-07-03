import Link from 'next/link';
import { ClipboardList } from 'lucide-react';
import { pageBrandSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/AppShell';
import EntityDialog, { type FieldSpec } from '@/components/EntityDialog';
import RowDelete from '@/components/RowDelete';

const surveyFields: FieldSpec[] = [
  { name: 'title', label: 'Title', type: 'text', required: true, placeholder: 'Post-purchase NPS' },
  {
    name: 'type',
    label: 'Type',
    type: 'select',
    options: [
      { value: 'NPS', label: 'NPS (0–10)' },
      { value: 'CSAT', label: 'CSAT (1–5)' },
      { value: 'POST_PURCHASE', label: 'Post-purchase' },
      { value: 'EXIT', label: 'Exit survey' },
      { value: 'CUSTOM', label: 'Custom' },
    ],
  },
  { name: 'question', label: 'Question', type: 'textarea', required: true, placeholder: 'How likely are you to recommend us?' },
  { name: 'followUp', label: 'Follow-up question', type: 'text', placeholder: 'What could we do better?' },
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'DRAFT', label: 'Draft' },
      { value: 'ACTIVE', label: 'Active' },
      { value: 'PAUSED', label: 'Paused' },
      { value: 'ENDED', label: 'Ended' },
    ],
  },
];

export default async function SurveysPage() {
  const { brandId } = await pageBrandSession();
  const surveys = await prisma.survey.findMany({
    where: { brandId },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Surveys"
        description="NPS, CSAT, post-purchase and exit surveys with AI-generated summaries."
        actions={<EntityDialog title="New survey" endpoint="/api/brand/surveys" triggerLabel="New survey" fields={surveyFields} />}
      />

      {surveys.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No surveys yet"
          description="Responses arrive from POST /api/v1/surveys/:id/respond, from your post-checkout page, emails, or exit intents."
        />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2/40 text-left text-2xs uppercase tracking-[0.15em] text-fg-subtle">
                <th className="px-5 py-3">Survey</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Responses</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {surveys.map((s) => (
                <tr key={s.id} className="border-b border-border/60 last:border-0 hover:bg-surface-2/30">
                  <td className="px-5 py-3.5">
                    <Link href={`/dashboard/surveys/${s.id}`} className="font-medium text-fg hover:text-accent">
                      {s.title}
                    </Link>
                    <div className="line-clamp-1 text-xs text-fg-muted">{s.question}</div>
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge tone="accent">{s.type}</Badge>
                  </td>
                  <td className="px-5 py-3.5 text-fg-muted">{s.responsesCount}</td>
                  <td className="px-5 py-3.5">
                    <Badge tone={s.status === 'ACTIVE' ? 'success' : 'neutral'}>{s.status.toLowerCase()}</Badge>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex justify-end gap-2">
                      <EntityDialog
                        title="Edit survey"
                        endpoint={`/api/brand/surveys/${s.id}`}
                        method="PATCH"
                        triggerLabel="Edit"
                        triggerVariant="secondary"
                        triggerSize="sm"
                        triggerIcon="none"
                        initial={{
                          title: s.title,
                          type: s.type,
                          question: s.question,
                          followUp: s.followUp ?? '',
                          status: s.status,
                        }}
                        fields={surveyFields}
                      />
                      <RowDelete endpoint={`/api/brand/surveys/${s.id}`} confirm={`Delete "${s.title}"?`} />
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
