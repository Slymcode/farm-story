import 'reflect-metadata';
import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SubmitAssessmentDto } from './dto/workflow.dto';
import { ServiceRequestService } from './service-request.service';

const day = 86_400_000;
const base = { id: 'r1', requestId: 'FS-REQ-000001', farmerId: 'fr1', assignedAgronomistId: null as string | null, agronomist: null as any, assessment: null as any, events: [] };

/** In-memory prisma stand-in: one request, records events, honours the compare-and-set status guard. */
function build(request: any, opts: { agronomist?: any; casFails?: boolean } = {}) {
  const state = { ...request };
  const events: any[] = [];
  const prisma: any = {
    serviceRequest: {
      findFirst: jest.fn(async () => state),
      updateMany: jest.fn(async ({ where, data }) => {
        if (opts.casFails || state.status !== where.status) return { count: 0 };
        Object.assign(state, data); return { count: 1 };
      }),
    },
    serviceRequestEvent: { create: jest.fn(async ({ data }) => events.push(data)), createMany: jest.fn(async ({ data }) => events.push(...data)) },
    agronomist: { findUnique: jest.fn(async () => opts.agronomist ?? null) },
    agronomistAssessment: { upsert: jest.fn(async ({ create }) => { state.assessment = create; }) },
  };
  return { svc: new ServiceRequestService(prisma, {} as any), state, events, prisma };
}
const grace = { id: 'a1', fullName: 'Grace Wanjiku', status: 'ACTIVE' };

describe('assign', () => {
  it('assigns from PENDING and records both the review and the assignment', async () => {
    const { svc, state, events } = build({ ...base, status: 'PENDING' }, { agronomist: grace });
    await svc.assign('r1', 'a1');
    expect(state.status).toBe('ASSIGNED');
    expect(state.assignedAgronomistId).toBe('a1');
    expect(events.map((e) => e.type)).toEqual(['REQUEST_REVIEWED', 'AGRONOMIST_ASSIGNED']);
  });
  it('rejects an inactive or unknown agronomist', async () => {
    await expect(build({ ...base, status: 'PENDING' }, { agronomist: { ...grace, status: 'INACTIVE' } }).svc.assign('r1', 'a1')).rejects.toThrow(/inactive/);
    await expect(build({ ...base, status: 'PENDING' }).svc.assign('r1', 'a1')).rejects.toBeInstanceOf(NotFoundException);
  });
  it('rejects completed and cancelled requests', async () => {
    for (const status of ['COMPLETED', 'CANCELLED']) await expect(build({ ...base, status }, { agronomist: grace }).svc.assign('r1', 'a1')).rejects.toBeInstanceOf(BadRequestException);
  });
  it('rejects assigning the same agronomist twice and reassigning after an assessment', async () => {
    await expect(build({ ...base, status: 'ASSIGNED', assignedAgronomistId: 'a1' }, { agronomist: grace }).svc.assign('r1', 'a1')).rejects.toThrow(/already assigned/);
    await expect(build({ ...base, status: 'ASSIGNED', assignedAgronomistId: 'a2', assessment: { id: 'x' } }, { agronomist: grace }).svc.assign('r1', 'a1')).rejects.toThrow(/assessment/);
  });
  it('records a reassignment with both names', async () => {
    const { svc, events } = build({ ...base, status: 'ASSIGNED', assignedAgronomistId: 'a2', agronomist: { id: 'a2', fullName: 'Brian Otieno' } }, { agronomist: grace });
    await svc.assign('r1', 'a1');
    expect(events.map((e) => e.message)).toEqual(['Reassigned from Brian Otieno to Grace Wanjiku.']);
  });
  it('reports a conflict when someone else changed the request first', async () => {
    await expect(build({ ...base, status: 'PENDING' }, { agronomist: grace, casFails: true }).svc.assign('r1', 'a1')).rejects.toBeInstanceOf(ConflictException);
  });
});

describe('manual status changes', () => {
  it('moves PENDING to IN_REVIEW with an event, and blocks ASSIGNED / COMPLETED', async () => {
    const { svc, state, events } = build({ ...base, status: 'PENDING' });
    await svc.updateStatus('r1', 'IN_REVIEW');
    expect(state.status).toBe('IN_REVIEW');
    expect(events[0]).toMatchObject({ type: 'REQUEST_REVIEWED', fromStatus: 'PENDING', toStatus: 'IN_REVIEW' });
    await expect(svc.updateStatus('r1', 'ASSIGNED')).rejects.toBeInstanceOf(BadRequestException);
    await expect(svc.updateStatus('r1', 'COMPLETED')).rejects.toBeInstanceOf(BadRequestException);
  });
  it('cancels with an event and then refuses further changes', async () => {
    const { svc, events } = build({ ...base, status: 'IN_REVIEW' });
    await svc.updateStatus('r1', 'CANCELLED');
    expect(events[0].type).toBe('REQUEST_CANCELLED');
    await expect(svc.updateStatus('r1', 'IN_REVIEW')).rejects.toThrow(/already cancelled/);
  });
});

