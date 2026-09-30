import { buildActionPlan } from './action-plan';
import { FarmInsightEngine, presentInsight } from './farm-insight.engine';
import { BENCHMARK_NOTE } from './insight.types';

const engine = new FarmInsightEngine();
const NOW = new Date('2026-09-30T00:00:00Z');
const farm = (o: object = {}) => ({ primaryCrop: 'COFFEE' as const, sizeAcres: 2.5, coffeeVariety: ['SL28'], coffeeTrees: 1100, estimatedAnnualProductionKg: 1800,
  lastHarvestDate: new Date('2025-12-15'), lastSoilTestDate: new Date('2026-03-01'), challenges: [] as any[], ...o });

describe('buildActionPlan', () => {
  it('mirrors the engine recommendations exactly (same services, same reasons) and adds nothing else to them', () => {
    const r = engine.generate(farm({ lastSoilTestDate: null, challenges: ['LOW_YIELD'] }), NOW);
    const plan = buildActionPlan(r);
    const services = plan.filter((s) => s.kind === 'service');
    expect(services.map((s) => s.serviceType).sort()).toEqual(r.recommendations.map((x) => x.serviceType).sort());
    services.forEach((s) => expect(s.reason).toBe(r.recommendations.find((x) => x.serviceType === s.serviceType)!.reason));
  });

  it('numbers steps from 1 and puts the production review last, with the engine benchmark note', () => {
    const r = engine.generate(farm({ lastSoilTestDate: null, challenges: ['LOW_YIELD'] }), NOW);
    const plan = buildActionPlan(r);
    expect(plan.map((s) => s.step)).toEqual(plan.map((_, i) => i + 1));
    const last = plan[plan.length - 1];
    expect(last).toMatchObject({ kind: 'review', serviceType: null, reason: BENCHMARK_NOTE });
  });

  it('invents nothing when the engine returns no recommendations and no production metric', () => {
    const r = engine.generate(farm({ estimatedAnnualProductionKg: null }), NOW); // recent soil test, no challenges
    expect(r.recommendations).toEqual([]);
    expect(buildActionPlan(r)).toEqual([]);
  });

  it('shows only one step when the engine returns one recommendation', () => {
    const r = engine.generate(farm({ estimatedAnnualProductionKg: null, challenges: ['BUYER_ACCESS'], primaryCrop: 'MAIZE', coffeeTrees: null, coffeeVariety: [] }), NOW);
    expect(r.recommendations.map((x) => x.serviceType)).toEqual(['BUYER_OFFTAKE_SUPPORT']);
    expect(buildActionPlan(r)).toHaveLength(1);
  });

  it('puts services backed by more reported reasons first, keeping engine order on ties', () => {
    const plan = buildActionPlan({ recommendations: [
      { serviceType: 'AGRONOMIST_VISIT', title: 'a', description: '', reason: 'r1', triggers: ['low_yield'] },
      { serviceType: 'SOIL_TEST', title: 's', description: '', reason: 'r2', triggers: ['no_recent_soil_test', 'soil_quality'] },
      { serviceType: 'BUYER_OFFTAKE_SUPPORT', title: 'b', description: '', reason: 'r3', triggers: ['buyer_access'] },
    ] });
    expect(plan.map((s) => s.serviceType)).toEqual(['SOIL_TEST', 'AGRONOMIST_VISIT', 'BUYER_OFFTAKE_SUPPORT']);
  });

  it('tolerates a missing insight', () => {
    expect(buildActionPlan(null)).toEqual([]);
    expect(presentInsight(null)).toBeNull();
  });

  it('presentInsight attaches the plan to a stored insight row', () => {
    const r = engine.generate(farm({ lastSoilTestDate: null }), NOW);
    const presented = presentInsight({ ...r, healthStatus: r.healthStatus })!;
    expect(presented.actionPlan[0]).toMatchObject({ step: 1, serviceType: 'SOIL_TEST', title: 'Get a soil test' });
  });
});
