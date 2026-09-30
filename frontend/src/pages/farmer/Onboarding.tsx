import { useEffect, useRef, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import { ApiError } from '@/api/client';
import { useCreateFarm, useCreateFarmer } from '@/api/hooks';
import { Button, Card } from '@/components/ui';
import { ProgressIndicator } from '@/components/ProgressIndicator';
import { COUNTY_CENTERS } from '@/lib/constants';
import { clearDraft, loadDraft, saveDraft, useSession } from '@/lib/session';
import { STEP_FIELDS, demoValues, emptyValues, onboardingSchema, toFarmPayload, toFarmerPayload, type OnboardingValues } from '@/schemas/onboarding';
import type { Farm, Farmer } from '@/types';
import { StepChallenges, StepFarm, StepFarmer, StepLocation, StepReview } from './OnboardingSteps';

// The spec's journey: data entry is Farmer → Farm → Location → Challenges → Review. Insights come AFTER confirmation.
const STEPS = ['Farmer', 'Farm', 'Location', 'Challenges', 'Review'];
const TITLES = ['Tell us about you', 'Tell us about your farm', 'Where is your farm?', 'Your challenges', 'Review and confirm'];
const REVIEW = 4;

export default function Onboarding() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const { setFarmer, setRole } = useSession();
  const draft = useRef(loadDraft<OnboardingValues>()).current;
  const [step, setStep] = useState(params.get('demo') ? 0 : draft?.step ?? 0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const createdFarmer = useRef<Farmer | null>(null); // survives a failed farm save so a retry never registers the farmer twice
  const createFarmer = useCreateFarmer();
  const createFarm = useCreateFarm();
  const headingRef = useRef<HTMLHeadingElement>(null);

  const methods = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: params.get('demo') ? demoValues : { ...emptyValues, ...(draft?.values ?? {}) },
    mode: 'onTouched',
  });
  const { trigger, watch, setValue, getValues, setError, handleSubmit } = methods;

  // Persist the draft (low-connectivity friendly: a refresh never loses answers).
  useEffect(() => {
    const sub = watch((values) => saveDraft({ values, step }));
    return () => sub.unsubscribe();
  }, [watch, step]);
  useEffect(() => { saveDraft({ values: getValues(), step }); headingRef.current?.focus(); window.scrollTo({ top: 0 }); }, [step, getValues]);

  const goTo = (s: number) => { setSubmitError(null); setStep(s); };
  const next = async () => {
    if (!(await trigger(STEP_FIELDS[step]))) return;
    // Pre-fill the map position and place name from the chosen county so the farmer only has to fine-tune.
    if (step === 1 && !getValues('latitude')) {
      const c = COUNTY_CENTERS[getValues('county')];
      if (c) { setValue('latitude', c[0].toFixed(5)); setValue('longitude', c[1].toFixed(5)); }
      if (!getValues('location') && getValues('county')) setValue('location', `${getValues('county')} County, Kenya`);
    }
    goTo(step + 1);
  };

  const submit = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      if (!createdFarmer.current) createdFarmer.current = await createFarmer.mutateAsync(toFarmerPayload(values));
      const farmer = createdFarmer.current;
      const farm: Farm = await createFarm.mutateAsync(toFarmPayload(values, farmer.id));
      clearDraft();
      setFarmer({ farmerUuid: farmer.id, publicId: farmer.farmerId, name: farmer.fullName, farmId: farm.id });
      setRole('farmer');
      nav(`/farm/${farm.id}`, { state: { welcome: { name: farmer.fullName, farmerId: farmer.farmerId } } });
    } catch (e) {
      if (e instanceof ApiError && e.details?.length) {
        e.details.forEach((d) => setError(d.field as keyof OnboardingValues, { message: d.message }));
        const first = STEP_FIELDS.findIndex((fs) => e.details!.some((d) => fs.includes(d.field as keyof OnboardingValues)));
        if (first >= 0) setStep(first);
      }
      setSubmitError(e instanceof ApiError ? e.message : 'Something went wrong. Please try again.');
    }
  }, () => setSubmitError('Some details need fixing. Please go back and check the highlighted fields.'));

  const busy = createFarmer.isPending || createFarm.isPending;
  return (
    <div className="mx-auto max-w-2xl">
      <ProgressIndicator steps={STEPS} current={step} />
      <div className="mt-6 flex items-start justify-between gap-3">
        <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-bold outline-none sm:text-3xl">{TITLES[step]}</h1>
        {step === 0 && <Button variant="ghost" size="sm" icon={Sparkles} onClick={() => methods.reset(demoValues)} title="Prototype convenience: fills the form with the sample farmer from the brief">Fill demo data</Button>}
      </div>

      <FormProvider {...methods}>
        <form onSubmit={submit} noValidate className="mt-5" aria-label={TITLES[step]}>
          <Card className="p-4 sm:p-6">
            {step === 0 && <StepFarmer />}
            {step === 1 && <StepFarm />}
            {step === 2 && <StepLocation />}
            {step === 3 && <StepChallenges />}
            {step === REVIEW && <StepReview goTo={goTo} />}
          </Card>

          {submitError && <p role="alert" className="mt-4 rounded-xl bg-danger-100 p-3.5 font-medium text-danger-700">{submitError}</p>}
          {createdFarmer.current && step === REVIEW && submitError && <p className="mt-2 text-sm text-ink-700">Your farmer details are saved ({createdFarmer.current.farmerId}). Tapping confirm again will only retry the farm.</p>}

          <div className="sticky bottom-0 -mx-4 mt-6 flex gap-3 border-t border-cream-200 bg-cream-50/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
            {step > 0 && <Button variant="secondary" icon={ArrowLeft} onClick={() => goTo(step - 1)} disabled={busy}>Back</Button>}
            {step < REVIEW
              ? <Button className="flex-1" onClick={next}>Continue<ArrowRight className="size-4" aria-hidden /></Button>
              : <Button type="submit" className="flex-1" loading={busy} icon={CheckCircle2}>{busy ? 'Saving your farm…' : submitError ? 'Try again' : 'Confirm and create my farm profile'}</Button>}
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
