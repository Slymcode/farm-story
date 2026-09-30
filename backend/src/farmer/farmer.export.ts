import { CsvColumn, toCsv } from '../common/csv';
import { STATUS_LABELS } from '../insight/farm-insight.engine';

const CROP: Record<string, string> = { COFFEE: 'Coffee', MAIZE: 'Maize', BEANS: 'Beans', TEA: 'Tea', OTHER: 'Other' };
const CHALLENGE: Record<string, string> = {
  LOW_YIELD: 'Low yield', PESTS_DISEASE: 'Pests / disease', SOIL_QUALITY: 'Soil quality', WATER_AVAILABILITY: 'Water availability',
  BUYER_ACCESS: 'Access to buyers', FINANCE_ACCESS: 'Access to finance', INPUT_COSTS: 'Input costs',
};
const day = (d?: Date | null) => (d ? d.toISOString().slice(0, 10) : '');

export interface FarmerExportRow { farmer: any; farm: any | null }

/** One row per farm (a farmer without a farm still gets one row, with the farm columns blank). */
export const flattenFarmers = (farmers: any[]): FarmerExportRow[] =>
  farmers.flatMap((f) => (f.farms?.length ? f.farms.map((farm: any) => ({ farmer: f, farm })) : [{ farmer: f, farm: null }]));

export const FARMER_COLUMNS: CsvColumn<FarmerExportRow>[] = [
  { header: 'Farmer ID', value: (r) => r.farmer.farmerId },
  { header: 'Full Name', value: (r) => r.farmer.fullName },
  { header: 'Mobile', value: (r) => r.farmer.mobileNumber },
  { header: 'Email', value: (r) => r.farmer.email },
  { header: 'County', value: (r) => r.farmer.county },
  { header: 'Preferred Language', value: (r) => r.farmer.preferredLanguage },
  { header: 'Farm Name', value: (r) => r.farm?.farmName },
  { header: 'Farm Size (acres)', value: (r) => r.farm?.sizeAcres },
  { header: 'Primary Crop', value: (r) => (r.farm ? CROP[r.farm.primaryCrop] ?? r.farm.primaryCrop : '') },
  { header: 'Coffee Variety', value: (r) => r.farm?.coffeeVariety ?? [] },
  { header: 'Coffee Trees', value: (r) => r.farm?.coffeeTrees },
  { header: 'Estimated Annual Production (kg)', value: (r) => r.farm?.estimatedAnnualProductionKg },
  { header: 'Last Harvest Date', value: (r) => day(r.farm?.lastHarvestDate) },
  { header: 'Challenges', value: (r) => (r.farm?.challenges ?? []).map((c: string) => CHALLENGE[c] ?? c) },
  { header: 'Opportunity Score', value: (r) => r.farm?.insight?.opportunityScore },
  { header: 'Insight Status', value: (r) => (r.farm?.insight ? STATUS_LABELS[r.farm.insight.healthStatus as keyof typeof STATUS_LABELS] : '') },
  { header: 'Created At', value: (r) => r.farmer.createdAt },
];

export const farmersToCsv = (farmers: any[]) => toCsv(FARMER_COLUMNS, flattenFarmers(farmers));
