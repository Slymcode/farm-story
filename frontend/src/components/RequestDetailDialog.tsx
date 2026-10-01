import { useRequestDetail } from '@/api/hooks';
import { SERVICES } from '@/lib/constants';
import { date } from '@/lib/format';
import { AssessmentView } from './AssessmentView';
import { Timeline } from './Timeline';
import { Dialog, ErrorState, LoadingState, StatusBadge } from './ui';

/** Farmer-facing request detail: current status, assigned agronomist, assessment (when shared) and the full timeline. */
export function RequestDetailDialog({ requestId, onClose }: { requestId: string | null; onClose: () => void }) {
  const q = useRequestDetail(requestId ?? undefined);
  const r = q.data;
  return (
    <Dialog open={!!requestId} onClose={onClose} title={r ? SERVICES[r.type].label : 'Service request'} wide>
      {q.isLoading ? <LoadingState rows={3} /> : q.isError || !r ? <ErrorState message="We couldn't load this request." onRetry={() => q.refetch()} /> : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-ink-500">{r.requestId} · Submitted {date(r.createdAt)}</p>
            <StatusBadge status={r.status} />
          </div>
          {r.description && <p className="text-ink-700">“{r.description}”</p>}
          <p className="rounded-xl bg-white p-3 text-[0.95rem] ring-1 ring-cream-200">
            <span className="font-semibold text-forest-900">Agronomist: </span>{r.agronomist ? `${r.agronomist.fullName}${r.agronomist.county ? ` · ${r.agronomist.county}` : ''}` : 'Not assigned yet. We will assign someone once the team has reviewed your request.'}
          </p>
          {r.assessment && <section><h3 className="mb-2 text-lg font-semibold">Assessment</h3><AssessmentView a={r.assessment} /></section>}
          <section><h3 className="mb-3 text-lg font-semibold">What has happened so far</h3><Timeline events={r.events ?? []} /></section>
        </div>
      )}
    </Dialog>
  );
}
