'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Input, Select, FormField } from '@/components/ui/Input';

type Option = {
  id: string;
  label: string;
  productIds: string[];
  nextQuestionId: string | null;
};

type Question = {
  id: string;
  sort: number;
  type: 'SINGLE_CHOICE' | 'MULTI_CHOICE' | 'TEXT';
  prompt: string;
  helpText: string | null;
  options: Option[];
};

type ProductOption = { value: string; label: string };

// Interactive quiz builder: questions with answer options, each option
// mapping to recommended products and (optionally) jumping to a specific
// next question, the conditional-logic branch.
export default function QuizBuilder({
  quizId,
  questions: initialQuestions,
  products,
}: {
  quizId: string;
  questions: Question[];
  products: ProductOption[];
}) {
  const router = useRouter();
  const [drafts, setDrafts] = useState<Record<string, Question>>(
    Object.fromEntries(initialQuestions.map((q) => [q.id, q]))
  );
  const [busy, setBusy] = useState<string | null>(null);
  const questions = initialQuestions.map((q) => drafts[q.id] ?? q);

  const patchDraft = (id: string, patch: Partial<Question>) =>
    setDrafts((d) => ({ ...d, [id]: { ...(d[id] ?? initialQuestions.find((q) => q.id === id)!), ...patch } }));

  const api = async (path: string, method: string, body?: unknown) => {
    const res = await fetch(path, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error ?? 'Request failed');
    }
    return res.json();
  };

  const addQuestion = async () => {
    setBusy('add');
    try {
      await api(`/api/brand/quizzes/${quizId}/questions`, 'POST', {
        prompt: 'New question',
        type: 'SINGLE_CHOICE',
        options: [
          { id: crypto.randomUUID().slice(0, 8), label: 'Option 1', productIds: [] },
          { id: crypto.randomUUID().slice(0, 8), label: 'Option 2', productIds: [] },
        ],
      });
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    } finally {
      setBusy(null);
    }
  };

  const saveQuestion = async (q: Question) => {
    setBusy(q.id);
    try {
      await api(`/api/brand/quizzes/${quizId}/questions/${q.id}`, 'PATCH', {
        prompt: q.prompt,
        helpText: q.helpText ?? '',
        type: q.type,
        options: q.options,
      });
      toast.success('Question saved');
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    } finally {
      setBusy(null);
    }
  };

  const removeQuestion = async (q: Question) => {
    setBusy(q.id);
    try {
      await api(`/api/brand/quizzes/${quizId}/questions/${q.id}`, 'DELETE');
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    } finally {
      setBusy(null);
    }
  };

  const move = async (index: number, dir: -1 | 1) => {
    const a = questions[index];
    const b = questions[index + dir];
    if (!a || !b) return;
    setBusy(a.id);
    try {
      await api(`/api/brand/quizzes/${quizId}/questions/${a.id}`, 'PATCH', { sort: b.sort });
      await api(`/api/brand/quizzes/${quizId}/questions/${b.id}`, 'PATCH', { sort: a.sort });
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      {questions.map((q, qi) => (
        <Card key={q.id}>
          <CardBody className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <span className="mt-2 rounded-full bg-accent-subtle px-2.5 py-0.5 text-2xs font-semibold text-accent">
                Q{qi + 1}
              </span>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" disabled={qi === 0} onClick={() => move(qi, -1)} aria-label="Move up">
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  disabled={qi === questions.length - 1}
                  onClick={() => move(qi, 1)}
                  aria-label="Move down"
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => removeQuestion(q)} aria-label="Delete question">
                  <Trash2 className="h-4 w-4 text-danger" />
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
              <FormField label="Prompt">
                <Input value={q.prompt} onChange={(e) => patchDraft(q.id, { prompt: e.target.value })} />
              </FormField>
              <FormField label="Answer type">
                <Select
                  value={q.type}
                  onChange={(e) => patchDraft(q.id, { type: e.target.value as Question['type'] })}
                >
                  <option value="SINGLE_CHOICE">Single choice</option>
                  <option value="MULTI_CHOICE">Multiple choice</option>
                  <option value="TEXT">Free text</option>
                </Select>
              </FormField>
            </div>

            {q.type !== 'TEXT' && (
              <div className="space-y-2">
                <div className="grid grid-cols-[2fr_2fr_1.5fr_auto] items-center gap-2 text-2xs uppercase tracking-[0.15em] text-fg-subtle">
                  <span>Option</span>
                  <span>Recommends products</span>
                  <span>Then jump to</span>
                  <span />
                </div>
                {q.options.map((o, oi) => (
                  <div key={o.id} className="grid grid-cols-[2fr_2fr_1.5fr_auto] items-start gap-2">
                    <Input
                      value={o.label}
                      onChange={(e) => {
                        const options = [...q.options];
                        options[oi] = { ...o, label: e.target.value };
                        patchDraft(q.id, { options });
                      }}
                    />
                    <select
                      multiple
                      size={2}
                      value={o.productIds}
                      onChange={(e) => {
                        const selected = [...e.target.selectedOptions].map((el) => el.value);
                        const options = [...q.options];
                        options[oi] = { ...o, productIds: selected };
                        patchDraft(q.id, { options });
                      }}
                      className="block w-full rounded-md border border-border bg-surface px-2 py-1 text-xs text-fg focus:border-accent focus:outline-none"
                    >
                      {products.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                    <Select
                      value={o.nextQuestionId ?? ''}
                      onChange={(e) => {
                        const options = [...q.options];
                        options[oi] = { ...o, nextQuestionId: e.target.value || null };
                        patchDraft(q.id, { options });
                      }}
                    >
                      <option value="">Next in order</option>
                      {questions
                        .filter((other) => other.id !== q.id)
                        .map((other, otherIndex) => (
                          <option key={other.id} value={other.id}>
                            Q{questions.indexOf(other) + 1 + (otherIndex >= 0 ? 0 : 0)}: {other.prompt.slice(0, 30)}
                          </option>
                        ))}
                    </Select>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Remove option"
                      onClick={() => patchDraft(q.id, { options: q.options.filter((_, i) => i !== oi) })}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-fg-muted" />
                    </Button>
                  </div>
                ))}
                <Button
                  size="sm"
                  variant="ghost"
                  leftIcon={<Plus className="h-3.5 w-3.5" />}
                  onClick={() =>
                    patchDraft(q.id, {
                      options: [
                        ...q.options,
                        { id: crypto.randomUUID().slice(0, 8), label: `Option ${q.options.length + 1}`, productIds: [], nextQuestionId: null },
                      ],
                    })
                  }
                >
                  Add option
                </Button>
              </div>
            )}

            <div className="flex justify-end">
              <Button size="sm" loading={busy === q.id} onClick={() => saveQuestion(q)}>
                Save question
              </Button>
            </div>
          </CardBody>
        </Card>
      ))}

      <Button variant="secondary" leftIcon={<Plus className="h-4 w-4" />} loading={busy === 'add'} onClick={addQuestion}>
        Add question
      </Button>
    </div>
  );
}
