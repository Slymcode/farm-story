import { Link } from 'react-router-dom';
import { ClipboardList, Coffee, LandPlot, Users } from 'lucide-react';
import { useLocations, useOutstanding, useSummary } from '@/api/hooks';
import { MetricCard, ServiceRequestCard } from '@/components/Insights';
import { LazyFarmMap } from '@/components/LazyFarmMap';
import { Card, EmptyState, ErrorState, LoadingState, SectionTitle } from '@/components/ui';
import { num } from '@/lib/format';

export default function Dashboard() {
  const summary = useSummary(), loc = useLocations(), out = useOutstanding();
  const s = summary.data;
  const max = Math.max(1, ...(loc.data?.counties.map((c) => c.farmers) ?? [1]));
  return (
    <div className="space-y-8">
      <div><h1 className="text-3xl font-bold">Farm Story</h1><p className="text-ink-700">Administrator Dashboard — live from the database.</p></div>

      {summary.isLoading ? <LoadingState rows={2} /> : summary.isError || !s ? <ErrorState message="We couldn't load the dashboard numbers." onRetry={() => summary.refetch()} /> : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricCard icon={Users} label="Farmers Onboarded" value={num(s.farmersOnboarded)} sub={`${num(s.farms)} farms`} />
          <MetricCard icon={LandPlot} label="Total Acres" value={num(s.totalAcres, 1)} />
          <MetricCard icon={Coffee} label="Est. Annual Coffee Production" value={`${num(s.estimatedAnnualCoffeeProductionKg)} kg`} sub="Farmer estimates" />
          <MetricCard icon={ClipboardList} label="Service Requests" value={num(s.serviceRequests)} sub={`${num(s.outstandingRequests)} outstanding`} />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <SectionTitle hint="Number of registered farmers per county.">Farmers by location</SectionTitle>
          <Card>
            {loc.isLoading ? <LoadingState rows={3} /> : loc.isError || !loc.data ? <ErrorState onRetry={() => loc.refetch()} />
              : loc.data.counties.length === 0 ? <EmptyState title="No farmers yet" body="Farmers appear here once they register." />
              : <ul className="space-y-3">{loc.data.counties.map((c) => (
                <li key={c.county}>
                  <div className="flex justify-between text-sm"><span className="font-semibold text-forest-900">{c.county}</span><span className="tabular-nums text-ink-700">{c.farmers} {c.farmers === 1 ? 'farmer' : 'farmers'} · {num(c.acres, 1)} acres</span></div>
                  <div className="mt-1 h-3 overflow-hidden rounded-full bg-cream-200"><div className="h-full rounded-full bg-forest-600" style={{ width: `${(c.farmers / max) * 100}%` }} /></div>
                </li>))}</ul>}
          </Card>
        </section>
        <section>
          <SectionTitle hint="Each pin is a registered farm.">Farm map</SectionTitle>
          {loc.data ? <LazyFarmMap height={300} label="Map of registered farms" markers={loc.data.markers.map((m) => ({ id: m.farmId, lat: m.latitude, lng: m.longitude, title: m.farmName, subtitle: `${m.farmerName} · ${m.county}`, href: `/admin/farmers/${m.farmerId}` }))} /> : <LoadingState rows={1} />}
        </section>
      </div>

      <section>
        <SectionTitle action={<Link to="/admin/requests" className="text-sm font-semibold text-forest-700 underline underline-offset-2">All requests</Link>} hint="Pending, in review or assigned.">Outstanding service requests</SectionTitle>
        {out.isLoading ? <LoadingState rows={3} /> : out.isError ? <ErrorState onRetry={() => out.refetch()} />
          : out.data?.items.length ? <ul className="grid gap-2.5 lg:grid-cols-2">{out.data.items.slice(0, 6).map((r) => <ServiceRequestCard key={r.id} r={r} showFarmer />)}</ul>
          : <EmptyState title="No outstanding requests" body="New requests from farmers appear here." />}
      </section>
    </div>
  );
}
