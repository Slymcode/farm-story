import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PassportService, toPublicPassport } from './passport.service';

const farmRow = {
  publicId: 'pub-1', farmName: "John's Coffee Farm", primaryCrop: 'COFFEE', coffeeVariety: ['SL28'], sizeAcres: 2.5, createdAt: new Date('2026-09-01'),
  farmer: { county: 'Nyeri', country: 'Kenya' }, _count: { serviceRequests: 1 },
  // Everything below must never reach the public:
  id: 'internal-uuid', latitude: -0.42, longitude: 36.94, location: 'Mathira', challenges: ['LOW_YIELD'], estimatedAnnualProductionKg: 1800, coffeeTrees: 1100,
};

describe('Farm Passport privacy', () => {
  it('exposes an explicit allow-list of fields only', () => {
    const p = toPublicPassport(farmRow as any);
    expect(Object.keys(p).sort()).toEqual(['completedVisits', 'coffeeVarieties', 'country', 'county', 'farmName', 'notice', 'primaryCrop', 'publicId', 'registeredSince', 'sizeAcres'].sort());
    const json = JSON.stringify(p);
    for (const secret of ['internal-uuid', '-0.42', '36.94', 'LOW_YIELD', '1800', 'Mathira', '0712345678']) expect(json).not.toContain(secret);
  });
  it('404s for an unknown public id', async () => {
    const prisma: any = { farm: { findUnique: jest.fn(async () => null) } };
    await expect(new PassportService(prisma).getPublic('nope')).rejects.toBeInstanceOf(NotFoundException);
  });
  it('looks farms up by publicId, never by internal id, and counts only completed visits', async () => {
    const prisma: any = { farm: { findUnique: jest.fn(async () => farmRow) } };
    await new PassportService(prisma).getPublic('pub-1');
    const arg = prisma.farm.findUnique.mock.calls[0][0];
    expect(arg.where).toEqual({ publicId: 'pub-1' });
    expect(arg.select._count.select.serviceRequests.where).toEqual({ status: 'COMPLETED' });
    expect(arg.select).not.toHaveProperty('latitude');
  });
  it("only the owner can create a new link", async () => {
    const prisma: any = { farm: { findUnique: jest.fn(async () => ({ farmer: { userId: 'someone-else' } })), update: jest.fn() } };
    await expect(new PassportService(prisma).rotate('f1', { id: 'me' } as any)).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.farm.update).not.toHaveBeenCalled();
  });
  it('rotates the public id for the owner', async () => {
    const prisma: any = { farm: { findUnique: jest.fn(async () => ({ id: 'f1', farmer: { userId: 'me' } })), update: jest.fn(async ({ data }) => data) } };
    const r = await new PassportService(prisma).rotate('f1', { id: 'me' } as any);
    expect(r.publicId).toMatch(/^[0-9a-f-]{36}$/);
  });
});
