import { Injectable } from '@nestjs/common';
import {
  BENCHMARK_NOTE, ChallengeName, FarmInsightInput, FarmInsightResult, HealthStatusName, InsightItem, Recommendation, ScoreDimension, ServiceTypeName,
} from './insight.types';
import { buildActionPlan } from './action-plan';

/* -------------------------------------------------------------------------------------------
 * FARM INSIGHT ENGINE — deterministic, explainable, easy to change.
 *
 * The score is a PROTOTYPE decision-support indicator of "how many areas could benefit from
 * support" (higher = more opportunity for improvement). It is NOT an agronomic rating and the
 * generative AI layer never touches it. Every number below lives in ENGINE_CONFIG.
 * ----------------------------------------------------------------------------------------- */

export const ENGINE_VERSION = '1.0';

export const DISCLAIMER =
  'This prototype score is a decision-support indicator generated from the information provided by the farmer. ' +
  'It is not a scientifically validated agronomic rating. Recommendations are prototype guidance and should not ' +
  'replace professional agronomic assessment.';

export const ENGINE_CONFIG = {
  /** Maximum points per dimension; they sum to 100. */
  weights: { production: 25, challenges: 25, completeness: 15, farmInfo: 15, intervention: 20 },
  /** Opportunity points per reported challenge (summed, capped at weights.challenges). */
  challengePoints: {
    LOW_YIELD: 8, PESTS_DISEASE: 7, SOIL_QUALITY: 6, WATER_AVAILABILITY: 6, BUYER_ACCESS: 5, FINANCE_ACCESS: 5, INPUT_COSTS: 4,
  } as Record<ChallengeName, number>,
  production: { missing: 25, noHarvestDate: 15, complete: 10 },
  farmInfo: { baseline: 6, perMissingCoffeeItem: 5 },
  interventionPointsPerService: 5,
  /** A soil test older than this is treated as "not recent" (a prototype rule, not an agronomic standard). */
  soilTestMaxAgeMonths: 24,
  /** score <= strongMax → STRONG_POSITION; score >= highMin → HIGH_OPPORTUNITY; otherwise MODERATE. */
  thresholds: { strongMax: 34, highMin: 65 },
};

const CHALLENGE_LABELS: Record<ChallengeName, string> = {
  LOW_YIELD: 'Low yield', PESTS_DISEASE: 'Pests / disease', SOIL_QUALITY: 'Soil quality', WATER_AVAILABILITY: 'Water availability',
  BUYER_ACCESS: 'Access to buyers', FINANCE_ACCESS: 'Access to finance', INPUT_COSTS: 'Input costs',
};

const SERVICE_META: Record<ServiceTypeName, { title: string; description: string }> = {
  AGRONOMIST_VISIT: { title: 'Agronomist assessment', description: 'A qualified agronomist reviews your farm and helps you decide what to do next.' },
  SOIL_TEST: { title: 'Soil testing', description: 'A soil test may help identify nutrient or soil-condition limitations.' },
  BIOCHAR_ASSESSMENT: { title: 'Biochar assessment', description: 'An assessment of whether biochar could be worth considering for your soil.' },
  COFFEE_QUALITY_ASSESSMENT: { title: 'Coffee quality assessment', description: 'A review of your coffee quality to understand how it may be viewed by buyers.' },
  BUYER_OFFTAKE_SUPPORT: { title: 'Buyer and offtake support', description: 'Help connecting with buyers for your harvest.' },
};
const SERVICE_ORDER: ServiceTypeName[] = ['AGRONOMIST_VISIT', 'SOIL_TEST', 'BIOCHAR_ASSESSMENT', 'COFFEE_QUALITY_ASSESSMENT', 'BUYER_OFFTAKE_SUPPORT'];


export const STATUS_LABELS: Record<HealthStatusName, string> = {
  STRONG_POSITION: 'Lower opportunity — few gaps identified',
  MODERATE_OPPORTUNITY: 'Moderate opportunity for improvement',
  HIGH_OPPORTUNITY: 'High opportunity for improvement',
};

const round1 = (n: number) => Math.round(n * 10) / 10;
const fmt = (n: number) => n.toLocaleString('en-US');
function monthsBetween(from: Date, to: Date) { return (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth()); }

