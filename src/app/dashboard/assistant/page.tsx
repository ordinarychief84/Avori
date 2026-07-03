import { pageBrandSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { aiEnabled } from '@/lib/ai';
import { Card, CardBody } from '@/components/ui/Card';
import { PageHeader } from '@/components/AppShell';
import AssistantChat from '@/components/AssistantChat';

export default async function AssistantPage() {
  const { brandId } = await pageBrandSession();

  // Resume the most recent conversation so the thread persists across visits.
  const conversation = await prisma.aiConversation.findFirst({
    where: { brandId },
    orderBy: { updatedAt: 'desc' },
    include: { messages: { orderBy: { createdAt: 'asc' }, take: 40 } },
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="AI Assistant"
        description="Your commerce copilot, answers from live store data and stored insights."
      />

      {!aiEnabled() ? (
        <Card className="border-warning/40 bg-warning/5">
          <CardBody className="text-sm text-fg-muted">
            <span className="font-medium text-fg">AI is not configured.</span> Add{' '}
            <code className="font-mono text-xs">ANTHROPIC_API_KEY</code> to{' '}
            <code className="font-mono text-xs">.env</code> and restart to enable the assistant,
            insights, review summaries, survey summaries and shade analysis.
          </CardBody>
        </Card>
      ) : (
        <AssistantChat
          initialConversationId={conversation?.id ?? null}
          initialMessages={
            conversation?.messages.map((m) => ({
              role: m.role === 'assistant' ? ('assistant' as const) : ('user' as const),
              content: m.content,
            })) ?? []
          }
          suggestions={[
            'How is revenue trending this month?',
            'Which customers are my best repeat buyers?',
            'What should I do about pending reviews?',
            'Suggest a bundle from my top sellers',
          ]}
        />
      )}
    </div>
  );
}
