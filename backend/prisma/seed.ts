/**
 * Demo seed. Resets demo data, then creates John Mwangi (from the assessment brief) plus a handful of
 * illustrative Kenyan farmers. All values are fictional demo data, NOT real-world datasets.
 * Insights are produced by the real FarmInsightEngine, never hardcoded.
 */
import 'dotenv/config';
import { PrismaClient, Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';
import { FarmInsightEngine } from '../src/insight/farm-insight.engine';

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const engine = new FarmInsightEngine();
const pad = (n: number) => String(n).padStart(6, '0');

type Seed = {
  name: string; phone: string; county: string; region?: string; lang: string; email?: string; created: string;
  farm: { name: string; location: string; lat: number; lng: number; acres: number; crop: any; varieties?: string[]; trees?: number; kg?: number; harvest?: string; soil?: string; challenges: any[] };
  requests?: { type: any; status: any; note?: string; created: string }[];
};

/** Demo login accounts (fictional, password is public on purpose). They let reviewers try login and farmer ownership. */
const DEMO_PASSWORD = 'Password123!';
const DEMO_ACCOUNTS: Record<string, string> = { 'John Mwangi': 'john@example.com', 'Grace Wanjiru': 'grace.wanjiru@example.com' };

const seeds: Seed[] = [
  { name: 'John Mwangi', phone: '0712345678', county: 'Nyeri', region: 'Mathira', lang: 'English', created: '2026-09-01',
    farm: { name: "John's Coffee Farm", location: 'Nyeri County, Kenya', lat: -0.4201, lng: 36.9476, acres: 2.5, crop: 'COFFEE', varieties: ['SL28', 'Ruiru 11'], trees: 1100, kg: 1800, challenges: ['LOW_YIELD'] } },
  { name: 'Grace Wanjiru', phone: '0722456789', county: 'Nyeri', region: 'Tetu', lang: 'Kikuyu', email: 'grace.wanjiru@example.com', created: '2026-09-03',
    farm: { name: 'Wanjiru Highlands Farm', location: 'Tetu, Nyeri County', lat: -0.4512, lng: 36.9903, acres: 4, crop: 'COFFEE', varieties: ['Batian', 'SL28'], trees: 1600, kg: 3200, harvest: '2026-01-20', soil: '2025-06-10', challenges: ['PESTS_DISEASE', 'INPUT_COSTS'] },
    requests: [{ type: 'AGRONOMIST_VISIT', status: 'ASSIGNED', note: 'Leaf spots on several trees.', created: '2026-09-08' }] },
  { name: 'Peter Kamau', phone: '0733567890', county: 'Kiambu', region: 'Githunguri', lang: 'Kiswahili', created: '2026-09-04',
    farm: { name: 'Kamau Family Farm', location: 'Githunguri, Kiambu County', lat: -1.0605, lng: 36.7729, acres: 1.5, crop: 'COFFEE', varieties: ['Ruiru 11'], trees: 600, kg: 900, harvest: '2025-12-05', challenges: ['LOW_YIELD', 'BUYER_ACCESS', 'FINANCE_ACCESS'] },
    requests: [
      { type: 'SOIL_TEST', status: 'PENDING', created: '2026-09-10' },
      { type: 'BUYER_OFFTAKE_SUPPORT', status: 'IN_REVIEW', note: 'Looking for a buyer before next season.', created: '2026-09-12' },
    ] },
  { name: 'Mary Njeri', phone: '0745678901', county: "Murang'a", region: 'Kandara', lang: 'Kikuyu', created: '2026-09-05',
    farm: { name: 'Njeri Ridge Farm', location: "Kandara, Murang'a County", lat: -0.8871, lng: 37.0214, acres: 3, crop: 'COFFEE', varieties: ['SL34', 'SL28'], trees: 1300, kg: 2400, harvest: '2026-02-02', soil: '2024-08-15', challenges: ['SOIL_QUALITY', 'WATER_AVAILABILITY'] },
    requests: [{ type: 'BIOCHAR_ASSESSMENT', status: 'PENDING', created: '2026-09-15' }] },
  { name: 'Samuel Kariuki', phone: '0756789012', county: 'Kirinyaga', region: 'Mwea', lang: 'English', created: '2026-09-06',
    farm: { name: 'Kariuki Maize Plot', location: 'Mwea, Kirinyaga County', lat: -0.6879, lng: 37.3512, acres: 2, crop: 'MAIZE', kg: 1600, harvest: '2026-08-10', challenges: ['WATER_AVAILABILITY', 'INPUT_COSTS'] } },
  { name: 'Esther Muthoni', phone: '0767890123', county: 'Embu', region: 'Runyenjes', lang: 'Kiswahili', email: 'esther.m@example.com', created: '2026-09-07',
    farm: { name: 'Muthoni Coffee Estate', location: 'Runyenjes, Embu County', lat: -0.4247, lng: 37.5713, acres: 2, crop: 'COFFEE', varieties: ['Ruiru 11'], trees: 800, kg: 1300, harvest: '2026-02-10', soil: '2026-03-01', challenges: [] },
    requests: [{ type: 'COFFEE_QUALITY_ASSESSMENT', status: 'COMPLETED', created: '2026-09-09' }] },
  { name: 'James Njoroge', phone: '0778901234', county: 'Kiambu', region: 'Limuru', lang: 'English', created: '2026-09-11',
    farm: { name: 'Njoroge Tea Farm', location: 'Limuru, Kiambu County', lat: -1.1075, lng: 36.6432, acres: 3.5, crop: 'TEA', kg: 5200, challenges: ['BUYER_ACCESS', 'INPUT_COSTS'] },
    requests: [{ type: 'BUYER_OFFTAKE_SUPPORT', status: 'PENDING', created: '2026-09-18' }] },
  { name: 'Lucy Wambui', phone: '0789012345', county: "Murang'a", region: 'Maragua', lang: 'Kikuyu', created: '2026-09-14',
    farm: { name: 'Wambui Bean Farm', location: "Maragua, Murang'a County", lat: -0.7833, lng: 37.1333, acres: 1, crop: 'BEANS', challenges: ['LOW_YIELD', 'PESTS_DISEASE', 'SOIL_QUALITY', 'FINANCE_ACCESS'] },
    requests: [{ type: 'AGRONOMIST_VISIT', status: 'PENDING', note: 'Beans wilting in the second month.', created: '2026-09-20' }] },
  { name: 'Daniel Gitonga', phone: '0790123456', county: 'Nyeri', region: 'Kieni', lang: 'English', created: '2026-09-16',
    farm: { name: 'Gitonga Estate', location: 'Kieni, Nyeri County', lat: -0.3712, lng: 36.9614, acres: 6, crop: 'COFFEE', varieties: ['SL28', 'Batian'], trees: 2400, kg: 5100, harvest: '2026-02-14', soil: '2025-11-02', challenges: ['BUYER_ACCESS'] },
    requests: [{ type: 'COFFEE_QUALITY_ASSESSMENT', status: 'IN_REVIEW', created: '2026-09-22' }] },
  { name: 'Faith Wangari', phone: '0701234567', county: 'Kirinyaga', region: 'Gichugu', lang: 'Kiswahili', created: '2026-09-18',
    farm: { name: 'Wangari Hillside Farm', location: 'Gichugu, Kirinyaga County', lat: -0.5121, lng: 37.3008, acres: 2.2, crop: 'COFFEE', varieties: ['Ruiru 11'], trees: 950, kg: 1500, harvest: '2026-01-28', challenges: ['LOW_YIELD', 'SOIL_QUALITY'] },
    requests: [{ type: 'SOIL_TEST', status: 'ASSIGNED', created: '2026-09-24' }] },
];

async function main() {
  await prisma.serviceRequest.deleteMany();
  await prisma.farmInsight.deleteMany();
  await prisma.farm.deleteMany();
  await prisma.farmer.deleteMany();
  await prisma.user.deleteMany();
  await prisma.counter.deleteMany();

  let farmerN = 0, requestN = 0;
  for (const s of seeds) {
    const demoEmail = DEMO_ACCOUNTS[s.name];
    const user = demoEmail ? await prisma.user.create({ data: { name: s.name, email: demoEmail, passwordHash: await bcrypt.hash(DEMO_PASSWORD, 10), role: 'FARMER', onboardingCompleted: true } }) : null;
    const farmer = await prisma.farmer.create({
      data: { userId: user?.id ?? null, farmerId: `FS-KEN-${pad(++farmerN)}`, fullName: s.name, mobileNumber: s.phone, email: s.email ?? null, county: s.county, region: s.region ?? null, preferredLanguage: s.lang, createdAt: new Date(s.created) },
    });
    const f = s.farm;
    const farm = await prisma.farm.create({
      data: {
        farmerId: farmer.id, farmName: f.name, location: f.location, latitude: f.lat, longitude: f.lng, sizeAcres: f.acres,
        primaryCrop: f.crop, coffeeVariety: f.varieties ?? [], coffeeTrees: f.trees ?? null, estimatedAnnualProductionKg: f.kg ?? null,
        lastHarvestDate: f.harvest ? new Date(f.harvest) : null, lastSoilTestDate: f.soil ? new Date(f.soil) : null,
        challenges: f.challenges, createdAt: new Date(s.created),
      },
    });
    const r = engine.generate(farm);
    await prisma.farmInsight.create({
      data: {
        farmId: farm.id, opportunityScore: r.opportunityScore, healthStatus: r.healthStatus, summary: r.summary,
        insights: r.insights as unknown as Prisma.InputJsonValue, recommendations: r.recommendations as unknown as Prisma.InputJsonValue,
        scoreBreakdown: r.scoreBreakdown as unknown as Prisma.InputJsonValue,
      },
    });
    for (const q of s.requests ?? []) {
      await prisma.serviceRequest.create({
        data: { requestId: `FS-REQ-${pad(++requestN)}`, farmerId: farmer.id, farmId: farm.id, type: q.type, status: q.status, description: q.note ?? null, createdAt: new Date(q.created) },
      });
    }
  }
  // Keep the ID counters ahead of seeded IDs so new registrations continue the sequence.
  await prisma.counter.createMany({ data: [{ name: 'farmer', value: farmerN }, { name: 'service_request', value: requestN }] });
  console.log(`Seeded ${farmerN} farmers and ${requestN} service requests. John Mwangi is FS-KEN-000001.\nDemo logins (password: ${DEMO_PASSWORD}): ${Object.values(DEMO_ACCOUNTS).join(', ')}`);
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
