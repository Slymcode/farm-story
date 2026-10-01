import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Play } from 'lucide-react';
import { api, ApiError } from '@/api/client';
import { Button } from '@/components/ui';
import { useSession } from '@/lib/session';
import type { FarmerDetail } from '@/types';

const HOW = [
  ['Tell us about your farm', 'A few short steps: you, your farm, its location and your challenges.'],
  ['See what we noticed', 'A clear opportunity score, what stands out, and why.'],
  ['Ask and take action', 'Ask questions, then request an agronomist, soil test or buyer support.'],
];

export default function Welcome() {
  const nav = useNavigate();
  const { setFarmer, setRole } = useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tryDemo = async () => {
    setBusy(true); setError(null);
    try {
      const john = await api<FarmerDetail>('/farmers/FS-KEN-000001');
      const farm = john.farms[0];
      if (!farm) throw new ApiError('The demo farmer has no farm yet.', 'NOT_FOUND', 404);
      setFarmer({ farmerUuid: john.id, publicId: john.farmerId, name: john.fullName, farmId: farm.id });
      setRole('farmer');
      nav(`/farm/${farm.id}`);
    } catch (e) {
      setError(e instanceof ApiError && e.code === 'NOT_FOUND' ? 'The demo farmer isn\'t in the database yet. Run "npm run seed" in the backend folder, then try again.' : e instanceof Error ? e.message : 'Something went wrong.');
    } finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <section className="relative overflow-hidden rounded-3xl bg-forest-900 px-6 pb-12 pt-12 text-cream-50 sm:px-12 sm:pb-16 sm:pt-16">
        <svg aria-hidden viewBox="0 0 800 200" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-32 w-full opacity-60">
          <path d="M0 140 C120 90 240 170 400 120 S680 90 800 130 V200 H0Z" fill="#1f4029" /><path d="M0 170 C160 130 300 190 460 155 S700 140 800 170 V200 H0Z" fill="#2a5636" />
        </svg>
        <div className="relative">
          <h1 className="max-w-xl text-4xl font-extrabold leading-[1.1] !text-cream-50 sm:text-5xl">Your farm has a story.</h1>
          <p className="mt-4 max-w-lg text-lg text-forest-100 sm:text-xl">Let's turn its data into better decisions.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/signup" className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-gold-400 px-6 text-lg font-bold text-forest-950 transition-colors hover:bg-gold-500">Start Farm Registration <ArrowRight className="size-5" aria-hidden /></Link>
            <Button variant="secondary" icon={Play} loading={busy} onClick={tryDemo} className="min-h-14 border-forest-700 bg-forest-800 px-6 text-lg text-cream-50 hover:bg-forest-700">Try Demo Farmer Journey</Button>
          </div>
          {error && <p role="alert" className="mt-4 rounded-xl bg-danger-100 p-3 text-sm font-medium text-danger-700">{error}</p>}
          <p className="mt-5 text-forest-100">Already have an account? <Link to="/login" className="font-semibold text-gold-400 underline underline-offset-2">Log in</Link></p>
          <p className="mt-2 text-sm text-forest-200">Prototype Demo Access — the demo opens the sample farmer, John Mwangi, without signing in.</p>
        </div>
      </section>

      <section aria-labelledby="how" className="mt-10">
        <h2 id="how" className="text-2xl font-bold">How it works</h2>
        <ol className="mt-4 grid gap-4 sm:grid-cols-3">
          {HOW.map(([t, d], i) => (
            <li key={t} className="rounded-2xl border border-cream-200 bg-white p-5">
              <span className="grid size-8 place-items-center rounded-full bg-forest-100 font-bold text-forest-800">{i + 1}</span>
              <h3 className="mt-3 text-lg font-semibold">{t}</h3><p className="mt-1 text-ink-700">{d}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
