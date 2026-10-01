import { CalendarClock } from 'lucide-react';
import { date } from '@/lib/format';
import type { Assessment } from '@/types';

/** Read-only view of an agronomist's field assessment. */
export function AssessmentView({ a }: { a: Assessment }) {
  const block = (label: string, text?: string | null) => text ? <div><dt className="text-sm font-semibold text-ink-500">{label}</dt><dd className="mt-0.5 whitespace-pre-line text-[0.95rem] text-ink-900">{text}</dd></div> : null;
  return (
    <dl className="space-y-3">
      {block('Summary', a.summary)}
      {block('What the agronomist observed', a.observations)}
      {block('Suggested next actions', a.recommendedActions)}
      {a.followUpRequired && (
        <div className="flex items-center gap-2 rounded-xl bg-gold-100 px-3 py-2 text-sm font-semibold text-earth-800">
          <CalendarClock className="size-4" aria-hidden />Follow-up visit planned{a.followUpDate ? ` for ${date(a.followUpDate)}` : ''}
        </div>
      )}
      <p className="text-xs text-ink-500">Written by {a.agronomist?.fullName ?? 'your agronomist'} on {date(a.createdAt)}. This is guidance based on one visit, not a guarantee of results.</p>
    </dl>
  );
}
