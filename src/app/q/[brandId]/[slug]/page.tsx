import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getPublicQuiz, type QuizOption } from '@/lib/quizzes';
import { Logo } from '@/components/Logo';
import QuizRunner from '@/components/QuizRunner';

export const dynamic = 'force-dynamic';

type Params = { brandId: string; slug: string };

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const quiz = await prisma.quiz.findFirst({
    where: { brandId: params.brandId, slug: params.slug, status: 'ACTIVE' },
    select: { title: true },
  });
  return { title: quiz ? `${quiz.title} | Avori` : 'Quiz | Avori', robots: { index: false } };
}

// Hosted quiz page: shareable link merchants can drop in bio, email or ads.
export default async function HostedQuizPage({ params }: { params: Params }) {
  const brand = await prisma.brand.findUnique({ where: { id: params.brandId } });
  if (!brand || brand.disabled) notFound();

  let quiz;
  try {
    quiz = await getPublicQuiz(brand.id, params.slug);
  } catch {
    notFound();
  }
  // Strip anything the client should not see is already handled by
  // getPublicQuiz; cast options for the runner's props type.
  const runnerQuiz = {
    ...quiz,
    questions: quiz.questions.map((q) => ({
      ...q,
      options: q.options as Array<Pick<QuizOption, 'id' | 'label'> & { imageUrl: string | null; nextQuestionId: string | null }>,
    })),
  };

  const cfg = quiz.config ?? {};

  return (
    <div
      className="flex min-h-screen flex-col bg-bg"
      style={cfg.background ? { backgroundColor: cfg.background } : undefined}
    >
      <header className="border-b border-border bg-surface/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-center px-6">
          {cfg.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cfg.logoUrl} alt={brand.name} className="h-8 w-auto max-w-[160px] object-contain" />
          ) : (
            <span className="text-sm font-bold tracking-[0.14em] text-fg">
              {brand.name.toUpperCase()}
            </span>
          )}
        </div>
      </header>
      <main className="flex-1 px-4 py-10 sm:px-6">
        <QuizRunner
          brandId={brand.id}
          quiz={runnerQuiz}
          submitPath={`/api/public/brand/${brand.id}/quizzes/${params.slug}`}
          claimPath={`/api/public/brand/${brand.id}/quizzes/${params.slug}/claim`}
        />
      </main>
      {!cfg.hideBranding && (
        <footer className="py-4">
          <Link
            href="/"
            className="mx-auto flex w-fit items-center gap-1.5 rounded-full bg-surface/80 px-3 py-1 text-2xs text-fg-subtle backdrop-blur transition-colors hover:text-fg"
          >
            Powered by <Logo size="sm" />
          </Link>
        </footer>
      )}
    </div>
  );
}
