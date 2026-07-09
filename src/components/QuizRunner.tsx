'use client';

import type { CSSProperties } from 'react';
import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Mail, ShoppingBag, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import type { QuizConfig } from '@/lib/quizzes';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/cn';

type Option = { id: string; label: string; imageUrl: string | null; nextQuestionId: string | null };
type Question = {
  id: string;
  type: 'SINGLE_CHOICE' | 'MULTI_CHOICE' | 'TEXT';
  prompt: string;
  helpText: string | null;
  options: Option[];
};
export type PublicQuiz = {
  id: string;
  title: string;
  description: string | null;
  leadCapture: boolean;
  config: QuizConfig | null;
  questions: Question[];
};

// Derive the accent token overrides from a merchant hex color. All quiz UI is
// token-driven (text-accent, bg-accent, bg-accent-subtle, from-accent…), so
// setting these CSS variables on the wrapper re-skins the whole quiz to the
// merchant's brand without touching any component class.
function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function mix(a: number[], b: number[], t: number): string {
  return a.map((x, i) => Math.round(x + (b[i] - x) * t)).join(' ');
}
function accentVars(hex?: string): CSSProperties {
  const rgb = hex ? hexToRgb(hex) : null;
  if (!rgb) return {};
  const WHITE = [255, 255, 255];
  const BLACK = [0, 0, 0];
  return {
    '--accent': rgb.join(' '),
    '--accent-bright': mix(rgb, WHITE, 0.18),
    '--accent-hover': mix(rgb, BLACK, 0.12),
    '--accent-deep': mix(rgb, BLACK, 0.28),
    '--accent-subtle': mix(rgb, WHITE, 0.88),
  } as CSSProperties;
}
type Recommendation = { id: string; name: string; price: number; imageUrl: string; productUrl: string };

type Step = 'intro' | 'questions' | 'submitting' | 'results';

