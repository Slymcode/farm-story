import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import { FarmService } from '../farm/farm.service';
import { FarmerService } from '../farmer/farmer.service';
import { ServiceRequestService } from '../service-request/service-request.service';
import { AuthUser } from './auth.types';

const alice: AuthUser = { id: 'user-alice', name: 'Alice', email: 'a@x.com', role: 'FARMER', onboardingCompleted: false };
const farm = (farmerUserId: string | null) => ({ id: 'farm-1', farmerId: 'farmer-1', insight: null, farmer: { id: 'farmer-1', userId: farmerUserId, fullName: 'Someone' } });

describe('farmer ownership', () => {
  it("a farmer cannot read another farmer's farm, profile, AI context or request list; they can read their own", async () => {
    const prisma: any = {
      farm: { findUnique: jest.fn().mockResolvedValue(farm('user-bob')) },
      farmer: { findFirst: jest.fn().mockResolvedValue({ id: 'farmer-1', userId: 'user-bob', farms: [], serviceRequests: [] }), findUnique: jest.fn().mockResolvedValue({ id: 'farmer-alice', userId: 'user-alice' }) },
      serviceRequest: { findFirst: jest.fn().mockResolvedValue({ id: 'r1', farmerId: 'farmer-1' }) },
    };
    await expect(new FarmService(prisma, {} as any).findOne('farm-1', alice)).rejects.toBeInstanceOf(ForbiddenException);
    await expect(new FarmerService(prisma, {} as any).findOne('FS-KEN-000001', alice)).rejects.toBeInstanceOf(ForbiddenException);
    prisma.farmer.findUnique.mockResolvedValue({ userId: 'user-bob' }); // owner lookup for farm/request checks
    prisma.farm.findUnique.mockResolvedValue({ farmer: { userId: 'user-bob' } });
    await expect(new AiService(prisma, {} as any).ask('farm-1', 'hello there', alice)).rejects.toBeInstanceOf(ForbiddenException);
    await expect(new ServiceRequestService(prisma, {} as any).findOne('r1', alice)).rejects.toBeInstanceOf(ForbiddenException);

    prisma.farm.findUnique.mockResolvedValue(farm('user-alice'));
    await expect(new FarmService(prisma, {} as any).findOne('farm-1', alice)).resolves.toMatchObject({ id: 'farm-1' });
  });

  it('the logged-in user id is never leaked in responses', async () => {
    const prisma: any = { farm: { findUnique: jest.fn().mockResolvedValue(farm('user-alice')) } };
    const out: any = await new FarmService(prisma, {} as any).findOne('farm-1', alice);
    expect(out.farmer).not.toHaveProperty('userId');
  });

  it('without a session the prototype demo/admin access is unchanged', async () => {
    const prisma: any = { farm: { findUnique: jest.fn().mockResolvedValue(farm('user-bob')) } };
    await expect(new FarmService(prisma, {} as any).findOne('farm-1')).resolves.toMatchObject({ id: 'farm-1' });
  });

  it("service requests: a farmer's list is forced to their own farmer, whatever farmerId the browser sends", async () => {
    const prisma: any = {
      farmer: { findUnique: jest.fn().mockResolvedValue({ id: 'farmer-alice' }) },
      serviceRequest: { count: jest.fn().mockResolvedValue(0), findMany: jest.fn().mockResolvedValue([]) },
      $transaction: jest.fn(async (qs: any[]) => Promise.all(qs)),
    };
    await new ServiceRequestService(prisma, {} as any).list({ farmerId: 'farmer-bob' }, alice);
    expect(prisma.serviceRequest.findMany.mock.calls[0][0].where.farmerId).toBe('farmer-alice');
  });

  it("service requests: a farmer cannot create one for someone else's farm", async () => {
    const prisma: any = {
      farm: { findUnique: jest.fn().mockResolvedValue({ id: 'farm-bob', farmerId: 'farmer-bob' }) },
      farmer: { findUnique: jest.fn().mockResolvedValue({ id: 'farmer-alice' }) },
    };
    await expect(new ServiceRequestService(prisma, {} as any).create({ farmerId: 'farmer-bob', farmId: 'farm-bob', type: 'SOIL_TEST' } as any, alice)).rejects.toBeInstanceOf(ForbiddenException);
  });
});

describe('onboarding completion and farmer linking', () => {
  it('saving farmer details links the farmer to the account, and resuming updates the same record instead of creating another', async () => {
    const created: any[] = [];
    const prisma: any = {
      farmer: {
        findUnique: jest.fn(async () => created[0] ?? null),
        create: jest.fn(async ({ data }: any) => { created.push({ id: 'f1', ...data }); return created[0]; }),
        update: jest.fn(async ({ data }: any) => Object.assign(created[0], data)),
      },
    };
    const svc = new FarmerService(prisma, { nextFarmerId: async () => 'FS-KEN-000011' } as any);
    const first: any = await svc.create({ fullName: 'Alice', mobileNumber: '0712000111', county: 'Nyeri', preferredLanguage: 'English' } as any, alice);
    expect(prisma.farmer.create.mock.calls[0][0].data.userId).toBe('user-alice');
    expect(first).not.toHaveProperty('userId');
    await svc.create({ fullName: 'Alice B', mobileNumber: '0712000111', county: 'Nyeri', preferredLanguage: 'English' } as any, alice);
    expect(prisma.farmer.create).toHaveBeenCalledTimes(1);
    expect(prisma.farmer.update).toHaveBeenCalledTimes(1);
  });

  it("creating the farm uses the session's farmer (ignoring a spoofed farmerId) and marks onboarding completed", async () => {
    const prisma: any = {
      farmer: { findUnique: jest.fn().mockResolvedValue({ id: 'farmer-alice' }), findFirst: jest.fn().mockResolvedValue({ id: 'farmer-alice' }) },
      farm: { create: jest.fn().mockResolvedValue({ id: 'farm-new' }), findUnique: jest.fn().mockResolvedValue({ ...farm('user-alice'), id: 'farm-new' }) },
      user: { update: jest.fn().mockResolvedValue({}) },
    };
    const insights: any = { generateForFarm: jest.fn() };
    await new FarmService(prisma, insights).create({ farmerId: 'farmer-bob', farmName: 'A', location: 'L', latitude: 0, longitude: 0, sizeAcres: 1, primaryCrop: 'MAIZE', challenges: [] } as any, alice);
    expect(prisma.farm.create.mock.calls[0][0].data.farmerId).toBe('farmer-alice');
    expect(prisma.user.update).toHaveBeenCalledWith({ where: { id: 'user-alice' }, data: { onboardingCompleted: true } });
  });

  it('a farm cannot be created before the farmer details exist, and onboarding is not marked complete', async () => {
    const prisma: any = { farmer: { findUnique: jest.fn().mockResolvedValue(null) }, user: { update: jest.fn() } };
    await expect(new FarmService(prisma, {} as any).create({ farmerId: 'x' } as any, alice)).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});
