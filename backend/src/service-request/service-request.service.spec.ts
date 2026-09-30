import 'reflect-metadata';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateServiceRequestDto } from './dto/service-request.dto';
import { ServiceRequestService } from './service-request.service';

const farm = { id: 'farm-1', farmerId: 'farmer-1' };
const farmer = { id: 'farmer-1', farmerId: 'FS-KEN-000001' };

function build(overrides: { farm?: any; farmer?: any } = {}) {
  const prisma: any = {
    farm: { findUnique: jest.fn().mockResolvedValue('farm' in overrides ? overrides.farm : farm) },
    farmer: { findFirst: jest.fn().mockResolvedValue('farmer' in overrides ? overrides.farmer : farmer) },
    serviceRequest: { create: jest.fn().mockImplementation(async ({ data }) => ({ id: 'r1', status: 'PENDING', ...data })) },
  };
  const ids: any = { nextRequestId: jest.fn().mockResolvedValue('FS-REQ-000021') };
  return { svc: new ServiceRequestService(prisma, ids), prisma };
}
const dto = { farmerId: 'FS-KEN-000001', farmId: 'farm-1', type: 'SOIL_TEST' } as any;

describe('ServiceRequestService.create', () => {
  it('creates a PENDING request with a generated FS-REQ id and the internal farmer id', async () => {
    const { svc, prisma } = build();
    const r: any = await svc.create(dto);
    expect(r.requestId).toBe('FS-REQ-000021');
    expect(r.status).toBe('PENDING');
    expect(prisma.serviceRequest.create.mock.calls[0][0].data).toMatchObject({ farmerId: 'farmer-1', farmId: 'farm-1', type: 'SOIL_TEST' });
  });
  it("rejects a request for a farm that doesn't belong to the farmer", async () => {
    const { svc, prisma } = build({ farm: { id: 'farm-1', farmerId: 'someone-else' } });
    await expect(svc.create(dto)).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.serviceRequest.create).not.toHaveBeenCalled();
  });
  it('404s for an unknown farm or farmer', async () => {
    await expect(build({ farm: null }).svc.create(dto)).rejects.toBeInstanceOf(NotFoundException);
    await expect(build({ farmer: null }).svc.create(dto)).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('CreateServiceRequestDto', () => {
  const fields = async (o: object) => (await validate(plainToInstance(CreateServiceRequestDto, o))).map((e) => e.property);
  it('accepts a valid type with an optional note', async () => { expect(await fields({ ...dto, description: 'Morning visits work best.' })).toEqual([]); });
  it('rejects an invalid service type and missing ids', async () => {
    expect(await fields({ ...dto, type: 'MAGIC' })).toEqual(['type']);
    expect(await fields({})).toEqual(expect.arrayContaining(['farmerId', 'farmId', 'type']));
  });
  it('rejects an over-long note', async () => { expect(await fields({ ...dto, description: 'x'.repeat(501) })).toEqual(['description']); });
});
