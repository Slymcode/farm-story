import { Scale } from 'lucide-react';
import { Button, Card } from './ui';
import { SERVICES } from '@/lib/constants';
import type { ActionPlanStep, ServiceType } from '@/types';

/**
 * "My Farm Action Plan": a prioritised view of what the rule-based engine already recommended.
 * Nothing here is generated or changed in the browser or by AI; it renders `insight.actionPlan` as received.
 */
export function ActionPlan({ steps, onRequest }: { steps: ActionPlanStep[]; onRequest: (t: ServiceType) => void }) {
  if (!steps.length) return null;
  return (
    <ol className="space-y-3" aria-label="My Farm Action Plan">
      {steps.map((s) => {
        const svc = s.serviceType ? SERVICES[s.serviceType] : null;
        const Icon = svc?.icon ?? Scale;
        return (
          <li key={s.step}>
            <Card as="article" className="border-l-4 border-l-gold-500">
              <div className="flex items-start gap-3.5">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gold-100 font-display text-lg font-bold text-earth-700" aria-hidden>{s.step}</span>
                <div className="min-w-0 flex-1">
                  <h3 className="flex items-center gap-2 text-lg font-semibold"><span className="sr-only">Step {s.step}: </span>{s.title}<Icon className="size-4 shrink-0 text-earth-600" aria-hidden /></h3>
                  {s.description && <p className="mt-0.5 text-[0.95rem] text-ink-700">{s.description}</p>}
                  <p className="mt-2 text-sm text-ink-500"><span className="font-semibold text-ink-700">Reason: </span>{s.reason}</p>
                </div>
              </div>
              {svc && s.serviceType && <Button className="mt-4 w-full sm:w-auto" onClick={() => onRequest(s.serviceType!)}>{svc.requestLabel}</Button>}
            </Card>
          </li>
        );
      })}
    </ol>
  );
}

