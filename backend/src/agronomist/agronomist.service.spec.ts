import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AgronomistService, followUpCutoff } from './agronomist.service';

function build(over: any = {}) {
  const prisma: any = {
    agronomist: { findUnique: jest.fn(async ({ where }) => (where.id === 'a1' || where.email ? (over.exists ?? { id: 'a1', fullName: 'Grace' }) : null)), create: jest.fn(async ({ data }) => data), update: jest.fn() },
    serviceRequest: { count: jest.fn(async ({ where }) => (where.assessment === null ? 2 : where.status === 'COMPLETED' ? 4 : 3)), findFirst: jest.fn(async () => over.request ?? null) },
    agronomistAssessment: { count: jest.fn(async () => 1), findMany: jest.fn(async () => []) },
    farmInsight: { findUnique: jest.fn(async () => null) },
  };
  const requests: any = { findOne: jest.fn(async () => over.detail) };
  return { svc: new AgronomistService(prisma, requests), prisma, requests };
}

describe('AgronomistService', () => {
  it('computes dashboard KPIs from counted rows, scoped to the agronomist', async () => {
    const { svc, prisma } = build();
    const d = await svc.dashboard('a1');
    expect(d.kpis).toEqual({ assignedRequests: 3, pendingVisits: 2, completedVisits: 4, followUpsDue: 1 });
    for (const c of prisma.serviceRequest.count.mock.calls) expect(c[0].where.assignedAgronomistId).toBe('a1');
    expect(prisma.agronomistAssessment.count.mock.calls[0][0].where).toMatchObject({ agronomistId: 'a1', followUpRequired: true });
  });
  it('404s for an unknown agronomist', async () => {
    await expect(build().svc.dashboard('nope')).rejects.toBeInstanceOf(NotFoundException);
  });
  it('rejects a duplicate email', async () => {
    await expect(build({ exists: { id: 'x' } }).svc.create({ fullName: 'A', email: 'a@b.co' } as any)).rejects.toBeInstanceOf(ConflictException);
  });
  it("won't show another agronomist's request", async () => {
    const { svc } = build({ request: { id: 'r1', assignedAgronomistId: 'other' }, detail: { id: 'r1', assignedAgronomistId: 'other', farmId: 'f1' } });
    await expect(svc.requestDetail('a1', 'r1')).rejects.toBeInstanceOf(ForbiddenException);
  });
  it('shows an assigned request with its insight', async () => {
    const { svc } = build({ request: { id: 'r1' }, detail: { id: 'r1', assignedAgronomistId: 'a1', farmId: 'f1' } });
    expect(await svc.requestDetail('a1', 'r1')).toMatchObject({ id: 'r1', insight: null });
  });
  it('treats a follow-up as due when it falls within the next 7 days (overdue included)', () => {
    const now = new Date('2026-10-01T10:00:00Z');
    expect(followUpCutoff(now).toISOString()).toBe('2026-10-08T23:59:59.999Z');
  });
});
