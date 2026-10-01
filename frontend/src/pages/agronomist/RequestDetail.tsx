import { useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Phone } from 'lucide-react';
import { useAgronomistRequest, useCompleteRequest, useSubmitAssessment } from '@/api/hooks';
import { ApiError } from '@/api/client';
import { AssessmentView } from '@/components/AssessmentView';
import { TextAreaField, TextField } from '@/components/form';
import { LazyFarmMap } from '@/components/LazyFarmMap';
import { Timeline } from '@/components/Timeline';
import { Button, Card, ErrorState, LoadingState, SectionTitle, StatusBadge } from '@/components/ui';
import { SERVICES, cropLabel } from '@/lib/constants';
import { date, num } from '@/lib/format';
import { useViewingAgronomist } from '@/lib/useViewingAgronomist';
import type { Assessment } from '@/types';

const today = () => new Date().toISOString().slice(0, 10);

function AssessmentForm({ agronomistId, requestId, existing }: { agronomistId: string; requestId: string; existing?: Assessment | null }) {
  const submit = useSubmitAssessment(agronomistId, requestId);
  const [f, setF] = useState({ summary: '', observations: '', recommendedActions: '', followUpRequired: false, followUpDate: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    if (existing) setF({ summary: existing.summary, observations: existing.observations ?? '', recommendedActions: existing.recommendedActions ?? '', followUpRequired: existing.followUpRequired, followUpDate: existing.followUpDate?.slice(0, 10) ?? '' });
  }, [existing]);
  const set = (k: keyof typeof f, v: string | boolean) => { setF((s) => ({ ...s, [k]: v })); setSaved(false); };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!f.summary.trim()) err.summary = 'Please write a short assessment summary.';
    if (f.followUpRequired && !f.followUpDate) err.followUpDate = 'Please choose a follow-up date.';
    else if (f.followUpRequired && f.followUpDate < today()) err.followUpDate = 'The follow-up date cannot be in the past.';
    setErrors(err);
    if (Object.keys(err).length) return;
    submit.mutate({
      summary: f.summary.trim(), observations: f.observations.trim() || undefined, recommendedActions: f.recommendedActions.trim() || undefined,
      followUpRequired: f.followUpRequired, ...(f.followUpRequired ? { followUpDate: f.followUpDate } : {}),
    }, { onSuccess: () => setSaved(true) });
  };
  const fieldErr = submit.error instanceof ApiError ? submit.error.details?.reduce<Record<string, string>>((a, d) => ({ ...a, [d.field]: d.message }), {}) : undefined;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <TextAreaField label="Assessment summary" placeholder="What did you find during the visit?" maxLength={1000} value={f.summary} error={errors.summary ?? fieldErr?.summary} onChange={(e) => set('summary', e.target.value)} />
      <TextAreaField label="Observations" optional maxLength={2000} value={f.observations} onChange={(e) => set('observations', e.target.value)} />
      <TextAreaField label="Suggested next actions" optional hint="Practical next steps for the farmer. Confirm any treatment or input decisions with a qualified professional." maxLength={2000} value={f.recommendedActions} onChange={(e) => set('recommendedActions', e.target.value)} />
      <label className="flex min-h-11 items-center gap-3 font-semibold text-forest-900"><input type="checkbox" className="size-5 accent-[#367043]" checked={f.followUpRequired} onChange={(e) => set('followUpRequired', e.target.checked)} />A follow-up visit is needed</label>
      {f.followUpRequired && <TextField label="Follow-up date" type="date" min={today()} value={f.followUpDate} error={errors.followUpDate} onChange={(e) => set('followUpDate', e.target.value)} />}
      {submit.isError && !fieldErr && <p role="alert" className="rounded-xl bg-danger-100 p-3 font-medium text-danger-700">{submit.error.message}</p>}
      {saved && <p role="status" className="rounded-xl bg-forest-100 p-3 font-medium text-forest-900">Assessment saved. You can now complete the request.</p>}
      <Button type="submit" loading={submit.isPending}>{existing ? 'Update assessment' : 'Save assessment'}</Button>
    </form>
  );
}

