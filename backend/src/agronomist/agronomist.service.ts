import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { presentInsight } from '../insight/farm-insight.engine';
import { ServiceRequestService } from '../service-request/service-request.service';
import { SubmitAssessmentDto } from '../service-request/dto/workflow.dto';
import { CreateAgronomistDto, UpdateAgronomistDto } from './dto/agronomist.dto';

const FOLLOW_UP_WINDOW_DAYS = 7;
const requestInclude = {
  farmer: { select: { id: true, farmerId: true, fullName: true, county: true, mobileNumber: true } },
  farm: { select: { id: true, farmName: true, location: true, latitude: true, longitude: true, primaryCrop: true, sizeAcres: true } },
  assessment: true,
} satisfies Prisma.ServiceRequestInclude;

/** Follow-up is "due" when it is required and falls on/before the end of the look-ahead window (overdue ones included). */
export function followUpCutoff(now = new Date()) {
  const d = new Date(now); d.setUTCHours(23, 59, 59, 999); d.setUTCDate(d.getUTCDate() + FOLLOW_UP_WINDOW_DAYS); return d;
}

@Injectable()
export class AgronomistService {
  constructor(private readonly prisma: PrismaService, private readonly requests: ServiceRequestService) {}

  // ---- Admin management ------------------------------------------------------------------------------------------
  async list(q: { status?: string } = {}) {
    const where: Prisma.AgronomistWhereInput = q.status === 'ACTIVE' || q.status === 'INACTIVE' ? { status: q.status } : {};
    const items = await this.prisma.agronomist.findMany({ where, orderBy: [{ status: 'asc' }, { fullName: 'asc' }] });
    const counts = await this.prisma.serviceRequest.groupBy({ by: ['assignedAgronomistId', 'status'], where: { assignedAgronomistId: { not: null } }, _count: { _all: true } });
    return items.map((a) => {
      const mine = counts.filter((c) => c.assignedAgronomistId === a.id);
      const n = (s: string) => mine.find((c) => c.status === s)?._count._all ?? 0;
      return { ...a, openRequests: n('ASSIGNED'), completedRequests: n('COMPLETED') };
    });
  }

  async create(dto: CreateAgronomistDto) {
    if (await this.prisma.agronomist.findUnique({ where: { email: dto.email } })) throw new ConflictException('An agronomist with this email already exists.');
    return this.prisma.agronomist.create({ data: { ...dto, specialties: dto.specialties ?? [] } as any });
  }

  async update(id: string, dto: UpdateAgronomistDto) {
    await this.get(id);
    return this.prisma.agronomist.update({ where: { id }, data: dto as any });
  }

  async get(id: string) {
    const a = await this.prisma.agronomist.findUnique({ where: { id } });
    if (!a) throw new NotFoundException('We could not find this agronomist.');
    return a;
  }

  // ---- Agronomist workspace (prototype: identity comes from the "viewing as" selector, not a login) -----------------
  async dashboard(id: string) {
    const agronomist = await this.get(id);
    const [assigned, pendingVisits, completed, followUpsDue, upcoming] = await Promise.all([
      this.prisma.serviceRequest.count({ where: { assignedAgronomistId: id, status: 'ASSIGNED' } }),
      this.prisma.serviceRequest.count({ where: { assignedAgronomistId: id, status: 'ASSIGNED', assessment: null } }),
      this.prisma.serviceRequest.count({ where: { assignedAgronomistId: id, status: 'COMPLETED' } }),
      this.prisma.agronomistAssessment.count({ where: { agronomistId: id, followUpRequired: true, followUpDate: { lte: followUpCutoff() } } }),
      this.prisma.agronomistAssessment.findMany({
        where: { agronomistId: id, followUpRequired: true, followUpDate: { lte: followUpCutoff() } }, orderBy: { followUpDate: 'asc' }, take: 5,
        include: { serviceRequest: { select: { id: true, requestId: true, type: true, farm: { select: { farmName: true } }, farmer: { select: { fullName: true } } } } },
      }),
    ]);
    return { agronomist, kpis: { assignedRequests: assigned, pendingVisits, completedVisits: completed, followUpsDue }, followUps: upcoming, followUpWindowDays: FOLLOW_UP_WINDOW_DAYS };
  }

  async myRequests(id: string, q: { status?: string } = {}) {
    await this.get(id);
    const where: Prisma.ServiceRequestWhereInput = { assignedAgronomistId: id };
    if (q.status && ['ASSIGNED', 'COMPLETED'].includes(q.status)) where.status = q.status as any;
    return this.prisma.serviceRequest.findMany({ where, include: requestInclude, orderBy: [{ status: 'asc' }, { assignedAt: 'desc' }], take: 200 });
  }

  /** Request detail for the assigned agronomist: farmer, farm, current insight + action plan, assessment, timeline. */
  async requestDetail(id: string, requestId: string) {
    await this.get(id);
    const r = await this.prisma.serviceRequest.findFirst({ where: { OR: [{ id: requestId }, { requestId }] }, select: { id: true, assignedAgronomistId: true } });
    if (!r) throw new NotFoundException('We could not find this request.');
    const detail = await this.requests.findOne(r.id);
    if (detail.assignedAgronomistId !== id) throw new ForbiddenException('This request is not assigned to you.');
    const insight = await this.prisma.farmInsight.findUnique({ where: { farmId: detail.farmId } });
    return { ...detail, insight: presentInsight(insight) };
  }

  submitAssessment(id: string, requestId: string, dto: SubmitAssessmentDto) { return this.requests.submitAssessment(requestId, id, dto); }
  complete(id: string, requestId: string) { return this.requests.complete(requestId, id); }
}
