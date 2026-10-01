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
import { snapshotHash } from '../src/insight/insight-history';

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const engine = new FarmInsightEngine();
const pad = (n: number) => String(n).padStart(6, '0');

type Seed = {
  name: string; phone: string; county: string; region?: string; lang: string; email?: string; created: string;
  farm: { name: string; location: string; lat: number; lng: number; acres: number; crop: any; varieties?: string[]; trees?: number; kg?: number; harvest?: string; soil?: string; challenges: any[] };
  requests?: SeedRequest[];
  /** Earlier versions of the farm, used to build a real insight history by running the engine on past inputs. */
  history?: { date: string; patch: Partial<Record<'harvest' | 'soil', string | null>> }[];
};
type SeedRequest = {
  type: any; status: any; note?: string; created: string;
  agro?: string;
  assessment?: { summary: string; observations?: string; actions?: string; followUpInDays?: number };
};

const AGRONOMISTS = [
  { fullName: 'Grace Wanjiku', email: 'grace.wanjiku@farmstory.africa', phone: '0711000001', county: 'Nyeri', specialties: ['AGRONOMIST_VISIT', 'SOIL_TEST'], status: 'ACTIVE' },
  { fullName: 'Brian Otieno', email: 'brian.otieno@farmstory.africa', phone: '0711000002', county: "Murang'a", specialties: ['BIOCHAR_ASSESSMENT', 'COFFEE_QUALITY_ASSESSMENT'], status: 'ACTIVE' },
  { fullName: 'Amina Hassan', email: 'amina.hassan@farmstory.africa', phone: '0711000003', county: 'Embu', specialties: ['SOIL_TEST', 'BUYER_OFFTAKE_SUPPORT', 'COFFEE_QUALITY_ASSESSMENT'], status: 'ACTIVE' },
  { fullName: 'David Kiprop', email: 'david.kiprop@farmstory.africa', phone: '0711000004', county: 'Kiambu', specialties: ['AGRONOMIST_VISIT'], status: 'INACTIVE' },
] as const;

/** Demo login accounts (fictional, password is public on purpose). They let reviewers try login and farmer ownership. */
const DEMO_PASSWORD = 'Password123!';
const DEMO_ACCOUNTS: Record<string, string> = { 'John Mwangi': 'john@example.com', 'Grace Wanjiru': 'grace.wanjiru@example.com' };

const seeds: Seed[] = [
  { name: 'John Mwangi', phone: '0712345678', county: 'Nyeri', region: 'Mathira', lang: 'English', created: '2026-09-01',
    farm: { name: "John's Coffee Farm", location: 'Nyeri County, Kenya', lat: -0.4201, lng: 36.9476, acres: 2.5, crop: 'COFFEE', varieties: ['SL28', 'Ruiru 11'], trees: 1100, kg: 1800, harvest: '2026-02-15', soil: '2026-09-10', challenges: ['LOW_YIELD'] },
    // Past states of John's farm: first registered without dates, then a harvest date was added, then a soil test date.
    history: [{ date: '2026-09-01', patch: { harvest: null, soil: null } }, { date: '2026-09-12', patch: { soil: null } }],
    requests: [
      { type: 'AGRONOMIST_VISIT', status: 'COMPLETED', note: 'Yields vary across the farm.', created: '2026-09-02', agro: 'Grace Wanjiku',
        assessment: {
          summary: 'Trees appear well managed with good spacing. Yield looks uneven between the upper and lower blocks.',
          observations: 'Lower block has patchy canopy. Mulch cover is thin in places.',
          actions: 'Arrange a soil test before changing any inputs. Review the pruning schedule together at the follow-up visit.', followUpInDays: 5,
        } },
      { type: 'SOIL_TEST', status: 'ASSIGNED', note: 'Please sample the lower block.', created: '2026-09-25', agro: 'Grace Wanjiku' },
    ] },
  { name: 'Grace Wanjiru', phone: '0722456789', county: 'Nyeri', region: 'Tetu', lang: 'Kikuyu', email: 'grace.wanjiru@example.com', created: '2026-09-03',
    farm: { name: 'Wanjiru Highlands Farm', location: 'Tetu, Nyeri County', lat: -0.4512, lng: 36.9903, acres: 4, crop: 'COFFEE', varieties: ['Batian', 'SL28'], trees: 1600, kg: 3200, harvest: '2026-01-20', soil: '2025-06-10', challenges: ['PESTS_DISEASE', 'INPUT_COSTS'] },
    requests: [{ type: 'AGRONOMIST_VISIT', status: 'ASSIGNED', note: 'Leaf spots on several trees.', created: '2026-09-08', agro: 'Grace Wanjiku' }] },
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
    requests: [{ type: 'COFFEE_QUALITY_ASSESSMENT', status: 'COMPLETED', created: '2026-09-09', agro: 'Amina Hassan',
      assessment: { summary: 'Cherry sorting and drying practices look consistent. No quality concerns noted during the visit.', actions: 'Keep records of lot sizes to support future buyer conversations.' } }] },
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
    requests: [{ type: 'SOIL_TEST', status: 'ASSIGNED', created: '2026-09-24', agro: 'Amina Hassan' }] },
];

const day = 86_400_000;
const addDays = (iso: string | Date, n: number) => new Date(new Date(iso).getTime() + n * day);