describe('assessment and completion', () => {
  const assigned = { ...base, status: 'ASSIGNED', assignedAgronomistId: 'a1', agronomist: { id: 'a1', fullName: 'Grace Wanjiku' } };
  const dto = (o: Partial<SubmitAssessmentDto> = {}) => ({ summary: 'Trees look healthy.', ...o }) as SubmitAssessmentDto;

  it('only the assigned agronomist may submit or complete', async () => {
    const { svc } = build(assigned);
    await expect(svc.submitAssessment('r1', 'someone-else', dto())).rejects.toBeInstanceOf(ForbiddenException);
    await expect(svc.complete('r1', 'someone-else')).rejects.toBeInstanceOf(ForbiddenException);
  });
  it('needs ASSIGNED status for an assessment', async () => {
    await expect(build({ ...assigned, status: 'PENDING' }).svc.submitAssessment('r1', 'a1', dto())).rejects.toBeInstanceOf(BadRequestException);
  });
  it('requires a future follow-up date when a follow-up is needed', async () => {
    const { svc } = build(assigned);
    await expect(svc.submitAssessment('r1', 'a1', dto({ followUpRequired: true }))).rejects.toThrow(/follow-up date/);
    await expect(svc.submitAssessment('r1', 'a1', dto({ followUpRequired: true, followUpDate: new Date(Date.now() - 3 * day) }))).rejects.toThrow(/past/);
  });
  it('stores the assessment and records the event once', async () => {
    const { svc, events, prisma } = build(assigned);
    await svc.submitAssessment('r1', 'a1', dto({ followUpRequired: true, followUpDate: new Date(Date.now() + 5 * day) }));
    expect(prisma.agronomistAssessment.upsert).toHaveBeenCalled();
    expect(events.map((e) => e.type)).toEqual(['ASSESSMENT_SUBMITTED']);
  });
  it('drops the follow-up date when no follow-up is needed', async () => {
    const { svc, prisma } = build(assigned);
    await svc.submitAssessment('r1', 'a1', dto({ followUpRequired: false, followUpDate: new Date(Date.now() + 5 * day) }));
    expect(prisma.agronomistAssessment.upsert.mock.calls[0][0].create.followUpDate).toBeNull();
  });
  it('cannot complete without an assessment, and completes with one', async () => {
    await expect(build(assigned).svc.complete('r1', 'a1')).rejects.toThrow(/submit your assessment/);
    const { svc, state, events } = build({ ...assigned, assessment: { id: 'as1' } });
    await svc.complete('r1', 'a1');
    expect(state.status).toBe('COMPLETED');
    expect(events[0]).toMatchObject({ type: 'REQUEST_COMPLETED', fromStatus: 'ASSIGNED', toStatus: 'COMPLETED' });
  });
});

describe('timeline ownership', () => {
  it("a logged-in farmer cannot read another farmer's timeline, but can read their own", async () => {
    const { svc, prisma } = build({ ...base, status: 'PENDING', events: [{ type: 'REQUEST_CREATED' }] });
    prisma.farmer = { findUnique: jest.fn(async () => ({ userId: 'owner' })) };
    await expect(svc.timeline('r1', { id: 'intruder' } as any)).rejects.toBeInstanceOf(ForbiddenException);
    expect((await svc.timeline('r1', { id: 'owner' } as any)).events).toHaveLength(1);
  });
});

describe('SubmitAssessmentDto', () => {
  const fields = async (o: object) => (await validate(plainToInstance(SubmitAssessmentDto, o))).map((e) => e.property);
  it('requires a summary and a valid date', async () => {
    expect(await fields({})).toEqual(['summary']);
    expect(await fields({ summary: 'ok', followUpRequired: true, followUpDate: 'not-a-date' })).toEqual(['followUpDate']);
    expect(await fields({ summary: 'ok', followUpRequired: true, followUpDate: '2030-01-01' })).toEqual([]);
  });
});
