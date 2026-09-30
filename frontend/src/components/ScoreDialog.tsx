import { Dialog } from './ui';
import { PROTOTYPE_SCORE_NOTE, SERVICES } from '@/lib/constants';
import type { FarmInsight } from '@/types';

export function ScoreDialog({ open, onClose, insight }: { open: boolean; onClose: () => void; insight: FarmInsight }) {
  const b = insight.scoreBreakdown;
  return (
    <Dialog open={open} onClose={onClose} title="Why this score?" wide>
      <div className="space-y-6 text-[0.95rem] text-ink-700">
        <p className="rounded-xl bg-gold-100 p-3.5 font-medium text-earth-800"><strong>Prototype Farm Opportunity / Decision-Support Indicator.</strong> {PROTOTYPE_SCORE_NOTE}</p>
        <p>Farm Story's prototype opportunity score considers the completeness of farm information, reported challenges, production information and potential areas for intervention. It is intended for demonstration and decision support, not as a replacement for professional agronomic assessment. {b?.scoreMeaning}</p>

        {b && (
          <section>
            <h3 className="mb-2 text-base font-semibold text-forest-900">What contributed to {insight.opportunityScore} out of 100</h3>
            <ul className="space-y-3">
              {b.dimensions.map((d) => (
                <li key={d.key}>
                  <div className="flex justify-between gap-3 text-sm"><span className="font-semibold text-forest-900">{d.label}</span><span className="tabular-nums">{d.points} / {d.max}</span></div>
                  <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-cream-200" role="img" aria-label={`${d.points} of ${d.max} points`}><div className="h-full rounded-full bg-forest-600" style={{ width: `${(d.points / d.max) * 100}%` }} /></div>
                  <p className="mt-1 text-sm text-ink-500">{d.explanation}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {b && (
          <section className="grid gap-4 sm:grid-cols-2">
            <div><h3 className="mb-1.5 text-base font-semibold text-forest-900">Information we had</h3>{b.availableInformation.length ? <ul className="list-inside list-disc">{b.availableInformation.map((x) => <li key={x}>{x}</li>)}</ul> : <p className="text-ink-500">None of the tracked fields.</p>}</div>
            <div><h3 className="mb-1.5 text-base font-semibold text-forest-900">Information we didn't have</h3>{b.missingInformation.length ? <ul className="list-inside list-disc">{b.missingInformation.map((x) => <li key={x}>{x}</li>)}</ul> : <p className="text-ink-500">Nothing missing.</p>}</div>
          </section>
        )}

        <section>
          <h3 className="mb-1.5 text-base font-semibold text-forest-900">Recommendations this triggered</h3>
          {insight.recommendations.length
            ? <ul className="space-y-1.5">{insight.recommendations.map((r) => <li key={r.serviceType}><strong>{SERVICES[r.serviceType].label}</strong> — {r.reason}</li>)}</ul>
            : <p className="text-ink-500">No services were triggered from the information provided.</p>}
        </section>
        <p className="border-t border-cream-200 pt-4 text-sm text-ink-500">The score is calculated by fixed rules on our server from your answers — it does not use AI, weather, satellite or lab data. Recommendations are prototype decision-support guidance and should not replace professional agronomic assessment.</p>
      </div>
    </Dialog>
  );
}
