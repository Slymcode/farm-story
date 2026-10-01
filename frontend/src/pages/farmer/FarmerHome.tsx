import { Link } from 'react-router-dom';
import { ClipboardList, MapPin, MessageCircle, Sparkles, Target } from 'lucide-react';
import { useFarm, useFarmerRequests } from '@/api/hooks';
import { useAuth } from '@/auth/AuthContext';
import { Card, ErrorState, LoadingState, SectionTitle } from '@/components/ui';
import { PROTOTYPE_SCORE_NOTE, cropLabel } from '@/lib/constants';
import { num } from '@/lib/format';

function Stat({ value, label }: { value: string; label: string }) {
  return <div className="rounded-xl bg-white p-3.5 ring-1 ring-cream-200"><p className="font-display text-xl font-bold text-forest-900 sm:text-2xl">{value}</p><p className="text-sm text-ink-500">{label}</p></div>;
}
const act = 'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 text-base font-semibold transition-colors';

/** Lightweight farmer dashboard: who, which farm, the engine's current summary, and four ways forward. */
export default function FarmerHome() {
  const { user } = useAuth();
  const farm = useFarm(user?.farmer?.farmId ?? undefined);
  const requests = useFarmerRequests(user?.farmer?.id);
  const first = user?.name.split(' ')[0] ?? '';

  if (!user?.farmer?.farmId) return <ErrorState message="We couldn't find your farm yet. Please finish setting up your farm." />;
  if (farm.isLoading) return <LoadingState label="Loading your farm" rows={3} />;
  if (farm.isError || !farm.data) return <ErrorState message="We couldn't load your farm. Please try again." onRetry={() => farm.refetch()} />;
  const f = farm.data, i = f.insight;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold sm:text-4xl">Welcome back, {first}</h1>
        <p className="mt-1 text-ink-700">Here's where your farm stands today.</p>
      </header>

      <section aria-label="My farm">
        <SectionTitle>{f.farmName}</SectionTitle>
        <p className="-mt-2 mb-3 flex items-center gap-1.5 text-ink-700"><MapPin className="size-4 text-earth-600" aria-hidden />{f.location}</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Stat value={`${num(f.sizeAcres, 2)} acres`} label="Farm size" />
          <Stat value={cropLabel(f.primaryCrop)} label="Primary crop" />
          <Stat value={f.farmer?.county ? `${f.farmer.county} County` : '—'} label="County" />
        </div>
      </section>

      <section aria-label="Farm Intelligence">
        <SectionTitle hint="Calculated by Farm Story's rule-based engine from the details you gave us.">Farm Intelligence</SectionTitle>
        {i ? (
          <Card className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
            <div className="text-center sm:px-4"><p className="font-display text-5xl font-extrabold text-forest-900">{i.opportunityScore}</p><p className="text-sm text-ink-500">out of 100</p></div>
            <div>
              <p className="text-lg font-semibold text-forest-900">{i.statusLabel}</p>
              <p className="mt-1 text-ink-700">{i.summary}</p>
              <p className="mt-2 text-sm font-medium text-ink-700">{i.recommendations.length === 0 ? 'No recommended next steps right now.' : `${i.recommendations.length} recommended next ${i.recommendations.length === 1 ? 'step' : 'steps'}`}</p>
              <p className="mt-2 text-xs text-ink-500">{PROTOTYPE_SCORE_NOTE}</p>
            </div>
          </Card>
        ) : <ErrorState message="Your farm insight isn't ready yet." onRetry={() => farm.refetch()} />}
      </section>

      <section aria-label="What would you like to do?">
        <SectionTitle>What would you like to do?</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link to="/farmer/intelligence" className={`${act} bg-forest-800 text-cream-50 hover:bg-forest-700`}><Sparkles className="size-5" aria-hidden />View Farm Intelligence</Link>
          <Link to="/farmer/actions" className={`${act} bg-gold-400 text-forest-950 hover:bg-gold-500`}><Target className="size-5" aria-hidden />Take Action</Link>
          <Link to="/farmer/ask" className={`${act} border border-cream-300 bg-white text-forest-900 hover:bg-cream-100`}><MessageCircle className="size-5" aria-hidden />Ask Farm Story AI</Link>
          <Link to="/farmer/requests" className={`${act} border border-cream-300 bg-white text-forest-900 hover:bg-cream-100`}><ClipboardList className="size-5" aria-hidden />View Service Requests{requests.data ? ` (${requests.data.total})` : ''}</Link>
        </div>
      </section>
    </div>
  );
}

