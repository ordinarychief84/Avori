'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ExternalLink, Palette } from 'lucide-react';
import { toast } from 'sonner';
import type { QuizConfig } from '@/lib/quizzes';
import { Dialog, DialogContent } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

// Full branding + copy editor for a hosted quiz. Colors use native pickers;
// every copy field is optional and falls back to the Avori default when blank,
// so a merchant in any vertical can reskin and reword the quiz for their store.
export default function QuizBranding({
  quizId,
  brandId,
  slug,
  appUrl,
  initial,
}: {
  quizId: string;
  brandId: string;
  slug: string;
  appUrl: string;
  initial: QuizConfig | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [cfg, setCfg] = useState<QuizConfig>(initial ?? {});
  const [saving, setSaving] = useState(false);

  const set = (k: keyof QuizConfig, v: string | boolean) => setCfg((c) => ({ ...c, [k]: v }));

  const save = async () => {
    setSaving(true);
    // Drop empties so an untouched field means "use the default", not "".
    const clean: Record<string, string | boolean> = {};
    for (const [k, v] of Object.entries(cfg)) {
      if (v === '' || v == null) continue;
      clean[k] = v as string | boolean;
    }
    const res = await fetch(`/api/brand/quizzes/${quizId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config: clean }),
    });
    setSaving(false);
    if (!res.ok) {
      const j = await res.json().catch(() => null);
      toast.error(j?.error ?? 'Could not save branding');
      return;
    }
    toast.success('Branding saved');
    setOpen(false);
    router.refresh();
  };

  return (
    <>
      <Button
        variant="secondary"
        size="md"
        leftIcon={<Palette className="h-4 w-4" />}
        onClick={() => setOpen(true)}
      >
        Customize
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          title="Customize this quiz"
          description="Match your branding and reword it for any product. Blank fields use the default."
          className="max-h-[90vh] max-w-lg overflow-y-auto"
        >
          <div className="space-y-5">
            <Group label="Theme">
              <ColorField label="Brand color" hint="Buttons, progress, highlights" value={cfg.accent || '#7C3AED'} onChange={(v) => set('accent', v)} />
              <ColorField label="Page background" value={cfg.background || '#FFFFFF'} onChange={(v) => set('background', v)} />
              <Field label="Logo URL">
                <Input value={cfg.logoUrl ?? ''} onChange={(e) => set('logoUrl', e.target.value)} placeholder="https://cdn.yoursite.com/logo.png" />
              </Field>
              <label className="flex items-center gap-2 text-sm text-fg">
                <input
                  type="checkbox"
                  checked={!!cfg.hideBranding}
                  onChange={(e) => set('hideBranding', e.target.checked)}
                  className="h-4 w-4 accent-[rgb(var(--accent))]"
                />
                Hide the &ldquo;Powered by Avori&rdquo; footer
              </label>
            </Group>

            <Group label="Wording">
              <Field label="Start button"><Input value={cfg.introButton ?? ''} onChange={(e) => set('introButton', e.target.value)} placeholder="Start" /></Field>
              <Field label="Intro subtext"><Input value={cfg.introSubtext ?? ''} onChange={(e) => set('introSubtext', e.target.value)} placeholder="3 quick questions, matches at the end." /></Field>
              <Field label="Results heading"><Input value={cfg.resultHeading ?? ''} onChange={(e) => set('resultHeading', e.target.value)} placeholder="Made for you" /></Field>
              <Field label="Results subtext"><Input value={cfg.resultSubtext ?? ''} onChange={(e) => set('resultSubtext', e.target.value)} placeholder="Based on your answers, these are your best matches." /></Field>
              <Field label="Top-match badge"><Input value={cfg.topMatchLabel ?? ''} onChange={(e) => set('topMatchLabel', e.target.value)} placeholder="Top match" /></Field>
              <Field label="Shop button"><Input value={cfg.shopButton ?? ''} onChange={(e) => set('shopButton', e.target.value)} placeholder="Shop now" /></Field>
              <Field label="Email-capture prompt"><Input value={cfg.leadPrompt ?? ''} onChange={(e) => set('leadPrompt', e.target.value)} placeholder="Not ready to buy? We'll email your matches." /></Field>
              <Field label="Email-capture button"><Input value={cfg.leadButton ?? ''} onChange={(e) => set('leadButton', e.target.value)} placeholder="Email my results" /></Field>
            </Group>
          </div>

          <div className="mt-5 flex items-center justify-between gap-2 border-t border-border pt-4">
            <a
              href={`${appUrl}/q/${brandId}/${slug}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:text-accent-hover"
            >
              Preview quiz <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" loading={saving} onClick={save}>
                Save branding
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-2xs font-semibold uppercase tracking-[0.16em] text-fg-subtle">{label}</div>
      <div className="mt-2 space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-fg">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function ColorField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-fg">{label}</span>
        {hint && <span className="text-2xs text-fg-subtle">{hint}</span>}
      </div>
      <div className="mt-1 flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 shrink-0 cursor-pointer rounded border border-border bg-surface"
          aria-label={label}
        />
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="flex-1 font-mono text-xs" />
      </div>
    </div>
  );
}
