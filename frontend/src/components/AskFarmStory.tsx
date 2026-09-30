import { useState } from 'react';
import { RefreshCw, Send, Sparkles, WifiOff } from 'lucide-react';
import { useAskFarmStory } from '@/api/hooks';
import { ApiError } from '@/api/client';
import { Button, Card } from './ui';

const SUGGESTIONS = [
  'How can I improve my coffee farm?', 'What should I check if my coffee yield is low?',
  'Why might soil testing be useful?', 'What should I discuss with an agronomist?',
];

/** Renders the model's plain text: paragraphs and "- " bullets only (no raw HTML, so nothing to sanitise). */
function AnswerText({ text }: { text: string }) {
  const clean = (s: string) => s.replace(/^[-*•]\s+/, '').replace(/\*\*(.+?)\*\*/g, '$1').replace(/^#+\s*/, '');
  const blocks = text.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return (
    <div className="space-y-3 text-[0.98rem] leading-relaxed text-ink-900">
      {blocks.map((b, i) => {
        const lines = b.split('\n').map((l) => l.trim()).filter(Boolean);
        if (lines.every((l) => /^[-*•]\s+/.test(l))) return <ul key={i} className="list-disc space-y-1.5 pl-5">{lines.map((l, j) => <li key={j}>{clean(l)}</li>)}</ul>;
        return <p key={i}>{lines.map(clean).join(' ')}</p>;
      })}
    </div>
  );
}

export function AskFarmStory({ farmId }: { farmId: string }) {
  const [q, setQ] = useState('');
  const [asked, setAsked] = useState('');
  const ask = useAskFarmStory();
  const send = (question: string) => { const t = question.trim(); if (t.length < 3) return; setAsked(t); ask.mutate({ farmId, question: t }); };
  const err = ask.error as ApiError | null;

  return (
    <Card as="section" className="border-forest-200 bg-forest-50/60">
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-forest-800 text-gold-400"><Sparkles className="size-5" aria-hidden /></span>
        <div><h2 className="text-xl font-semibold">Ask Farm Story</h2><p className="text-sm text-ink-500">Get practical guidance based on your farm information.</p></div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Suggested questions">
        {SUGGESTIONS.map((s) => (
          <button key={s} type="button" disabled={ask.isPending} onClick={() => { setQ(s); send(s); }}
            className="min-h-10 rounded-full border border-forest-200 bg-white px-3.5 text-left text-sm font-medium text-forest-800 hover:border-forest-600 disabled:opacity-50">{s}</button>
        ))}
      </div>

      <form className="mt-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); send(q); }}>
        <label htmlFor="ask-q" className="sr-only">Your question</label>
        <input id="ask-q" value={q} onChange={(e) => setQ(e.target.value)} maxLength={500} placeholder="Type your own question…" className="min-h-12 min-w-0 flex-1 rounded-xl border border-cream-300 bg-white px-4 focus:border-forest-600 focus:outline-none focus:ring-2 focus:ring-forest-600/30" />
        <Button type="submit" icon={Send} disabled={q.trim().length < 3 || ask.isPending} aria-label="Send question" className="px-4"><span className="sr-only sm:not-sr-only">Ask</span></Button>
      </form>

      <div aria-live="polite" className="mt-4">
        {ask.isPending && (
          <div className="rounded-xl bg-white p-4 ring-1 ring-cream-200">
            <p className="text-sm font-medium text-ink-500">“{asked}”</p>
            <p className="mt-2 flex items-center gap-2 font-medium text-forest-800"><span className="flex gap-1" aria-hidden>{[0, 1, 2].map((i) => <span key={i} className="size-2 animate-[fs-pulse_1s_ease-in-out_infinite] rounded-full bg-forest-600" style={{ animationDelay: `${i * 150}ms` }} />)}</span>Reading your farm profile and preparing an answer…</p>
          </div>
        )}
        {ask.isError && (
          <div role="alert" className="rounded-xl bg-white p-4 ring-1 ring-danger-700/25">
            <p className="flex items-start gap-2 font-medium text-danger-700"><WifiOff className="mt-0.5 size-5 shrink-0" aria-hidden />{err?.message ?? 'The Farm Story assistant is temporarily unavailable. Your farm information and recommendations are still available.'}</p>
            <Button variant="secondary" size="sm" icon={RefreshCw} className="mt-3" onClick={() => send(asked)}>Try again</Button>
          </div>
        )}
        {ask.data && !ask.isPending && (
          <div className="rounded-xl bg-white p-4 ring-1 ring-cream-200">
            <p className="mb-3 border-b border-cream-200 pb-3 text-sm font-medium text-ink-500">“{asked}”</p>
            <AnswerText text={ask.data.answer} />
            <p className="mt-4 rounded-lg bg-cream-100 p-3 text-xs text-ink-700">{ask.data.disclaimer}</p>
          </div>
        )}
      </div>
    </Card>
  );
}
