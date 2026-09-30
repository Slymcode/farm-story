import { AiService } from './ai.service';
import { FarmInsightEngine } from '../insight/farm-insight.engine';
import { SYSTEM_PROMPT } from './ai.prompt';

const result = new FarmInsightEngine().generate({
  primaryCrop: 'COFFEE', sizeAcres: 2.5, coffeeVariety: ['SL28'], coffeeTrees: 1100, estimatedAnnualProductionKg: 1800,
  lastHarvestDate: new Date('2025-12-15'), lastSoilTestDate: null, challenges: ['LOW_YIELD'],
}, new Date('2026-09-30'));

const farmRow = {
  id: 'f1', sizeAcres: 2.5, primaryCrop: 'COFFEE', coffeeVariety: ['SL28'], coffeeTrees: 1100, estimatedAnnualProductionKg: 1800,
  lastHarvestDate: new Date('2025-12-15'), lastSoilTestDate: null, challenges: ['LOW_YIELD'],
  farmer: { fullName: 'John Mwangi', county: 'Nyeri', mobileNumber: '+254700000000', email: 'john@example.com' },
  insight: { opportunityScore: result.opportunityScore, healthStatus: result.healthStatus, insights: result.insights, recommendations: result.recommendations, scoreBreakdown: result.scoreBreakdown },
};

const make = (complete = jest.fn().mockResolvedValue('Because a soil test is missing and you reported low yield.')) => {
  const prisma: any = { farm: { findUnique: jest.fn().mockResolvedValue(farmRow) } };
  const provider: any = { isConfigured: () => true, complete };
  return { svc: new AiService(prisma, provider), complete };
};

describe('AiService context', () => {
  it('gives the model the engine score, breakdown, insights, recommendations and action plan', async () => {
    const ctx = await make().svc.buildContext('f1');
    expect(ctx.farmOpportunityScore).toBe(result.opportunityScore);
    expect(ctx.scoreBreakdown.length).toBe(5);
    expect(ctx.existingInsights.length).toBeGreaterThan(0);
    expect(ctx.recommendations.length).toBe(result.recommendations.length);
    expect(ctx.actionPlan[0]).toMatch(/^1\. /);
    expect(ctx.actionPlan.join(' ')).toContain('Get a soil test');
    expect(ctx.notAvailable).toEqual(expect.arrayContaining(['weather data', 'satellite data', 'soil lab results', 'market prices']));
  });
  it('never sends surname, phone or email to the provider', async () => {
    const { svc, complete } = make();
    await svc.ask('f1', 'Why are these my recommended next steps?');
    const sent = JSON.stringify(complete.mock.calls[0][0]);
    expect(sent).toContain('John');
    ['Mwangi', '+254700000000', 'john@example.com'].forEach((p) => expect(sent).not.toContain(p));
    expect(sent).toContain('Why are these my recommended next steps?');
  });
  it('tells the model it may not change the plan or claim a service was completed', () => {
    expect(SYSTEM_PROMPT).toMatch(/action plan/i);
    expect(SYSTEM_PROMPT).toMatch(/never say a visit, test or assessment has been booked/i);
  });
});
