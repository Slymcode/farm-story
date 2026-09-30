import { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { HelpCircle, MapPin, PartyPopper, X } from 'lucide-react';
import { useFarm, useFarmerRequests } from '@/api/hooks';
import { ActionPlan } from '@/components/ActionPlan';
import { AskFarmStory } from '@/components/AskFarmStory';
import { InsightCard, ServiceRequestCard } from '@/components/Insights';
import { LazyFarmMap } from '@/components/LazyFarmMap';
import { RequestDialog } from '@/components/RequestDialog';
import { ScoreDialog } from '@/components/ScoreDialog';
import { ScoreRing } from '@/components/ScoreRing';
import { Button, Card, EmptyState, ErrorState, LoadingState, SectionTitle } from '@/components/ui';
import { ALL_SERVICES, PROTOTYPE_SCORE_NOTE, SERVICES, challengeLabel, cropLabel } from '@/lib/constants';
import { kg, num } from '@/lib/format';
import type { ServiceType } from '@/types';

function Stat({ value, label }: { value: string; label: string }) {
  return <div className="rounded-xl bg-white p-3.5 ring-1 ring-cream-200"><p className="font-display text-xl font-bold text-forest-900 sm:text-2xl">{value}</p><p className="text-sm text-ink-500">{label}</p></div>;
}

export default function FarmIntelligence() {
  const { farmId } = useParams();
  const { state } = useLocation() as { state?: { welcome?: { name: string; farmerId: string } } };
  const farm = useFarm(farmId);
  const requests = useFarmerRequests(farm.data?.farmerId);
  const [scoreOpen, setScoreOpen] = useState(false);
  const [requestType, setRequestType] = useState<ServiceType | null>(null);
  const [welcome, setWelcome] = useState(!!state?.welcome);

  if (farm.isLoading) return <LoadingState label="Loading your farm" rows={4} />;
  if (farm.isError || !farm.data) return <ErrorState message="We couldn't load your farm information. Please try again." onRetry={() => farm.refetch()} />;

  const f = farm.data, insight = f.insight, isCoffee = f.primaryCrop === 'COFFEE';
  const recommended = new Set(insight?.recommendations.map((r) => r.serviceType));
  const others = ALL_SERVICES.filter((s) => !recommended.has(s) && (s !== 'COFFEE_QUALITY_ASSESSMENT' || isCoffee));

  return (
    <div className="space-y-6">
      {welcome && state?.welcome && (
        <div role="status" className="flex items-start gap-3 rounded-2xl bg-forest-100 p-4 text-forest-900">
          <PartyPopper className="mt-0.5 size-6 shrink-0 text-forest-700" aria-hidden />
          <p className="flex-1"><strong>Welcome, {state.welcome.name.split(' ')[0]}.</strong> Your Farm Story ID is <strong className="font-display text-lg">{state.welcome.farmerId}</strong>. Keep it safe — you'll use it when you contact us.</p>
          <button aria-label="Dismiss" onClick={() => setWelcome(false)} className="grid size-9 place-items-center rounded-full hover:bg-forest-200"><X className="size-4" /></button>
        </div>
      )}

      <header>
        <h1 className="text-3xl font-bold sm:text-4xl">{f.farmName}</h1>
        <p className="mt-1 flex items-center gap-1.5 text-ink-700"><MapPin className="size-4 text-earth-600" aria-hidden />{f.location}</p>
      </header>

      {insight ? (
        <section aria-labelledby="opp" className="grid items-center gap-6 rounded-3xl bg-forest-900 p-6 text-cream-50 sm:grid-cols-[auto_1fr] sm:p-8">
          <div className="mx-auto"><ScoreRing score={insight.opportunityScore} /></div>
          <div>
            <p className="text-sm font-medium text-forest-200">Farm Opportunity</p>
            <h2 id="opp" className="mt-1 text-2xl font-bold !text-cream-50 sm:text-3xl">{insight.statusLabel}</h2>
            <p className="mt-2 text-forest-100">{insight.summary}</p>
            <Button variant="gold" icon={HelpCircle} className="mt-5" onClick={() => setScoreOpen(true)}>Why this score?</Button>
            <p className="mt-4 text-xs leading-relaxed text-forest-200">{PROTOTYPE_SCORE_NOTE}</p>
          </div>
        </section>
      ) : <ErrorState message="Your farm insight isn't ready yet." onRetry={() => farm.refetch()} />}

      <section aria-label="Farm snapshot">
        <SectionTitle>Farm snapshot</SectionTitle>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
          <Stat value={`${num(f.sizeAcres, 2)} acres`} label="Farm size" />
          {isCoffee && <Stat value={f.coffeeTrees != null ? num(f.coffeeTrees) : '—'} label="Coffee trees" />}
          <Stat value={kg(f.estimatedAnnualProductionKg)} label="Estimated annual production" />
          <Stat value={cropLabel(f.primaryCrop)} label="Main crop" />
          <Stat value={`${f.farmer?.county ?? ''} County`} label="Location" />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
        <div className="space-y-8">
          {insight && (
            <>
              <section>
                <SectionTitle hint="From the information you gave us.">What we noticed</SectionTitle>
                <div className="space-y-3">{insight.insights.map((i) => <InsightCard key={i.title} item={i} />)}</div>
              </section>
              <section>
                <SectionTitle hint="Your recommended next steps, in priority order. Prototype guidance — confirm important decisions with a qualified agronomist.">My Farm Action Plan</SectionTitle>
                {insight.actionPlan?.length
                  ? <ActionPlan steps={insight.actionPlan} onRequest={setRequestType} />
                  : <EmptyState title="No specific steps right now" body="Nothing was flagged from your details. You can still request any service below." />}
              </section>
            </>
          )}
          {others.length > 0 && (
            <section>
              <SectionTitle>Other services</SectionTitle>
              <ul className="grid gap-3 sm:grid-cols-2">
                {others.map((s) => { const v = SERVICES[s]; return (
                  <li key={s}><Card className="flex h-full flex-col p-4"><v.icon className="size-5 text-earth-600" aria-hidden /><h3 className="mt-2 text-base font-semibold">{v.label}</h3><p className="mb-3 mt-0.5 flex-1 text-sm text-ink-700">{v.blurb}</p><Button variant="secondary" size="sm" onClick={() => setRequestType(s)}>{v.requestLabel}</Button></Card></li>
                ); })}
              </ul>
            </section>
          )}
        </div>

        <div className="space-y-8">
          <section>
            <SectionTitle>Your farm on the map</SectionTitle>
            <LazyFarmMap lat={f.latitude} lng={f.longitude} height={240} />
            <p className="mt-2 text-sm text-ink-500">Latitude {f.latitude.toFixed(5)} · Longitude {f.longitude.toFixed(5)}</p>
          </section>
          <section>
            <SectionTitle>Challenges you reported</SectionTitle>
            {f.challenges.length ? <ul className="flex flex-wrap gap-2">{f.challenges.map((c) => <li key={c} className="rounded-full bg-earth-100 px-3.5 py-1.5 text-sm font-semibold text-earth-800">{challengeLabel(c)}</li>)}</ul> : <p className="text-ink-500">None reported.</p>}
          </section>
          <AskFarmStory farmId={f.id} />
          <section>
            <SectionTitle>Your requests</SectionTitle>
            {requests.isLoading ? <LoadingState rows={2} /> : requests.isError ? <ErrorState message="We couldn't load your requests." onRetry={() => requests.refetch()} />
              : requests.data?.items.length ? <ul className="space-y-2.5">{requests.data.items.map((r) => <ServiceRequestCard key={r.id} r={r} />)}</ul>
              : <EmptyState title="No service requests yet" body="When you request a service, you can follow its status here." />}
          </section>
        </div>
      </div>

      {insight && <ScoreDialog open={scoreOpen} onClose={() => setScoreOpen(false)} insight={insight} />}
      <RequestDialog type={requestType} farm={f} onClose={() => setRequestType(null)} />
      <p className="text-center text-sm"><Link to="/register" className="font-medium text-forest-700 underline underline-offset-2">Register another farm</Link></p>
    </div>
  );
}
