import { BENCHMARK_NOTE, Recommendation, ScoreBreakdown, ServiceTypeName } from './insight.types';

/**
 * Farm Action Plan: a prioritised, plain-language view of what the deterministic engine already decided.
 * It adds NO new rules. Every step maps to an engine recommendation (or to the engine's own production
 * metric), and an empty recommendation list gives an empty plan. The AI layer never writes or reorders it.
 */
export interface ActionPlanStep {
  step: number;
  title: string;
  /** The engine's own one-line description of the service (absent on the review step). */
  description?: string;
  reason: string;
  /** Present when the step can be requested through Farm Story; absent for a "review" step. */
  serviceType: ServiceTypeName | null;
  kind: 'service' | 'review';
}

const ACTION_TITLE: Record<ServiceTypeName, string> = {
  AGRONOMIST_VISIT: 'Book an agronomist visit',
  SOIL_TEST: 'Get a soil test',
  BIOCHAR_ASSESSMENT: 'Explore a biochar assessment',
  COFFEE_QUALITY_ASSESSMENT: 'Check your coffee quality',
  BUYER_OFFTAKE_SUPPORT: 'Get help reaching buyers',
};

export function buildActionPlan(insight: { recommendations?: Recommendation[] | null; scoreBreakdown?: Pick<ScoreBreakdown, 'metrics'> | null } | null | undefined): ActionPlanStep[] {
  const recs = insight?.recommendations ?? [];
  // Priority: services backed by more reported reasons come first; ties keep the engine's own order (stable sort).
  const ordered = recs.map((r, i) => ({ r, i })).sort((a, b) => (b.r.triggers?.length ?? 0) - (a.r.triggers?.length ?? 0) || a.i - b.i).map((x) => x.r);
  const steps: Omit<ActionPlanStep, 'step'>[] = ordered.map((r) => ({
    title: ACTION_TITLE[r.serviceType] ?? r.title, description: r.description, reason: r.reason, serviceType: r.serviceType, kind: 'service' as const,
  }));
  const m = insight?.scoreBreakdown?.metrics;
  if (m && (m.productionPerTreeKg != null || m.productionPerAcreKg != null)) {
    steps.push({ title: 'Review production efficiency', reason: BENCHMARK_NOTE, serviceType: null, kind: 'review' });
  }
  return steps.map((s, i) => ({ step: i + 1, ...s }));
}
