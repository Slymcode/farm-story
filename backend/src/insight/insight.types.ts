export type CropTypeName = 'COFFEE' | 'MAIZE' | 'BEANS' | 'TEA' | 'OTHER';
export type ChallengeName =
  | 'LOW_YIELD' | 'PESTS_DISEASE' | 'SOIL_QUALITY' | 'WATER_AVAILABILITY'
  | 'BUYER_ACCESS' | 'FINANCE_ACCESS' | 'INPUT_COSTS';
export type ServiceTypeName =
  | 'AGRONOMIST_VISIT' | 'SOIL_TEST' | 'BIOCHAR_ASSESSMENT' | 'COFFEE_QUALITY_ASSESSMENT' | 'BUYER_OFFTAKE_SUPPORT';
export type HealthStatusName = 'STRONG_POSITION' | 'MODERATE_OPPORTUNITY' | 'HIGH_OPPORTUNITY';

/** Everything the engine is allowed to look at. Deliberately excludes any personal data. */
export interface FarmInsightInput {
  primaryCrop: CropTypeName;
  sizeAcres: number;
  coffeeVariety?: string[];
  coffeeTrees?: number | null;
  estimatedAnnualProductionKg?: number | null;
  lastHarvestDate?: Date | null;
  lastSoilTestDate?: Date | null;
  challenges: ChallengeName[];
}

export interface InsightItem { title: string; description: string; category: 'metric' | 'gap' | 'challenge' | 'info' }

export interface Recommendation {
  title: string; description: string; reason: string; serviceType: ServiceTypeName;
  /** Which rules fired, so the UI can explain "why am I seeing this?" */
  triggers: string[];
}

export interface ScoreDimension {
  key: 'production' | 'challenges' | 'completeness' | 'farmInfo' | 'intervention';
  label: string; max: number; points: number; explanation: string;
}

export interface ScoreBreakdown {
  engineVersion: string; scoreMeaning: string; dimensions: ScoreDimension[];
  metrics: { productionPerTreeKg: number | null; treesPerAcre: number | null; productionPerAcreKg: number | null };
  availableInformation: string[]; missingInformation: string[]; disclaimer: string;
}

export interface FarmInsightResult {
  opportunityScore: number; healthStatus: HealthStatusName; statusLabel: string; summary: string;
  insights: InsightItem[]; recommendations: Recommendation[]; scoreBreakdown: ScoreBreakdown;
}

/** Shown whenever production per tree/acre is reported. Never a verdict, always a prompt to compare with local benchmarks. */
export const BENCHMARK_NOTE =
  "Production efficiency should be reviewed against local agronomic benchmarks for the farm's variety, environment and management practices.";
