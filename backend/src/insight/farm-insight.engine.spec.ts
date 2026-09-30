import { FarmInsightEngine, ENGINE_CONFIG, DISCLAIMER } from './farm-insight.engine';
import { FarmInsightInput } from './insight.types';

const NOW = new Date('2026-09-30');
const engine = new FarmInsightEngine();
const john: FarmInsightInput = {
  primaryCrop: 'COFFEE', sizeAcres: 2.5, coffeeVariety: ['SL28', 'Ruiru 11'], coffeeTrees: 1100,
  estimatedAnnualProductionKg: 1800, lastHarvestDate: null, lastSoilTestDate: null, challenges: ['LOW_YIELD'],
};
const types = (r: ReturnType<FarmInsightEngine['generate']>) => r.recommendations.map((x) => x.serviceType);

describe('FarmInsightEngine', () => {
  it('recommends an agronomist visit when low yield is reported', () => {
    const rec = engine.generate(john, NOW).recommendations.find((x) => x.serviceType === 'AGRONOMIST_VISIT');
    expect(rec?.reason).toMatch(/low yield/i);
  });
  it('recommends a soil test when no soil test is recorded', () => {
    const r = engine.generate(john, NOW);
    expect(types(r)).toContain('SOIL_TEST');
    expect(r.insights.find((i) => i.title === 'Soil information')?.description).toMatch(/no recent soil test/i);
  });
  it('does not recommend a soil test when a recent one exists', () => {
    expect(types(engine.generate({ ...john, lastSoilTestDate: new Date('2026-03-01') }, NOW))).not.toContain('SOIL_TEST');
  });
  it('treats an old soil test (older than the configured age) as not recent', () => {
    expect(types(engine.generate({ ...john, lastSoilTestDate: new Date('2024-01-01') }, NOW))).toContain('SOIL_TEST');
  });
  it('calculates production per tree and refuses to call it good or bad', () => {
    const r = engine.generate(john, NOW);
    expect(r.scoreBreakdown.metrics.productionPerTreeKg).toBe(1.6); // 1800 / 1100
    const text = r.insights.find((i) => i.title === 'Production efficiency')!.description;
    expect(text).toContain('local agronomic benchmarks');
    expect(text).not.toMatch(/\b(poor|bad|good|excellent|low|high)\b/i);
  });
  it('does not divide by zero when trees are 0 or missing', () => {
    expect(engine.generate({ ...john, coffeeTrees: 0 }, NOW).scoreBreakdown.metrics.productionPerTreeKg).toBeNull();
    expect(engine.generate({ ...john, coffeeTrees: null }, NOW).scoreBreakdown.metrics.productionPerTreeKg).toBeNull();
  });
  it('keeps the score within 0-100 and dimension weights sum to 100', () => {
    expect(Object.values(ENGINE_CONFIG.weights).reduce((a, b) => a + b, 0)).toBe(100);
    const worst = engine.generate({
      primaryCrop: 'COFFEE', sizeAcres: 1, coffeeTrees: null, coffeeVariety: [], estimatedAnnualProductionKg: null,
      challenges: ['LOW_YIELD', 'PESTS_DISEASE', 'SOIL_QUALITY', 'WATER_AVAILABILITY', 'BUYER_ACCESS', 'FINANCE_ACCESS', 'INPUT_COSTS'],
    }, NOW);
    const best = engine.generate({ ...john, challenges: [], lastHarvestDate: new Date('2026-02-01'), lastSoilTestDate: new Date('2026-03-01') }, NOW);
    for (const r of [worst, best]) {
      expect(r.opportunityScore).toBeGreaterThanOrEqual(0);
      expect(r.opportunityScore).toBeLessThanOrEqual(100);
      r.scoreBreakdown.dimensions.forEach((d) => expect(d.points).toBeLessThanOrEqual(d.max));
    }
    expect(worst.opportunityScore).toBeGreaterThan(best.opportunityScore);
  });
  it('raises the score and adds recommendations as more challenges are selected', () => {
    const one = engine.generate(john, NOW);
    const many = engine.generate({ ...john, challenges: ['LOW_YIELD', 'PESTS_DISEASE', 'SOIL_QUALITY', 'BUYER_ACCESS'] }, NOW);
    expect(many.opportunityScore).toBeGreaterThan(one.opportunityScore);
    expect(many.recommendations.length).toBeGreaterThan(one.recommendations.length);
    expect(types(many)).toEqual(expect.arrayContaining(['AGRONOMIST_VISIT', 'SOIL_TEST', 'BIOCHAR_ASSESSMENT', 'BUYER_OFFTAKE_SUPPORT', 'COFFEE_QUALITY_ASSESSMENT']));
  });
  it('merges reasons instead of duplicating a service recommendation', () => {
    expect(types(engine.generate({ ...john, challenges: ['LOW_YIELD', 'PESTS_DISEASE'] }, NOW)).filter((t) => t === 'AGRONOMIST_VISIT')).toHaveLength(1);
  });
  it('is deterministic and includes the prototype disclaimer', () => {
    expect(engine.generate(john, NOW)).toEqual(engine.generate(john, NOW));
    expect(engine.generate(john, NOW).scoreBreakdown.disclaimer).toBe(DISCLAIMER);
    expect(DISCLAIMER).toMatch(/not a scientifically validated agronomic rating/);
  });
  it('ignores coffee-only fields for other crops', () => {
    const r = engine.generate({ ...john, primaryCrop: 'MAIZE', coffeeTrees: 500 }, NOW);
    expect(r.scoreBreakdown.metrics.treesPerAcre).toBeNull();
    expect(types(r)).not.toContain('COFFEE_QUALITY_ASSESSMENT');
  });
});
