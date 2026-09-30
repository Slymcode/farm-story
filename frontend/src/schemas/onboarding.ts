import { z } from 'zod';

/** Form values are kept as strings (what inputs produce); the toXPayload helpers convert them for the API. */
const optionalNumber = (label: string, opts: { int?: boolean } = {}) =>
  z.string().refine((v) => v.trim() === '' || (!Number.isNaN(Number(v)) && Number(v) >= 0 && (!opts.int || Number.isInteger(Number(v)))), `Please enter a valid ${label}.`);

export const farmerSchema = z.object({
  fullName: z.string().trim().min(2, 'Please enter your full name.'),
  mobileNumber: z.string().trim().refine((v) => /^\+?\d{9,15}$/.test(v.replace(/[\s-]/g, '')), 'Please enter a valid mobile number, for example 0712 345 678.'),
  email: z.string().trim().refine((v) => v === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'Please enter a valid email address, or leave it blank.'),
  county: z.string().min(1, 'Please choose your county.'),
  region: z.string(),
  preferredLanguage: z.string().min(1, 'Please choose your preferred language.'),
});
export const farmSchema = z.object({
  farmName: z.string().trim().min(2, 'Please enter a farm name.'),
  sizeAcres: z.string().refine((v) => v.trim() !== '' && Number(v) > 0 && Number(v) < 100000, 'Please enter a valid farm size.'),
  primaryCrop: z.string().min(1, 'Please choose your main crop.'),
  coffeeVariety: z.array(z.string()),
  coffeeTrees: optionalNumber('number of trees', { int: true }),
  estimatedAnnualProductionKg: optionalNumber('production amount'),
  lastHarvestDate: z.string(),
  lastSoilTestDate: z.string(),
});
export const locationSchema = z.object({
  location: z.string().trim().min(2, 'Please describe where the farm is.'),
  latitude: z.string().refine((v) => v.trim() !== '' && Number(v) >= -90 && Number(v) <= 90, 'Please enter a valid latitude (-90 to 90).'),
  longitude: z.string().refine((v) => v.trim() !== '' && Number(v) >= -180 && Number(v) <= 180, 'Please enter a valid longitude (-180 to 180).'),
});
export const challengesSchema = z.object({ challenges: z.array(z.string()) });

export const onboardingSchema = farmerSchema.extend(farmSchema.shape).extend(locationSchema.shape).extend(challengesSchema.shape);
export type OnboardingValues = z.infer<typeof onboardingSchema>;

export const STEP_FIELDS: (keyof OnboardingValues)[][] = [
  ['fullName', 'mobileNumber', 'email', 'county', 'region', 'preferredLanguage'],
  ['farmName', 'sizeAcres', 'primaryCrop', 'coffeeVariety', 'coffeeTrees', 'estimatedAnnualProductionKg', 'lastHarvestDate', 'lastSoilTestDate'],
  ['location', 'latitude', 'longitude'],
  ['challenges'],
];

export const emptyValues: OnboardingValues = {
  fullName: '', mobileNumber: '', email: '', county: '', region: '', preferredLanguage: 'English',
  farmName: '', sizeAcres: '', primaryCrop: '', coffeeVariety: [], coffeeTrees: '', estimatedAnnualProductionKg: '',
  lastHarvestDate: '', lastSoilTestDate: '', location: '', latitude: '', longitude: '', challenges: [],
};

/** Sample data matching the assessment brief (John Mwangi) — a labelled prototype convenience. */
export const demoValues: OnboardingValues = {
  fullName: 'John Mwangi', mobileNumber: '0712 345 678', email: '', county: 'Nyeri', region: 'Mathira', preferredLanguage: 'English',
  farmName: "John's Coffee Farm", sizeAcres: '2.5', primaryCrop: 'COFFEE', coffeeVariety: ['SL28', 'Ruiru 11'], coffeeTrees: '1100',
  estimatedAnnualProductionKg: '1800', lastHarvestDate: '', lastSoilTestDate: '',
  location: 'Nyeri County, Kenya', latitude: '-0.4201', longitude: '36.9476', challenges: ['LOW_YIELD'],
};

const n = (v: string) => (v.trim() === '' ? undefined : Number(v));
export const toFarmerPayload = (v: OnboardingValues) => ({
  fullName: v.fullName, mobileNumber: v.mobileNumber, email: v.email || undefined, county: v.county, region: v.region || undefined, preferredLanguage: v.preferredLanguage,
});
export const toFarmPayload = (v: OnboardingValues, farmerId: string) => ({
  farmerId, farmName: v.farmName, location: v.location, latitude: Number(v.latitude), longitude: Number(v.longitude),
  sizeAcres: Number(v.sizeAcres), primaryCrop: v.primaryCrop,
  coffeeVariety: v.primaryCrop === 'COFFEE' ? v.coffeeVariety : undefined,
  coffeeTrees: v.primaryCrop === 'COFFEE' ? n(v.coffeeTrees) : undefined,
  estimatedAnnualProductionKg: n(v.estimatedAnnualProductionKg),
  lastHarvestDate: v.lastHarvestDate || undefined, lastSoilTestDate: v.lastSoilTestDate || undefined, challenges: v.challenges,
});