@Injectable()
export class FarmInsightEngine {
  generate(input: FarmInsightInput, now: Date = new Date()): FarmInsightResult {
    const cfg = ENGINE_CONFIG;
    const isCoffee = input.primaryCrop === 'COFFEE';
    const challenges = Array.from(new Set(input.challenges ?? []));
    const trees = isCoffee ? input.coffeeTrees ?? null : null;
    const varieties = isCoffee ? input.coffeeVariety ?? [] : [];
    const production = input.estimatedAnnualProductionKg ?? null;
    const soilTestRecent = !!input.lastSoilTestDate && monthsBetween(input.lastSoilTestDate, now) <= cfg.soilTestMaxAgeMonths;

    // ---- Metrics (informational only — never labelled good or bad) ----
    const productionPerTreeKg = production != null && trees && trees > 0 ? round1(production / trees) : null;
    const treesPerAcre = trees != null && input.sizeAcres > 0 ? Math.round(trees / input.sizeAcres) : null;
    const productionPerAcreKg = production != null && input.sizeAcres > 0 ? Math.round(production / input.sizeAcres) : null;

    // ---- Recommendations (rules) ----
    const recs = new Map<ServiceTypeName, { reasons: string[]; triggers: string[] }>();
    const fire = (service: ServiceTypeName, trigger: string, reason: string) => {
      const entry = recs.get(service) ?? { reasons: [], triggers: [] };
      entry.triggers.push(trigger); entry.reasons.push(reason); recs.set(service, entry);
    };
    const has = (c: ChallengeName) => challenges.includes(c);

    if (!soilTestRecent) {
      fire('SOIL_TEST', 'no_recent_soil_test', input.lastSoilTestDate ? 'The last recorded soil test is not recent.' : 'No recent soil test is available.');
    }
    if (has('LOW_YIELD')) fire('AGRONOMIST_VISIT', 'low_yield', 'Low yield was reported as a challenge.');
    if (has('PESTS_DISEASE')) fire('AGRONOMIST_VISIT', 'pests_disease', 'Pests or disease were reported; a professional should diagnose before any treatment.');
    if (has('WATER_AVAILABILITY')) fire('AGRONOMIST_VISIT', 'water_availability', 'Water availability was reported as a challenge.');
    if (has('SOIL_QUALITY')) {
      fire('SOIL_TEST', 'soil_quality', 'Soil quality was reported as a challenge.');
      fire('BIOCHAR_ASSESSMENT', 'soil_quality', 'Soil quality was reported as a challenge, so soil-improvement options may be worth assessing.');
    }
    if (has('INPUT_COSTS')) fire('SOIL_TEST', 'input_costs', 'Knowing your soil may help you focus on the inputs you actually need.');
    if (has('BUYER_ACCESS')) {
      fire('BUYER_OFFTAKE_SUPPORT', 'buyer_access', 'Access to buyers was reported as a challenge.');
      if (isCoffee) fire('COFFEE_QUALITY_ASSESSMENT', 'buyer_access_coffee', 'Understanding your coffee quality can help when talking to buyers.');
    }

    const recommendations: Recommendation[] = SERVICE_ORDER.filter((s) => recs.has(s)).map((s) => ({
      title: SERVICE_META[s].title, description: SERVICE_META[s].description,
      reason: recs.get(s)!.reasons.join(' '), serviceType: s, triggers: Array.from(new Set(recs.get(s)!.triggers)),
    }));

    // ---- Insights ("what we noticed") ----
    const insights: InsightItem[] = [];
    if (productionPerTreeKg != null) {
      insights.push({ category: 'metric', title: 'Production efficiency', description: `About ${productionPerTreeKg} kg per tree (${fmt(production!)} kg from ${fmt(trees!)} trees). ${BENCHMARK_NOTE}` });
    } else if (productionPerAcreKg != null) {
      insights.push({ category: 'metric', title: 'Production per acre', description: `About ${fmt(productionPerAcreKg)} kg per acre. ${BENCHMARK_NOTE}` });
    } else {
      insights.push({ category: 'gap', title: 'Production information', description: 'No estimated annual production is recorded, so production efficiency cannot be reviewed yet.' });
    }
    if (treesPerAcre != null) {
      insights.push({ category: 'metric', title: 'Tree density', description: `About ${fmt(treesPerAcre)} trees per acre. Spacing and variety suitability are best reviewed by an agronomist.` });
    }
    insights.push(soilTestRecent
      ? { category: 'info', title: 'Soil information', description: 'A recent soil test is on record.' }
      : { category: 'gap', title: 'Soil information', description: input.lastSoilTestDate
          ? 'The last recorded soil test is not recent. Soil testing may help identify nutrient or soil-condition limitations.'
          : 'No recent soil test is recorded. Soil testing may help identify nutrient or soil-condition limitations.' });
    if (!input.lastHarvestDate) {
      insights.push({ category: 'gap', title: 'Harvest records', description: 'No last harvest date is recorded. Keeping harvest records helps track how your farm changes from season to season.' });
    }
    if (challenges.length) {
      insights.push({ category: 'challenge', title: 'Reported challenges', description: `You reported ${challenges.length === 1 ? 'one challenge' : `${challenges.length} challenges`}: ${challenges.map((c) => CHALLENGE_LABELS[c]).join(', ')}.` });
    } else {
      insights.push({ category: 'info', title: 'Reported challenges', description: 'No challenges were reported.' });
    }
    if (has('FINANCE_ACCESS')) {
      insights.push({ category: 'challenge', title: 'Access to finance', description: 'Farm Story does not offer a finance service in this prototype. Recording your farm details here can help when discussing options with lenders or cooperatives.' });
    }

    // ---- Score ----
    const w = cfg.weights;
    const productionPts = production == null ? cfg.production.missing : input.lastHarvestDate ? cfg.production.complete : cfg.production.noHarvestDate;
    const challengePts = Math.min(w.challenges, challenges.reduce((s, c) => s + cfg.challengePoints[c], 0));

    const tracked: { label: string; present: boolean }[] = [
      { label: 'Soil test date', present: !!input.lastSoilTestDate },
      { label: 'Last harvest date', present: !!input.lastHarvestDate },
      { label: 'Estimated annual production', present: production != null },
    ];
    if (isCoffee) tracked.push({ label: 'Number of coffee trees', present: trees != null }, { label: 'Coffee variety', present: varieties.length > 0 });
    const missing = tracked.filter((t) => !t.present);
    const completenessPts = Math.round((missing.length / tracked.length) * w.completeness);

    const missingCoffeeItems = isCoffee ? Number(trees == null) + Number(varieties.length === 0) : 0;
    const farmInfoPts = Math.min(w.farmInfo, cfg.farmInfo.baseline + missingCoffeeItems * cfg.farmInfo.perMissingCoffeeItem);
    const interventionPts = Math.min(w.intervention, recommendations.length * cfg.interventionPointsPerService);

    const dimensions: ScoreDimension[] = [
      { key: 'production', label: 'Production information', max: w.production, points: productionPts,
        explanation: production == null ? 'No production estimate was provided.' : input.lastHarvestDate ? 'Production estimate and harvest date provided; results should still be compared with local benchmarks.' : 'Production estimate provided, but no harvest date.' },
      { key: 'challenges', label: 'Reported challenges', max: w.challenges, points: challengePts,
        explanation: challenges.length ? `${challenges.length} reported: ${challenges.map((c) => CHALLENGE_LABELS[c]).join(', ')}.` : 'No challenges were reported.' },
      { key: 'completeness', label: 'Farm data completeness', max: w.completeness, points: completenessPts,
        explanation: missing.length ? `Missing: ${missing.map((m) => m.label).join(', ')}.` : 'All tracked fields are filled in.' },
      { key: 'farmInfo', label: 'Tree / farm information', max: w.farmInfo, points: farmInfoPts,
        explanation: isCoffee ? (missingCoffeeItems ? 'Some coffee details (trees or variety) are missing.' : 'Coffee tree count and variety provided.') : 'Farm size provided.' },
      { key: 'intervention', label: 'Potential intervention', max: w.intervention, points: interventionPts,
        explanation: recommendations.length ? `${recommendations.length} Farm Story service${recommendations.length === 1 ? '' : 's'} could apply.` : 'No services were triggered.' },
    ];
    const opportunityScore = Math.max(0, Math.min(100, dimensions.reduce((s, d) => s + d.points, 0)));

    const t = cfg.thresholds;
    const healthStatus: HealthStatusName = opportunityScore <= t.strongMax ? 'STRONG_POSITION' : opportunityScore >= t.highMin ? 'HIGH_OPPORTUNITY' : 'MODERATE_OPPORTUNITY';
    const summary = {
      STRONG_POSITION: 'Your farm profile is fairly complete and few areas were flagged. Keep your records up to date.',
      MODERATE_OPPORTUNITY: 'Your farm has several areas where additional assessment may help improve productivity.',
      HIGH_OPPORTUNITY: 'Your farm has multiple areas where professional support and better records could make a real difference.',
    }[healthStatus];

    return {
      opportunityScore, healthStatus, statusLabel: STATUS_LABELS[healthStatus], summary, insights, recommendations,
      scoreBreakdown: {
        engineVersion: ENGINE_VERSION,
        scoreMeaning: 'A higher score means more areas where support or better information could help. It is not a measure of how well you farm.',
        dimensions, metrics: { productionPerTreeKg, treesPerAcre, productionPerAcreKg },
        availableInformation: tracked.filter((x) => x.present).map((x) => x.label),
        missingInformation: missing.map((m) => m.label), disclaimer: DISCLAIMER,
      },
    };
  }
}

/** Adds the display label, disclaimer and derived action plan to a stored insight row. Used everywhere an insight leaves the API. */
export function presentInsight<T extends { healthStatus: HealthStatusName }>(i: T | null | undefined) {
  return i ? { ...i, statusLabel: STATUS_LABELS[i.healthStatus], disclaimer: DISCLAIMER, actionPlan: buildActionPlan(i as any) } : null;
}