// Hosted quiz experience: answer, see matched products immediately, and
// leave an email only if not ready to buy.
export default function QuizRunner({
  brandId,
  quiz,
  submitPath,
  claimPath,
}: {
  brandId: string;
  quiz: PublicQuiz;
  submitPath: string;
  claimPath: string;
}) {
  const [step, setStep] = useState<Step>('intro');
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [history, setHistory] = useState<string[]>([]);
  const [currentId, setCurrentId] = useState(quiz.questions[0]?.id ?? '');
  const [textDraft, setTextDraft] = useState('');
  const [responseId, setResponseId] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [email, setEmail] = useState('');
  const [claimed, setClaimed] = useState(false);
  const [claiming, setClaiming] = useState(false);

  // Merchant branding + copy, with Avori defaults where unset.
  const c = quiz.config ?? {};
  const styleVars = accentVars(c.accent);

  const order = useMemo(() => quiz.questions.map((q) => q.id), [quiz.questions]);
  const byId = useMemo(() => new Map(quiz.questions.map((q) => [q.id, q])), [quiz.questions]);
  const current = byId.get(currentId);
  const position = Math.max(order.indexOf(currentId), 0);
  const progress = step === 'results' ? 100 : Math.round((position / Math.max(order.length, 1)) * 100);

  const submit = async (finalAnswers: Record<string, string | string[]>) => {
    setStep('submitting');
    try {
      const res = await fetch(submitPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: finalAnswers }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Could not submit');
      setResponseId(data.responseId);
      setRecommendations(data.recommendations ?? []);
      setStep('results');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not submit');
      setStep('questions');
    }
  };

  const advance = (nextAnswers: Record<string, string | string[]>, jumpTo?: string | null) => {
    const nextId = jumpTo ?? order[position + 1];
    if (nextId && byId.has(nextId)) {
      setHistory((h) => [...h, currentId]);
      setCurrentId(nextId);
      setTextDraft('');
    } else {
      void submit(nextAnswers);
    }
  };

  const choose = (option: Option) => {
    if (!current) return;
    const next = { ...answers, [current.id]: option.id };
    setAnswers(next);
    advance(next, option.nextQuestionId);
  };

  const toggleMulti = (optionId: string) => {
    if (!current) return;
    const selected = new Set((answers[current.id] as string[] | undefined) ?? []);
    if (selected.has(optionId)) selected.delete(optionId);
    else selected.add(optionId);
    setAnswers((a) => ({ ...a, [current.id]: [...selected] }));
  };

  const back = () => {
    const prev = history[history.length - 1];
    if (!prev) return setStep('intro');
    setHistory((h) => h.slice(0, -1));
    setCurrentId(prev);
  };

  const shopClick = (productId: string) => {
    void fetch('/api/public/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brandId, productId, type: 'CTA_CLICK' }),
    }).catch(() => {});
  };

  const claim = async () => {
    if (!responseId || !email.trim()) return;
    setClaiming(true);
    const res = await fetch(claimPath, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ responseId, email: email.trim() }),
    });
    setClaiming(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      toast.error(data?.error ?? 'Could not save your email');
      return;
    }
    setClaimed(true);
  };

  return (
    <div className="mx-auto w-full max-w-2xl" style={styleVars}>
      <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full rounded-full bg-gradient-to-r from-accent to-accent-bright transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {step === 'intro' && (
        <div className="rounded-2xl border border-border bg-surface p-8 text-center shadow-card">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent-subtle">
            <Sparkles className="h-6 w-6 text-accent" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-fg sm:text-3xl">{quiz.title}</h1>
          {quiz.description && <p className="mt-3 text-fg-muted">{quiz.description}</p>}
          <p className="mt-2 text-xs text-fg-subtle">
            {c.introSubtext || `${quiz.questions.length} quick questions, product matches at the end.`}
          </p>
          <Button
            size="lg"
            className="mt-6"
            onClick={() => setStep('questions')}
            rightIcon={<ArrowRight className="h-4 w-4" />}
          >
            {c.introButton || 'Start'}
          </Button>
        </div>
      )}

      {(step === 'questions' || step === 'submitting') && current && (
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-card sm:p-8">
          <div className="text-2xs font-semibold uppercase tracking-[0.18em] text-fg-subtle">
            Question {position + 1} of {order.length}
          </div>
          <h2 className="mt-2 text-xl font-bold tracking-tight text-fg sm:text-2xl">
            {current.prompt}
          </h2>
          {current.helpText && <p className="mt-1 text-sm text-fg-muted">{current.helpText}</p>}

          {current.type === 'TEXT' ? (
            <div className="mt-5 space-y-3">
              <Input
                value={textDraft}
                autoFocus
                placeholder="Type your answer"
                onChange={(e) => setTextDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && textDraft.trim()) {
                    const next = { ...answers, [current.id]: textDraft.trim() };
                    setAnswers(next);
                    advance(next);
                  }
                }}
              />
              <Button
                disabled={!textDraft.trim() || step === 'submitting'}
                loading={step === 'submitting'}
                onClick={() => {
                  const next = { ...answers, [current.id]: textDraft.trim() };
                  setAnswers(next);
                  advance(next);
                }}
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Continue
              </Button>
            </div>
          ) : (
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {current.options.map((o) => {
                const selected =
                  current.type === 'MULTI_CHOICE'
                    ? ((answers[current.id] as string[] | undefined) ?? []).includes(o.id)
                    : answers[current.id] === o.id;
                return (
                  <button
                    key={o.id}
                    type="button"
                    disabled={step === 'submitting'}
                    onClick={() =>
                      current.type === 'MULTI_CHOICE' ? toggleMulti(o.id) : choose(o)
                    }
                    className={cn(
                      'flex items-center gap-3 rounded-xl border p-3.5 text-left text-sm font-medium transition-all',
                      selected
                        ? 'border-accent bg-accent-subtle text-fg ring-1 ring-accent/40'
                        : 'border-border bg-surface text-fg hover:border-accent/40'
                    )}
                  >
                    {o.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={o.imageUrl}
                        alt=""
                        className="h-10 w-10 rounded-lg object-cover ring-1 ring-border"
                      />
                    ) : (
                      <span
                        className={cn(
                          'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',
                          selected ? 'border-accent bg-accent text-white' : 'border-border-strong'
                        )}
                      >
                        {selected && <Check className="h-3 w-3" />}
                      </span>
                    )}
                    {o.label}
                  </button>
                );
              })}
            </div>
          )}

          <div className="mt-6 flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={back} leftIcon={<ArrowLeft className="h-4 w-4" />}>
              Back
            </Button>
            {current.type === 'MULTI_CHOICE' && (
              <Button
                disabled={((answers[current.id] as string[] | undefined) ?? []).length === 0 || step === 'submitting'}
                loading={step === 'submitting'}
                onClick={() => advance(answers)}
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Continue
              </Button>
            )}
          </div>
        </div>
      )}

      {step === 'results' && (
        <div className="space-y-5">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent-subtle">
              <Sparkles className="h-6 w-6 text-accent" />
            </div>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-fg sm:text-3xl">
              {recommendations.length > 0
                ? c.resultHeading || 'Made for you'
                : c.noResultHeading || 'Thanks for taking the quiz'}
            </h2>
            <p className="mt-1 text-sm text-fg-muted">
              {recommendations.length > 0
                ? c.resultSubtext || 'Based on your answers, these are your best matches.'
                : 'We received your answers.'}
            </p>
          </div>

          {recommendations.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              {recommendations.slice(0, 4).map((p, i) => (
                <div
                  key={p.id}
                  className={cn(
                    'overflow-hidden rounded-2xl border bg-surface shadow-card',
                    i === 0 ? 'border-accent' : 'border-border'
                  )}
                >
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.imageUrl} alt={p.name} className="aspect-square w-full object-cover" />
                    {i === 0 && (
                      <span className="absolute left-3 top-3 rounded-full bg-accent px-2.5 py-1 text-2xs font-bold uppercase tracking-wide text-white">
                        {c.topMatchLabel || 'Top match'}
                      </span>
                    )}
                  </div>
                  <div className="space-y-2.5 p-4">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-semibold text-fg">{p.name}</span>
                      <span className="shrink-0 text-sm text-fg-muted">${p.price.toFixed(2)}</span>
                    </div>
                    <a href={p.productUrl} target="_blank" rel="noreferrer" onClick={() => shopClick(p.id)}>
                      <Button className="w-full" leftIcon={<ShoppingBag className="h-4 w-4" />}>
                        {c.shopButton || 'Shop now'}
                      </Button>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

          {quiz.leadCapture && !claimed && (
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
              <div className="flex items-center gap-2 text-sm font-semibold text-fg">
                <Mail className="h-4 w-4 text-accent" />
                {c.leadPrompt || "Not ready to buy? We'll email your matches."}
              </div>
              <form
                className="mt-3 flex flex-col gap-2 sm:flex-row"
                onSubmit={(e) => {
                  e.preventDefault();
                  void claim();
                }}
              >
                <Input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" loading={claiming} variant="secondary">
                  {c.leadButton || 'Email my results'}
                </Button>
              </form>
            </div>
          )}
          {claimed && (
            <div className="flex items-center justify-center gap-2 rounded-2xl border border-success/40 bg-success/5 p-4 text-sm font-medium text-fg">
              <Check className="h-4 w-4 text-success" />
              Saved. Your matches are on their way to {email}.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
