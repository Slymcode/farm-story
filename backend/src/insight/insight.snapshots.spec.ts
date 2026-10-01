import { NotFoundException } from '@nestjs/common';
import { FarmInsightEngine } from './farm-insight.engine';
import { InsightService } from './insight.service';

const farm = {
  id: 'f1', farmerId: 'fr1', primaryCrop: 'COFFEE', coffeeVariety: ['SL28'], sizeAcres: 2.5, coffeeTrees: 1100, estimatedAnnualProductionKg: 1800,
  lastHarvestDate: null, lastSoilTestDate: null, challenges: ['LOW_YIELD'],
};
function build(f: any = farm) {
  const snaps: any[] = [];
  const prisma: any = {
    farm: { findUnique: jest.fn(async () => f) },
    farmInsight: { upsert: jest.fn(async ({ create }) => ({ ...create, healthStatus: create.healthStatus })) },
    farmInsightSnapshot: {
      findFirst: jest.fn(async () => (snaps.length ? snaps[snaps.length - 1] : null)),
      create: jest.fn(async ({ data }) => { snaps.push({ ...data, createdAt: new Date(2026, 8, snaps.length + 1) }); }),
      findMany: jest.fn(async () => [...snaps].reverse()),
    },
  };
  return { svc: new InsightService(prisma, new FarmInsightEngine()), prisma, snaps, setFarm: (n: any) => { prisma.farm.findUnique = jest.fn(async () => n); } };
}

describe('insight snapshots', () => {
  it('stores a snapshot on first generation', async () => {
    const { svc, snaps } = build();
    await svc.generateForFarm('f1');
    expect(snaps).toHaveLength(1);
  });
  it('does not store a duplicate when nothing changed', async () => {
    const { svc, snaps } = build();
    await svc.generateForFarm('f1'); await svc.generateForFarm('f1'); await svc.generateForFarm('f1');
    expect(snaps).toHaveLength(1);
  });
  it('stores a new snapshot when the result changes and explains it from stored data', async () => {
    const { svc, snaps, setFarm } = build();
    await svc.generateForFarm('f1');
    setFarm({ ...farm, lastSoilTestDate: new Date() });
    await svc.generateForFarm('f1');
    expect(snaps).toHaveLength(2);
    const h = await svc.history('f1');
    expect(h.snapshots).toHaveLength(2);
    expect(h.snapshots[0].change.direction).toBe('first');
    expect(h.latestChange!.reasons.join(' ')).toMatch(/Soil test date|Soil testing/i);
    expect(h.note).not.toMatch(/unhealthy|proves improvement|diagnos/i);
  });
  it('404s history for an unknown farm', async () => {
    const { svc, setFarm } = build();
    setFarm(null);
    await expect(svc.history('nope')).rejects.toBeInstanceOf(NotFoundException);
  });
});
