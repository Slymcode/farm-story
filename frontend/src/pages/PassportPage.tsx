import { Link, useParams } from 'react-router-dom';
import { MapPin, Sprout, Ruler, CalendarDays, ClipboardCheck, ShieldCheck } from 'lucide-react';
import { usePassport } from '@/api/hooks';
import { PassportQr } from '@/components/PassportQr';
import { Card, ErrorState, LoadingState, Logo } from '@/components/ui';
import { cropLabel } from '@/lib/constants';
import { date, num } from '@/lib/format';
import { ApiError } from '@/api/client';

/** Public Farm Passport. No login, no private data: the API only ever returns an explicit allow-list of fields. */
export default function PassportPage() {
  const { publicId } = useParams();
  const q = usePassport(publicId);
  const p = q.data;
  const url = `${window.location.origin}/passport/${publicId}`;
  const notFound = q.error instanceof ApiError && q.error.status === 404;

  return (
    <div className="min-h-dvh bg-cream-100">
      <header className="border-b border-cream-200 bg-cream-50"><div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3"><Link to="/" aria-label="Farm Story home"><Logo /></Link><span className="text-sm font-semibold text-ink-500">Farm Passport</span></div></header>
      <main className="mx-auto max-w-2xl space-y-5 px-4 py-8">
        {q.isLoading ? <LoadingState rows={3} />
          : notFound ? <ErrorState message="This Farm Passport link isn't valid any more. The farmer may have created a new one." />
          : q.isError || !p ? <ErrorState message="We couldn't load this Farm Passport." onRetry={() => q.refetch()} />
          : (
            <>
              <Card className="space-y-5 p-6">
                <div>
                  <h1 className="text-3xl font-bold">{p.farmName}</h1>
                  <p className="mt-1 flex items-center gap-1.5 text-ink-700"><MapPin className="size-4 text-earth-600" aria-hidden />{p.county} County, {p.country}</p>
                </div>
                <dl className="grid gap-3 sm:grid-cols-2">
                  {[
                    [Sprout, 'Main crop', cropLabel(p.primaryCrop)],
                    [Ruler, 'Farm size', `${num(p.sizeAcres, 2)} acres`],
                    ...(p.coffeeVarieties.length ? [[Sprout, 'Coffee varieties', p.coffeeVarieties.join(', ')]] : []),
                    [CalendarDays, 'On Farm Story since', date(p.registeredSince)],
                    [ClipboardCheck, 'Completed agronomist-supported visits', String(p.completedVisits)],
                  ].map(([Icon, k, v]: any) => (
                    <div key={k} className="flex items-start gap-3 rounded-xl bg-white p-3.5 ring-1 ring-cream-200"><Icon className="mt-0.5 size-5 shrink-0 text-earth-600" aria-hidden /><div><dt className="text-sm text-ink-500">{k}</dt><dd className="font-semibold text-forest-900">{v}</dd></div></div>
                  ))}
                </dl>
              </Card>
              <Card className="flex flex-col items-center gap-4 sm:flex-row">
                <PassportQr url={url} size={132} />
                <div className="text-center sm:text-left">
                  <p className="flex items-center justify-center gap-1.5 font-semibold text-forest-900 sm:justify-start"><ShieldCheck className="size-5 text-forest-700" aria-hidden />Privacy-safe by design</p>
                  <p className="mt-1 text-sm text-ink-700">{p.notice}</p>
                  <p className="mt-1 text-sm text-ink-500">Contact details, exact location and private farm insights are never shown here.</p>
                </div>
              </Card>
            </>
          )}
      </main>
    </div>
  );
}
