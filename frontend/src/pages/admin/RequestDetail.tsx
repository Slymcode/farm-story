import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, UserCheck } from 'lucide-react';
import { useAgronomists, useAssignAgronomist, useRequestDetail, useUpdateRequestStatus } from '@/api/hooks';
import { AssessmentView } from '@/components/AssessmentView';
import { Timeline } from '@/components/Timeline';
import { Button, Card, ErrorState, LoadingState, SectionTitle, StatusBadge } from '@/components/ui';
import { SERVICES, STATUS_LABEL, cropLabel } from '@/lib/constants';
import { date } from '@/lib/format';
import { canAssign, manualOptions } from '@/lib/workflow';

export default function AdminRequestDetail() {
  const { id } = useParams();
  const q = useRequestDetail(id);
  const agronomists = useAgronomists();
  const assign = useAssignAgronomist();
  const status = useUpdateRequestStatus();
  const [choice, setChoice] = useState('');

  if (q.isLoading) return <LoadingState rows={4} />;
  if (q.isError || !q.data) return <ErrorState message="We couldn't load this request." onRetry={() => q.refetch()} />;
  const r = q.data, s = SERVICES[r.type];
  const options = manualOptions(r.status);
  const candidates = (agronomists.data ?? []).filter((a) => a.status === 'ACTIVE' && a.id !== r.assignedAgronomistId);
  const assignable = canAssign(r.status, !!r.assessment);

  return (
    <div className="space-y-8">
      <Link to="/admin/requests" className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest-700"><ArrowLeft className="size-4" aria-hidden />All requests</Link>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div><h1 className="text-3xl font-bold">{s.label}</h1><p className="text-ink-700">{r.requestId} · {date(r.createdAt)}</p>{r.description && <p className="mt-2 text-ink-700">“{r.description}”</p>}</div>
        <StatusBadge status={r.status} />
      </header>

      <section><SectionTitle>Farmer and farm</SectionTitle>
        <Card><p><Link className="font-semibold text-forest-800 underline underline-offset-2" to={`/admin/farmers/${r.farmerId}`}>{r.farmer?.fullName}</Link> <span className="text-ink-500">· {r.farmer?.farmerId} · {r.farmer?.county} County · {r.farmer?.mobileNumber}</span></p>
          <p className="mt-1 text-ink-700">{r.farm?.farmName} · {r.farm?.location} · {r.farm ? cropLabel(r.farm.primaryCrop) : ''}</p></Card></section>

      <section><SectionTitle hint="Assigning moves the request to Assigned. A request can be reassigned until an assessment is submitted.">Agronomist</SectionTitle>
        <Card className="space-y-4">
          <p><span className="text-ink-500">Currently: </span><strong>{r.agronomist?.fullName ?? 'Not assigned'}</strong></p>
          {assignable ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              <label htmlFor="assign" className="sr-only">Choose an agronomist</label>
              <select id="assign" value={choice} onChange={(e) => setChoice(e.target.value)} className="min-h-12 flex-1 rounded-xl border border-cream-300 bg-white px-3">
                <option value="">{r.agronomist ? 'Reassign to…' : 'Choose an agronomist…'}</option>
                {candidates.map((a) => <option key={a.id} value={a.id}>{a.fullName}{a.county ? ` · ${a.county}` : ''} ({a.openRequests ?? 0} open)</option>)}
              </select>
              <Button icon={UserCheck} disabled={!choice} loading={assign.isPending} onClick={() => assign.mutate({ requestId: r.id, agronomistId: choice }, { onSuccess: () => setChoice('') })}>{r.agronomist ? 'Reassign' : 'Assign'}</Button>
            </div>
          ) : <p className="text-sm text-ink-500">{r.assessment ? 'An assessment has been submitted, so this request can no longer be reassigned.' : 'This request is closed and cannot be assigned.'}</p>}
          {assign.isError && <p role="alert" className="text-sm font-medium text-danger-700">{assign.error.message}</p>}
        </Card></section>

      {options.length > 0 && (
        <section><SectionTitle>Status</SectionTitle>
          <Card className="flex flex-wrap items-center gap-2">
            <span className="text-ink-700">Move to:</span>
            {options.map((o) => <Button key={o} size="sm" variant={o === 'CANCELLED' ? 'secondary' : 'primary'} loading={status.isPending && status.variables?.status === o} onClick={() => status.mutate({ id: r.id, status: o })}>{STATUS_LABEL[o]}</Button>)}
            {status.isError && <p role="alert" className="w-full text-sm font-medium text-danger-700">{status.error.message}</p>}
          </Card></section>
      )}

      {r.assessment && <section><SectionTitle>Assessment</SectionTitle><Card><AssessmentView a={r.assessment} /></Card></section>}
      <section><SectionTitle>Timeline</SectionTitle><Card><Timeline events={r.events ?? []} /></Card></section>
    </div>
  );
}
