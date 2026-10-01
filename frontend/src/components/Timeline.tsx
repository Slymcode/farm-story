import { CheckCircle2, ClipboardCheck, Eye, Send, UserCheck, XCircle, type LucideIcon } from 'lucide-react';
import { dateTime } from '@/lib/format';
import type { RequestEvent, RequestEventType } from '@/types';
import { cx } from './ui';

const META: Record<RequestEventType, { icon: LucideIcon; title: string; tone: string }> = {
  REQUEST_CREATED: { icon: Send, title: 'Request submitted', tone: 'bg-forest-50 text-forest-700' },
  REQUEST_REVIEWED: { icon: Eye, title: 'Under review', tone: 'bg-gold-100 text-earth-700' },
  AGRONOMIST_ASSIGNED: { icon: UserCheck, title: 'Agronomist assigned', tone: 'bg-forest-50 text-forest-700' },
  ASSESSMENT_SUBMITTED: { icon: ClipboardCheck, title: 'Assessment submitted', tone: 'bg-gold-100 text-earth-700' },
  REQUEST_COMPLETED: { icon: CheckCircle2, title: 'Request completed', tone: 'bg-forest-700 text-cream-50' },
  REQUEST_CANCELLED: { icon: XCircle, title: 'Request cancelled', tone: 'bg-cream-200 text-ink-700' },
};

/** Vertical lifecycle timeline, oldest first. Renders only real recorded events. */
export function Timeline({ events }: { events: RequestEvent[] }) {
  if (!events.length) return <p className="text-sm text-ink-500">No activity recorded yet.</p>;
  return (
    <ol aria-label="Request timeline" className="relative space-y-4">
      {events.map((e, i) => {
        const m = META[e.type];
        return (
          <li key={e.id} className="relative flex gap-3.5">
            {i < events.length - 1 && <span aria-hidden className="absolute left-[1.1rem] top-10 h-[calc(100%-1.5rem)] w-px bg-cream-300" />}
            <span className={cx('z-10 grid size-9 shrink-0 place-items-center rounded-full', m.tone)}><m.icon className="size-[1.1rem]" aria-hidden /></span>
            <div className="min-w-0 pb-1">
              <p className="font-semibold text-forest-900">{m.title}</p>
              <p className="text-[0.95rem] text-ink-700">{e.message}</p>
              <p className="text-xs text-ink-500">{dateTime(e.createdAt)}{e.actorName ? ` · ${e.actorName}` : ''}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
