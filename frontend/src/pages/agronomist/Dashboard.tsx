import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock, CheckCircle2, ClipboardList, Hourglass } from 'lucide-react';
import { useAgronomistDashboard, useAgronomistRequests } from '@/api/hooks';
import { MetricCard } from '@/components/Insights';
import { Card, EmptyState, ErrorState, LoadingState, SectionTitle, StatusBadge, cx } from '@/components/ui';
import { SERVICES } from '@/lib/constants';
import { date } from '@/lib/format';
import { useViewingAgronomist } from '@/lib/useViewingAgronomist';

const FILTERS = [{ v: '', label: 'All' }, { v: 'ASSIGNED', label: 'Open' }, { v: 'COMPLETED', label: 'Completed' }];

export default function AgronomistDashboard() {
  const who = useViewingAgronomist();
  const [status, setStatus] = useState('');
  const dash = useAgronomistDashboard(who.id);
  const list = useAgronomistRequests(who.id, status || undefined);

  if (who.isLoading || (who.id && dash.isLoading)) return <LoadingState rows={4} />;
  if (who.isError || dash.isError) return <ErrorState message="We couldn't load the workspace." onRetry={() => { who.refetch(); dash.refetch(); }} />;
  if (!who.current || !dash.data) return <EmptyState title="No agronomists yet" body="An administrator needs to add an agronomist first." />;
  const { kpis, followUps, followUpWindowDays } = dash.data;

  return (
    <div className="space-y-8">
      <header><h1 className="text-3xl font-bold">Welcome, {who.current.fullName.split(' ')[0]}</h1><p className="text-ink-700">Your assigned farm visits and follow-ups.</p></header>

      <section aria-label="Summary" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard icon={ClipboardList} label="Assigned Requests" value={String(kpis.assignedRequests)} sub="Currently open" />
        <MetricCard icon={Hourglass} label="Pending Visits" value={String(kpis.pendingVisits)} sub="No assessment yet" />
        <MetricCard icon={CheckCircle2} label="Completed Visits" value={String(kpis.completedVisits)} />
        <MetricCard icon={CalendarClock} label="Follow-ups Due" value={String(kpis.followUpsDue)} sub={`Overdue or within ${followUpWindowDays} days`} />
      </section>

      {followUps.length > 0 && (
        <section>
          <SectionTitle hint="Follow-up visits you asked for in an assessment.">Follow-ups due</SectionTitle>
          <ul className="space-y-2.5">
            {followUps.map((f) => (
              <li key={f.id}><Card className="flex flex-wrap items-center justify-between gap-2 p-4">
                <div><Link to={`/agronomist/requests/${f.serviceRequest.id}`} className="font-semibold text-forest-800 underline underline-offset-2">{f.serviceRequest.farm.farmName}</Link><p className="text-sm text-ink-500">{f.serviceRequest.farmer.fullName} · {SERVICES[f.serviceRequest.type].label} · {f.serviceRequest.requestId}</p></div>
                <p className="rounded-full bg-gold-100 px-3 py-1 text-sm font-semibold text-earth-800">{date(f.followUpDate)}</p>
              </Card></li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <SectionTitle>Assigned requests</SectionTitle>
        <div role="group" aria-label="Filter requests" className="mb-3 flex gap-2">
          {FILTERS.map((f) => <button key={f.v} aria-pressed={status === f.v} onClick={() => setStatus(f.v)} className={cx('min-h-10 rounded-full border-2 px-4 text-sm font-semibold', status === f.v ? 'border-forest-800 bg-forest-800 text-cream-50' : 'border-cream-300 bg-white text-ink-700')}>{f.label}</button>)}
        </div>
        {list.isLoading ? <LoadingState rows={2} /> : list.isError ? <ErrorState message="We couldn't load your requests." onRetry={() => list.refetch()} />
          : !list.data?.length ? <EmptyState title="Nothing here yet" body="Requests the admin assigns to you will appear here." />
          : <ul className="space-y-2.5">{list.data.map((r) => { const s = SERVICES[r.type]; return (
            <li key={r.id}><Link to={`/agronomist/requests/${r.id}`} className="block rounded-2xl focus-visible:outline-2">
              <Card className="flex items-center gap-3 p-4 transition-colors hover:bg-cream-50">
                <s.icon className="size-6 shrink-0 text-earth-600" aria-hidden />
                <div className="min-w-0 flex-1"><p className="font-semibold text-forest-900">{s.label} <span className="font-normal text-ink-500">· {r.requestId}</span></p><p className="text-sm text-ink-700">{r.farmer?.fullName} · {r.farm?.farmName} · {r.farmer?.county}</p>{r.description && <p className="mt-0.5 truncate text-sm text-ink-500">“{r.description}”</p>}</div>
                <StatusBadge status={r.status} />
              </Card></Link></li>); })}</ul>}
      </section>
    </div>
  );
}
