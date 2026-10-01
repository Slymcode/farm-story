import { useState } from 'react';
import { Link } from 'react-router-dom';
import { exportCsv, useRequests, useUpdateRequestStatus } from '@/api/hooks';
import { ExportCsvButton } from '@/components/ExportCsvButton';
import { Card, EmptyState, ErrorState, LoadingState, StatusBadge, cx } from '@/components/ui';
import { SERVICES, STATUSES, STATUS_LABEL } from '@/lib/constants';
import { manualOptions } from '@/lib/workflow';
import { date } from '@/lib/format';
import type { RequestStatus } from '@/types';

export default function Requests() {
  const [status, setStatus] = useState('');
  const q = useRequests(status || undefined);
  const update = useUpdateRequestStatus();
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div><h1 className="text-3xl font-bold">Service requests</h1><p className="text-ink-700">Review requests from farmers and update their status.</p></div>
        <ExportCsvButton label="Export CSV" hint="Downloads the service requests matching the current status filter" run={() => exportCsv('service-requests', { status })} />
      </div>
      <div role="group" aria-label="Filter by status" className="flex flex-wrap gap-2">
        {['', ...STATUSES].map((s) => (
          <button key={s || 'all'} aria-pressed={status === s} onClick={() => setStatus(s)} className={cx('min-h-10 rounded-full border-2 px-4 text-sm font-semibold', status === s ? 'border-forest-800 bg-forest-800 text-cream-50' : 'border-cream-300 bg-white text-ink-700')}>{s ? STATUS_LABEL[s as RequestStatus] : 'All'}</button>
        ))}
      </div>
      {q.isLoading ? <LoadingState rows={4} /> : q.isError || !q.data ? <ErrorState message="We couldn't load requests." onRetry={() => q.refetch()} />
        : q.data.items.length === 0 ? <EmptyState title="No service requests yet" body={status ? 'Nothing has this status. Try another filter.' : 'Requests from farmers will appear here.'} />
        : <ul className="space-y-3">{q.data.items.map((r) => { const s = SERVICES[r.type]; return (
          <li key={r.id}><Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
            <s.icon className="size-6 shrink-0 text-earth-600" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-forest-900"><Link to={`/admin/requests/${r.id}`} className="underline-offset-2 hover:underline">{s.label}</Link> <span className="font-normal text-ink-500">· {r.requestId}</span></p>
              <p className="text-sm text-ink-700"><Link className="font-medium text-forest-700 underline underline-offset-2" to={`/admin/farmers/${r.farmerId}`}>{r.farmer?.fullName}</Link> · {r.farm?.farmName} · {r.farmer?.county} · {date(r.createdAt)}</p>
              {r.description && <p className="mt-1 text-sm text-ink-700">“{r.description}”</p>}
              <p className="mt-1 text-sm text-ink-500">Assigned to: <span className="font-medium text-ink-700">{r.agronomist?.fullName ?? 'Not assigned'}</span></p>
            </div>
            <StatusBadge status={r.status} />
            {manualOptions(r.status).length > 0 && <>
              <label className="sr-only" htmlFor={`st-${r.id}`}>Change status for {r.requestId}</label>
              <select id={`st-${r.id}`} value="" disabled={update.isPending} onChange={(e) => e.target.value && update.mutate({ id: r.id, status: e.target.value as RequestStatus })} className="min-h-10 rounded-xl border border-cream-300 bg-white px-2 text-sm">
                <option value="">Update status…</option>{manualOptions(r.status).map((x) => <option key={x} value={x}>{STATUS_LABEL[x]}</option>)}
              </select></>}
            <Link to={`/admin/requests/${r.id}`} className="inline-flex min-h-10 items-center rounded-xl border border-cream-300 bg-white px-3 text-sm font-semibold text-forest-800 hover:bg-cream-100">{r.status === 'COMPLETED' || r.status === 'CANCELLED' ? 'View' : 'Assign / view'}</Link>
          </Card></li>); })}</ul>}
      {update.isError && <p role="alert" className="text-sm font-medium text-danger-700">{update.error.message}</p>}
    </div>
  );
}
