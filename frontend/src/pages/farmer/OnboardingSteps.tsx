import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Check, Crosshair, Pencil } from 'lucide-react';
import { Button, Card, cx } from '@/components/ui';
import { SelectField, TextField } from '@/components/form';
import { LazyFarmMap } from '@/components/LazyFarmMap';
import { CHALLENGES, COFFEE_VARIETIES, COUNTIES, CROPS, LANGUAGES, cropLabel, challengeLabel } from '@/lib/constants';
import { num } from '@/lib/format';
import type { Challenge, Crop } from '@/types';
import type { OnboardingValues } from '@/schemas/onboarding';

const useF = () => useFormContext<OnboardingValues>();

export function StepFarmer() {
  const { register, formState: { errors } } = useF();
  return (
    <div className="space-y-5">
      <TextField label="Full name" autoComplete="name" placeholder="e.g. John Mwangi" error={errors.fullName?.message} {...register('fullName')} />
      <TextField label="Mobile number" type="tel" inputMode="tel" autoComplete="tel" placeholder="0712 345 678" hint="We use this to reach you about your requests." error={errors.mobileNumber?.message} {...register('mobileNumber')} />
      <TextField label="Email" type="email" inputMode="email" autoComplete="email" optional error={errors.email?.message} {...register('email')} />
      <SelectField label="County" options={COUNTIES} placeholder="Choose your county" error={errors.county?.message} {...register('county')} />
      <TextField label="Region or sub-county" optional placeholder="e.g. Mathira" {...register('region')} />
      <SelectField label="Preferred language" options={LANGUAGES} error={errors.preferredLanguage?.message} {...register('preferredLanguage')} />
    </div>
  );
}

export function StepFarm() {
  const { register, watch, setValue, formState: { errors } } = useF();
  const crop = watch('primaryCrop'), varieties = watch('coffeeVariety');
  const toggleVariety = (v: string) => setValue('coffeeVariety', varieties.includes(v) ? varieties.filter((x) => x !== v) : [...varieties, v], { shouldDirty: true });
  return (
    <div className="space-y-5">
      <TextField label="Farm name" placeholder="e.g. John's Coffee Farm" error={errors.farmName?.message} {...register('farmName')} />
      <TextField label="Farm size (acres)" type="number" inputMode="decimal" step="any" min="0" placeholder="2.5" error={errors.sizeAcres?.message} {...register('sizeAcres')} />
      <fieldset>
        <legend className="mb-1.5 text-[0.95rem] font-semibold text-forest-900">Main crop</legend>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
          {CROPS.map(({ value, label, icon: Icon }) => {
            const on = crop === value;
            return (
              <button key={value} type="button" aria-pressed={on} onClick={() => setValue('primaryCrop', value, { shouldValidate: true, shouldDirty: true })}
                className={cx('flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl border-2 px-2 font-semibold transition-colors', on ? 'border-forest-700 bg-forest-50 text-forest-900' : 'border-cream-300 bg-white text-ink-700 hover:border-forest-500')}>
                <Icon className="size-5" aria-hidden />{label}
              </button>
            );
          })}
        </div>
        {errors.primaryCrop && <p role="alert" className="mt-1.5 text-sm font-medium text-danger-700">{errors.primaryCrop.message}</p>}
      </fieldset>

      {crop === 'COFFEE' && (
        <div className="space-y-5 rounded-2xl border border-forest-200 bg-forest-50 p-4">
          <p className="font-display font-semibold text-forest-900">Coffee details</p>
          <fieldset>
            <legend className="mb-1.5 text-[0.95rem] font-semibold text-forest-900">Coffee variety <span className="font-normal text-ink-500">(choose all that apply)</span></legend>
            <div className="flex flex-wrap gap-2">
              {COFFEE_VARIETIES.map((v) => {
                const on = varieties.includes(v);
                return <button key={v} type="button" aria-pressed={on} onClick={() => toggleVariety(v)} className={cx('min-h-11 rounded-full border-2 px-4 font-medium', on ? 'border-forest-700 bg-forest-700 text-cream-50' : 'border-cream-300 bg-white text-ink-700')}>{v}</button>;
              })}
            </div>
          </fieldset>
          <TextField label="Number of coffee trees" type="number" inputMode="numeric" min="0" placeholder="1100" optional error={errors.coffeeTrees?.message} {...register('coffeeTrees')} />
        </div>
      )}

      <TextField label={crop === 'COFFEE' ? 'Estimated annual production (kg of cherry)' : 'Estimated annual production (kg)'} type="number" inputMode="decimal" step="any" min="0" placeholder="1800" optional error={errors.estimatedAnnualProductionKg?.message} {...register('estimatedAnnualProductionKg')} />
      <TextField label="Last harvest date" type="date" optional hint="Leave blank if you're not sure." {...register('lastHarvestDate')} />
      <TextField label="Last soil test date" type="date" optional hint="Leave blank if you have never tested or don't know." {...register('lastSoilTestDate')} />
    </div>
  );
}

