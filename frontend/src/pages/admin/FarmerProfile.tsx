import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useFarmer } from '@/api/hooks';
import { InsightCard, ServiceRequestCard } from '@/components/Insights';
import { InsightHistory } from '@/components/InsightHistory';
import { LazyFarmMap } from '@/components/LazyFarmMap';
import { ScoreRing } from '@/components/ScoreRing';
import { Card, EmptyState, ErrorState, LoadingState, SectionTitle } from '@/components/ui';
import { SERVICES, challengeLabel, cropLabel } from '@/lib/constants';
import { date, kg, num } from '@/lib/format';

function Facts({ rows }: { rows: [string, string | undefined | null][] }) {
  return <dl className="grid gap-x-6 sm:grid-cols-2">{rows.map(([k, v]) => <div key={k} className="flex justify-between gap-4 border-b border-cream-200 py-2 text-[0.95rem]"><dt className="text-ink-500">{k}</dt><dd className="text-right font-medium">{v || '—'}</dd></div>)}</dl>;
}

export default function FarmerProfile() {
  const { id } = useParams();
  const q = useFarmer(id);
  if (q.isLoading) return <LoadingState rows={4} />;
  if (q.isError || !q.data) return <ErrorState message="We couldn't load this farmer." onRetry={() => q.refetch()} />;
  const f = q.data, farm = f.farms[0], ins = farm?.insight;

  return (
    <div className="space-y-8">
      <Link to="/admin/farmers" className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest-700"><ArrowLeft className="size-4" aria-hidden />All farmers</Link>
      <header><h1 className="text-3xl font-bold">{f.fullName}</h1><p className="text-ink-700">{f.farmerId} · {f.county} County</p></header>

      <section><SectionTitle>Farmer information</SectionTitle>
        <Card><Facts rows={[['Name', f.fullName], ['Farmer ID', f.farmerId], ['Mobile', f.mobileNumber], ['Email', f.email], ['County', [f.region, f.county].filter(Boolean).join(', ')], ['Preferred language', f.preferredLanguage], ['Registered', date(f.createdAt)]]} /></Card></section>

      {!farm ? <EmptyState title="No farm registered" body="This farmer hasn't added a farm yet." /> : (
        <>
          <section><SectionTitle>Farm information</SectionTitle>
            <Card><Facts rows={[
              ['Farm name', farm.farmName], ['Location', farm.location], ['GPS', `${farm.latitude.toFixed(5)}, ${farm.longitude.toFixed(5)}`], ['Size', `${num(farm.sizeAcres, 2)} acres`],
              ['Crop', cropLabel(farm.primaryCrop)], ['Coffee variety', farm.coffeeVariety.join(', ')], ['Coffee trees', farm.coffeeTrees != null ? num(farm.coffeeTrees) : null],
              ['Est. annual production', kg(farm.estimatedAnnualProductionKg)], ['Last harvest', farm.lastHarvestDate ? date(farm.lastHarvestDate) : null], ['Last soil test', farm.lastSoilTestDate ? date(farm.lastSoilTestDate) : 'Unknown'],
            ]} />
              <div className="mt-4"><p className="mb-2 text-sm font-semibold text-ink-700">Challenges</p>{farm.challenges.length ? <ul className="flex flex-wrap gap-2">{farm.challenges.map((c) => <li key={c} className="rounded-full bg-earth-100 px-3 py-1 text-sm font-semibold text-earth-800">{challengeLabel(c)}</li>)}</ul> : <p className="text-ink-500">None reported</p>}</div></Card></section>

          <section><SectionTitle>Farm map</SectionTitle><LazyFarmMap lat={farm.latitude} lng={farm.longitude} height={280} /></section>

          <section><SectionTitle hint="Prototype decision-support indicator — not a validated agronomic rating.">Farm intelligence</SectionTitle>
            {ins ? (
              <div className="space-y-4">
                <div className="grid items-center gap-5 rounded-2xl bg-forest-900 p-5 text-cream-50 sm:grid-cols-[auto_1fr]">
                  <div className="mx-auto"><ScoreRing score={ins.opportunityScore} size={150} /></div>
                  <div><p className="font-display text-xl font-bold">{ins.statusLabel}</p><p className="mt-1 text-forest-100">{ins.summary}</p></div>
                </div>
                <div className="grid gap-3 lg:grid-cols-2">{ins.insights.map((i) => <InsightCard key={i.title} item={i} />)}</div>
                <div><h3 className="mb-2 text-lg font-semibold">Recommendations</h3>
                  {ins.recommendations.length ? <ul className="space-y-2">{ins.recommendations.map((r) => <li key={r.serviceType}><Card className="p-4"><p className="font-semibold">{SERVICES[r.serviceType].label}</p><p className="text-sm text-ink-700">{r.reason}</p></Card></li>)}</ul> : <p className="text-ink-500">None triggered.</p>}</div>
              </div>
            ) : <EmptyState title="No insight yet" />}
          </section>
          <section><SectionTitle hint="Stored results over time, explained from the saved data only.">Intelligence history</SectionTitle><InsightHistory farmId={farm.id} /></section>
        </>
      )}

      <section><SectionTitle>Service requests</SectionTitle>
        {f.serviceRequests.length ? <ul className="space-y-2.5">{f.serviceRequests.map((r) => <ServiceRequestCard key={r.id} r={r} href={`/admin/requests/${r.id}`} />)}</ul> : <EmptyState title="No service requests yet" />}</section>
    </div>
  );
}