/** Builds the lifecycle events a request in this state would really have gone through. */
function eventsFor(q: SeedRequest, farmerName: string, agroName?: string) {
  const c = new Date(q.created);
  const ev: any[] = [{ type: 'REQUEST_CREATED', toStatus: 'PENDING', actorRole: 'FARMER', actorName: farmerName, message: 'Request submitted by the farmer.', createdAt: c }];
  if (q.status !== 'PENDING') {
    if (q.status === 'CANCELLED') return [...ev, { type: 'REQUEST_CANCELLED', fromStatus: 'PENDING', toStatus: 'CANCELLED', actorRole: 'ADMIN', actorName: 'Farm Story admin (demo)', message: 'Request cancelled by the Farm Story team.', createdAt: addDays(c, 1) }];
    ev.push({ type: 'REQUEST_REVIEWED', fromStatus: 'PENDING', toStatus: 'IN_REVIEW', actorRole: 'ADMIN', actorName: 'Farm Story admin (demo)', message: 'Request reviewed by the Farm Story team.', createdAt: addDays(c, 1) });
  }
  if (q.agro) ev.push({ type: 'AGRONOMIST_ASSIGNED', fromStatus: 'IN_REVIEW', toStatus: 'ASSIGNED', actorRole: 'ADMIN', actorName: 'Farm Story admin (demo)', message: `Assigned to agronomist ${agroName}.`, createdAt: addDays(c, 2) });
  if (q.assessment) ev.push({ type: 'ASSESSMENT_SUBMITTED', actorRole: 'AGRONOMIST', actorName: agroName, message: 'Field assessment submitted by the agronomist.', createdAt: addDays(c, 6) });
  if (q.status === 'COMPLETED') ev.push({ type: 'REQUEST_COMPLETED', fromStatus: 'ASSIGNED', toStatus: 'COMPLETED', actorRole: 'AGRONOMIST', actorName: agroName, message: 'Request completed by the agronomist.', createdAt: addDays(c, 6.1) });
  return ev;
}

async function main() {
  await prisma.farmInsightSnapshot.deleteMany();
  await prisma.agronomistAssessment.deleteMany();
  await prisma.serviceRequestEvent.deleteMany();
  await prisma.serviceRequest.deleteMany();
  await prisma.agronomist.deleteMany();
  await prisma.farmInsight.deleteMany();
  await prisma.farm.deleteMany();
  await prisma.farmer.deleteMany();
  await prisma.user.deleteMany();
  await prisma.counter.deleteMany();

  const agronomistIds = new Map<string, string>();
  for (const a of AGRONOMISTS) agronomistIds.set(a.fullName, (await prisma.agronomist.create({ data: { ...a, specialties: [...a.specialties] } })).id);

  let farmerN = 0, requestN = 0, snapshotN = 0, assessmentN = 0;
  let johnPassport = '';
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
    // Insight history: earlier engine runs on earlier inputs (if any), then the current result. Same rule as the API: one row per distinct result.
    const snapshotOf = (res: typeof r, createdAt: Date) => ({
      farmId: farm.id, opportunityScore: res.opportunityScore, healthStatus: res.healthStatus, contentHash: snapshotHash(res as any), createdAt,
      scoreBreakdown: res.scoreBreakdown as unknown as Prisma.InputJsonValue, recommendations: res.recommendations as unknown as Prisma.InputJsonValue,
    });
    let lastHash = '';
    for (const h of s.history ?? []) {
      const past = { ...farm, lastHarvestDate: 'harvest' in h.patch ? (h.patch.harvest ? new Date(h.patch.harvest) : null) : farm.lastHarvestDate, lastSoilTestDate: 'soil' in h.patch ? (h.patch.soil ? new Date(h.patch.soil) : null) : farm.lastSoilTestDate };
      const pr = engine.generate(past, new Date(h.date));
      const row = snapshotOf(pr, new Date(h.date));
      if (row.contentHash !== lastHash) { await prisma.farmInsightSnapshot.create({ data: row }); snapshotN++; lastHash = row.contentHash; }
    }
    const cur = snapshotOf(r, addDays(new Date(), -1));
    if (cur.contentHash !== lastHash) { await prisma.farmInsightSnapshot.create({ data: cur }); snapshotN++; }
    if (s.name === 'John Mwangi') johnPassport = farm.publicId;

    for (const q of s.requests ?? []) {
      const agroId = q.agro ? agronomistIds.get(q.agro) : undefined;
      const created = await prisma.serviceRequest.create({
        data: {
          requestId: `FS-REQ-${pad(++requestN)}`, farmerId: farmer.id, farmId: farm.id, type: q.type, status: q.status, description: q.note ?? null, createdAt: new Date(q.created),
          assignedAgronomistId: agroId ?? null, assignedAt: agroId ? addDays(q.created, 2) : null,
          events: { create: eventsFor(q, s.name, q.agro) },
        },
      });
      if (q.assessment && agroId) {
        const days = q.assessment.followUpInDays;
        await prisma.agronomistAssessment.create({
          data: {
            serviceRequestId: created.id, agronomistId: agroId, summary: q.assessment.summary, observations: q.assessment.observations ?? null, recommendedActions: q.assessment.actions ?? null,
            followUpRequired: days != null, followUpDate: days != null ? addDays(new Date(), days) : null, createdAt: addDays(q.created, 6),
          },
        });
        assessmentN++;
      }
    }
  }
  // Keep the ID counters ahead of seeded IDs so new registrations continue the sequence.
  await prisma.counter.createMany({ data: [{ name: 'farmer', value: farmerN }, { name: 'service_request', value: requestN }] });
  console.log(`Seeded ${farmerN} farmers, ${requestN} service requests, ${AGRONOMISTS.length} agronomists, ${assessmentN} assessments and ${snapshotN} insight snapshots. John Mwangi is FS-KEN-000001.\nJohn's public Farm Passport: /passport/${johnPassport}\nDemo logins (password: ${DEMO_PASSWORD}): ${Object.values(DEMO_ACCOUNTS).join(', ')}`);
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
