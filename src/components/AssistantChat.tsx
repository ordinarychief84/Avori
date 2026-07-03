'use client';

import { useRef, useState } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/cn';

type Message = { role: 'user' | 'assistant'; content: string };

export default function AssistantChat({
  initialMessages,
  initialConversationId,
  suggestions,
}: {
  initialMessages: Message[];
  initialConversationId: string | null;
  suggestions: string[];
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [conversationId, setConversationId] = useState<string | null>(initialConversationId);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const send = async (text: string) => {
    const message = text.trim();
    if (!message || busy) return;
    setMessages((m) => [...m, { role: 'user', content: message }]);
    setInput('');
    setBusy(true);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    try {
      const res = await fetch('/api/brand/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, conversationId: conversationId ?? undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Request failed');
      setConversationId(data.conversationId);
      setMessages((m) => [...m, { role: 'assistant', content: data.message.content }]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Request failed');
      setMessages((m) => m.slice(0, -1));
    } finally {
      setBusy(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    }
  };

  return (
    <div className="flex h-[calc(100vh-16rem)] min-h-[420px] flex-col rounded-lg border border-border bg-surface shadow-card">
      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-subtle">
              <Sparkles className="h-6 w-6 text-accent" />
            </div>
            <div>
              <p className="font-medium text-fg">Ask anything about your store</p>
              <p className="mt-1 text-sm text-fg-muted">
                Grounded in your live data — revenue, customers, reviews, loyalty and more.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-border bg-surface-2/60 px-3 py-1.5 text-xs text-fg-muted transition-colors hover:border-accent/40 hover:text-fg"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
            <div
              className={cn(
                'max-w-[85%] whitespace-pre-wrap rounded-lg px-4 py-2.5 text-sm',
                m.role === 'user'
                  ? 'bg-accent text-white'
                  : 'border border-border bg-surface-2/60 text-fg'
              )}
            >
              {m.content}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex justify-start">
            <div className="rounded-lg border border-border bg-surface-2/60 px-4 py-2.5 text-sm text-fg-muted">
              Thinking…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <form
        className="flex gap-2 border-t border-border p-3"
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. Which products should I bundle together?"
          disabled={busy}
        />
        <Button type="submit" loading={busy} leftIcon={<Send className="h-4 w-4" />}>
          Send
        </Button>
      </form>
    </div>
  );
}