export default function AgronomistRequestDetail() {
  const { id: requestId } = useParams();
  const who = useViewingAgronomist();
  const q = useAgronomistRequest(who.id, requestId);
  const complete = useCompleteRequest(who.id ?? '', requestId ?? '');

  if (who.isLoading || q.isLoading) return <LoadingState rows={4} />;
  if (q.isError || !q.data) {
    const forbidden = q.error instanceof ApiError && q.error.status === 403;
    return <div className="space-y-4"><Link to="/agronomist" className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest-700"><ArrowLeft className="size-4" aria-hidden />Back to workspace</Link>
      <ErrorState message={forbidden ? 'This request is not assigned to you.' : "We couldn't load this request."} onRetry={forbidden ? undefined : () => q.refetch()} /></div>;
  }
  const r = q.data, s = SERVICES[r.type], farm = r.farm!, farmer = r.farmer!, ins = r.insight;
  const open = r.status === 'ASSIGNED';

  return (
    <div className="space-y-8">
      <Link to="/agronomist" className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest-700"><ArrowLeft className="size-4" aria-hidden />Back to workspace</Link>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div><h1 className="text-3xl font-bold">{s.label}</h1><p className="text-ink-700">{r.requestId} · Requested {date(r.createdAt)}</p>{r.description && <p className="mt-2 text-ink-700">Farmer's note: “{r.description}”</p>}</div>
        <StatusBadge status={r.status} />
      </header>

      <section>
        <SectionTitle>Farmer and farm</SectionTitle>
        <Card className="space-y-4">
          <dl className="grid gap-x-6 sm:grid-cols-2">
            {([['Farmer', `${farmer.fullName} (${farmer.farmerId})`], ['County', farmer.county], ['Farm', farm.farmName], ['Location', farm.location], ['Main crop', cropLabel(farm.primaryCrop)], ['Size', `${num(farm.sizeAcres, 2)} acres`]] as const).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 border-b border-cream-200 py-2 text-[0.95rem]"><dt className="text-ink-500">{k}</dt><dd className="text-right font-medium">{v}</dd></div>
            ))}
          </dl>
          <a href={`tel:${farmer.mobileNumber}`} className="inline-flex min-h-11 items-center gap-2 font-semibold text-forest-800 underline underline-offset-2"><Phone className="size-4" aria-hidden />{farmer.mobileNumber}</a>
          <LazyFarmMap lat={farm.latitude} lng={farm.longitude} height={200} />
        </Card>
      </section>

      {ins && (
        <section>
          <SectionTitle hint="Prototype decision-support indicator from the farmer's own information. It is not a diagnosis.">Farm intelligence</SectionTitle>
          <Card className="space-y-3">
            <p><span className="font-display text-2xl font-bold text-forest-900">{ins.opportunityScore}</span> <span className="text-ink-700">· {ins.statusLabel}</span></p>
            <p className="text-ink-700">{ins.summary}</p>
            {ins.actionPlan?.length ? <ol className="list-decimal space-y-1.5 pl-5 text-[0.95rem]">{ins.actionPlan.map((a) => <li key={a.step}><span className="font-semibold">{a.title}</span> <span className="text-ink-500">— {a.reason}</span></li>)}</ol> : null}
          </Card>
        </section>
      )}

      <section>
        <SectionTitle>Assessment</SectionTitle>
        <Card>
          {r.status === 'COMPLETED' && r.assessment ? <AssessmentView a={r.assessment} />
            : open ? (
              <div className="space-y-6">
                <AssessmentForm agronomistId={who.id!} requestId={r.id} existing={r.assessment} />
                <div className="border-t border-cream-200 pt-4">
                  <p className="mb-2 text-sm text-ink-700">{r.assessment ? 'Happy with the assessment? Completing closes the request and notifies the farmer through the timeline.' : 'Save your assessment first. A request can only be completed once it has one.'}</p>
                  <Button variant="gold" icon={CheckCircle2} disabled={!r.assessment} loading={complete.isPending} onClick={() => complete.mutate()}>Mark request completed</Button>
                  {complete.isError && <p role="alert" className="mt-2 text-sm font-medium text-danger-700">{complete.error.message}</p>}
                </div>
              </div>
            ) : <p className="text-ink-500">This request is {r.status.toLowerCase().replace('_', ' ')}, so no assessment can be added.</p>}
        </Card>
      </section>

      <section><SectionTitle>Timeline</SectionTitle><Card><Timeline events={r.events ?? []} /></Card></section>
    </div>
  );
}