export function StepLocation() {
  const { register, watch, setValue, formState: { errors } } = useF();
  const [geoMsg, setGeoMsg] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const latS = watch('latitude'), lngS = watch('longitude');
  const lat = Number(latS), lng = Number(lngS);
  const hasPoint = latS !== '' && lngS !== '' && Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
  const set = (la: number, ln: number) => { setValue('latitude', la.toFixed(5), { shouldValidate: true, shouldDirty: true }); setValue('longitude', ln.toFixed(5), { shouldValidate: true, shouldDirty: true }); };

  const locate = () => {
    setGeoMsg(null);
    if (!('geolocation' in navigator)) return setGeoMsg("Your browser can't share its location. Tap the map or type the coordinates instead.");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => { set(p.coords.latitude, p.coords.longitude); setLocating(false); },
      (e) => { setLocating(false); setGeoMsg(e.code === e.PERMISSION_DENIED ? 'Location permission was denied. No problem — tap the map or type the coordinates instead.' : "We couldn't get your location. Tap the map or type the coordinates instead."); },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <div className="space-y-5">
      <TextField label="Where is the farm?" placeholder="e.g. Mathira, Nyeri County" error={errors.location?.message} {...register('location')} />
      <div>
        <p className="mb-1.5 text-[0.95rem] font-semibold text-forest-900">Pin your farm</p>
        <p className="mb-3 text-sm text-ink-500">Tap the map or drag the marker to your farm. You can also use your phone's location or type coordinates.</p>
        <LazyFarmMap lat={hasPoint ? lat : undefined} lng={hasPoint ? lng : undefined} onChange={set} height={300} label="Choose farm location on the map" />
      </div>
      <Button variant="secondary" icon={Crosshair} onClick={locate} loading={locating} className="w-full sm:w-auto">Use my current location</Button>
      {geoMsg && <p role="status" className="rounded-xl bg-gold-100 p-3 text-sm text-earth-800">{geoMsg}</p>}
      <div className="grid grid-cols-2 gap-3">
        <TextField label="Latitude" inputMode="decimal" placeholder="-0.4201" error={errors.latitude?.message} {...register('latitude')} />
        <TextField label="Longitude" inputMode="decimal" placeholder="36.9476" error={errors.longitude?.message} {...register('longitude')} />
      </div>
    </div>
  );
}

export function StepChallenges() {
  const { watch, setValue } = useF();
  const selected = watch('challenges') as Challenge[];
  const toggle = (c: Challenge) => setValue('challenges', selected.includes(c) ? selected.filter((x) => x !== c) : [...selected, c], { shouldDirty: true });
  return (
    <fieldset>
      <legend className="mb-1 text-lg font-semibold text-forest-900">What are you struggling with right now?</legend>
      <p className="mb-4 text-sm text-ink-500">Choose all that apply. It's fine to choose none.</p>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {CHALLENGES.map(({ value, label, icon: Icon }) => {
          const on = selected.includes(value);
          return (
            <button key={value} type="button" aria-pressed={on} onClick={() => toggle(value)}
              className={cx('flex min-h-16 items-center gap-3 rounded-xl border-2 px-4 text-left font-semibold transition-colors', on ? 'border-forest-700 bg-forest-50 text-forest-900' : 'border-cream-300 bg-white text-ink-700 hover:border-forest-500')}>
              <span className={cx('grid size-10 shrink-0 place-items-center rounded-lg', on ? 'bg-forest-700 text-cream-50' : 'bg-cream-100 text-earth-700')}><Icon className="size-5" aria-hidden /></span>
              <span className="flex-1">{label}</span>
              {on && <Check className="size-5 text-forest-700" aria-label="Selected" />}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function Row({ k, val }: { k: string; val?: string }) {
  return <div className="flex justify-between gap-4 py-1.5 text-[0.95rem]"><dt className="text-ink-500">{k}</dt><dd className="text-right font-medium text-ink-900">{val || '—'}</dd></div>;
}
function Block({ title, step, goTo, children }: { title: string; step: number; goTo: (s: number) => void; children: React.ReactNode }) {
  return (
    <Card>
      <div className="mb-1 flex items-center justify-between"><h3 className="text-lg font-semibold">{title}</h3><Button variant="ghost" size="sm" icon={Pencil} onClick={() => goTo(step)}>Edit</Button></div>
      <dl className="divide-y divide-cream-200">{children}</dl>
    </Card>
  );
}

export function StepReview({ goTo }: { goTo: (s: number) => void }) {
  const { getValues } = useF();
  const v = getValues();
  return (
    <div className="space-y-4">
      <p className="text-ink-700">Please check your details. Nothing is saved until you confirm.</p>
      <Block title="Farmer" step={0} goTo={goTo}>
        <Row k="Name" val={v.fullName} /><Row k="Mobile" val={v.mobileNumber} /><Row k="Email" val={v.email} />
        <Row k="County" val={[v.region, v.county].filter(Boolean).join(', ')} /><Row k="Language" val={v.preferredLanguage} />
      </Block>
      <Block title="Farm" step={1} goTo={goTo}>
        <Row k="Farm name" val={v.farmName} /><Row k="Size" val={`${num(Number(v.sizeAcres), 2)} acres`} /><Row k="Main crop" val={cropLabel(v.primaryCrop as Crop)} />
        {v.primaryCrop === 'COFFEE' && <><Row k="Varieties" val={v.coffeeVariety.join(', ')} /><Row k="Coffee trees" val={v.coffeeTrees ? num(Number(v.coffeeTrees)) : ''} /></>}
        <Row k="Est. annual production" val={v.estimatedAnnualProductionKg ? `${num(Number(v.estimatedAnnualProductionKg))} kg` : ''} />
        <Row k="Last harvest" val={v.lastHarvestDate} /><Row k="Last soil test" val={v.lastSoilTestDate || 'Not known'} />
      </Block>
      <Block title="Location" step={2} goTo={goTo}><Row k="Place" val={v.location} /><Row k="Latitude" val={v.latitude} /><Row k="Longitude" val={v.longitude} /></Block>
      <Block title="Challenges" step={3} goTo={goTo}>
        <div className="py-2">{v.challenges.length ? <ul className="flex flex-wrap gap-2">{v.challenges.map((c) => <li key={c} className="rounded-full bg-forest-50 px-3 py-1 text-sm font-medium text-forest-800">{challengeLabel(c as Challenge)}</li>)}</ul> : <span className="text-ink-500">None selected</span>}</div>
      </Block>
    </div>
  );
}
