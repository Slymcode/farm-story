import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { IdGeneratorService } from '../prisma/id-generator.service';
import { AuthUser } from '../auth/auth.types';
import { assertOwnsFarmer, NOT_YOURS, ownFarmerId } from '../auth/ownership';
import { requestsToCsv } from './service-request.export';
import { CreateServiceRequestDto } from './dto/service-request.dto';
import { SubmitAssessmentDto } from './dto/workflow.dto';
import { Status, manualStatusError } from './request-workflow';

const STATUSES = ['PENDING', 'IN_REVIEW', 'ASSIGNED', 'COMPLETED', 'CANCELLED'];
const agronomistSelect = { select: { id: true, fullName: true, county: true } };
const include = {
  farmer: { select: { id: true, farmerId: true, fullName: true, county: true, mobileNumber: true } },
  farm: { select: { id: true, farmName: true, location: true, latitude: true, longitude: true, primaryCrop: true, sizeAcres: true } },
  agronomist: agronomistSelect,
} satisfies Prisma.ServiceRequestInclude;
/** Detail view adds the assessment and the full timeline. */
const detailInclude = {
  ...include,
  assessment: { include: { agronomist: agronomistSelect } },
  events: { orderBy: { createdAt: 'asc' as const } },
} satisfies Prisma.ServiceRequestInclude;

type Actor = { role: 'FARMER' | 'ADMIN' | 'AGRONOMIST' | 'SYSTEM'; name?: string };
const ADMIN: Actor = { role: 'ADMIN', name: 'Farm Story admin (demo)' };
const startOfTodayUtc = () => { const d = new Date(); d.setUTCHours(0, 0, 0, 0); return d; };

@Injectable()
export class ServiceRequestService {
  constructor(private readonly prisma: PrismaService, private readonly ids: IdGeneratorService) {}

  async create(dto: CreateServiceRequestDto, actor?: AuthUser) {
    const farm = await this.prisma.farm.findUnique({ where: { id: dto.farmId } });
    if (!farm) throw new NotFoundException('We could not find this farm.');
    if (actor) {
      // A logged-in farmer can only request services for their own farm, and the farmer is taken from the session, not the browser.
      const own = await ownFarmerId(this.prisma, actor);
      if (!own || farm.farmerId !== own) throw new ForbiddenException(NOT_YOURS);
      dto.farmerId = own;
    }
    const farmer = await this.prisma.farmer.findFirst({ where: { OR: [{ id: dto.farmerId }, { farmerId: dto.farmerId }] } });
    if (!farmer) throw new NotFoundException('We could not find this farmer.');
    // Business rule: a request can only be made for a farm the farmer owns.
    if (farm.farmerId !== farmer.id) throw new BadRequestException('This farm does not belong to this farmer.');

    const requestId = await this.ids.nextRequestId();
    return this.prisma.serviceRequest.create({
      data: {
        requestId, farmerId: farmer.id, farmId: farm.id, type: dto.type, description: dto.description,
        events: { create: { type: 'REQUEST_CREATED', toStatus: 'PENDING', actorRole: 'FARMER', actorName: actor?.name ?? farmer.fullName, message: 'Request submitted by the farmer.' } },
      },
      include,
    });
  }

  async list(q: { status?: string; farmerId?: string; outstanding?: string; page?: number; pageSize?: number }, actor?: AuthUser) {
    const page = Math.max(1, Number(q.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(q.pageSize) || 50));
    const where: Prisma.ServiceRequestWhereInput = {};
    if (q.status) where.status = q.status as any;
    else if (q.outstanding === 'true') where.status = { in: ['PENDING', 'IN_REVIEW', 'ASSIGNED'] };
    if (actor) where.farmerId = (await ownFarmerId(this.prisma, actor)) ?? 'no-farmer-yet'; // a farmer only ever lists their own requests, whatever the query says
    else if (q.farmerId) where.farmerId = q.farmerId;
    const [total, items] = await this.prisma.$transaction([
      this.prisma.serviceRequest.count({ where }),
      this.prisma.serviceRequest.findMany({ where, include, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
    ]);
    return { items, total, page, pageSize };
  }

  /** CSV of real database rows. Respects the same status / outstanding filters as the list (no pagination, capped). */
  async exportCsv(q: { status?: string; outstanding?: string }) {
    const where: Prisma.ServiceRequestWhereInput = {};
    if (q.status && STATUSES.includes(q.status)) where.status = q.status as any;
    else if (q.outstanding === 'true') where.status = { in: ['PENDING', 'IN_REVIEW', 'ASSIGNED'] };
    const items = await this.prisma.serviceRequest.findMany({ where, include, orderBy: { createdAt: 'desc' }, take: 10000 });
    return requestsToCsv(items);
  }

  async findOne(idOrRequestId: string, actor?: AuthUser) {
    const r = await this.prisma.serviceRequest.findFirst({ where: { OR: [{ id: idOrRequestId }, { requestId: idOrRequestId }] }, include: detailInclude });
    if (!r) throw new NotFoundException('We could not find this request.');
    await assertOwnsFarmer(this.prisma, actor, r.farmerId);
    return r;
  }

  /** Lifecycle events, oldest first. Same ownership rule as the request itself. */
  async timeline(idOrRequestId: string, actor?: AuthUser) {
    const r = await this.findOne(idOrRequestId, actor);
    return { requestId: r.requestId, status: r.status, events: r.events };
  }

  /**
   * Manual status control (admin): only IN_REVIEW and CANCELLED, and only along valid transitions.
   * ASSIGNED / COMPLETED have their own actions so the agronomist workflow cannot be skipped.
   */
  async updateStatus(id: string, status: string) {
    const r = await this.findOne(id);
    const error = manualStatusError(r.status as Status, status as Status);
    if (error) throw new BadRequestException(error);
    const isCancel = status === 'CANCELLED';
    return this.transition(r.id, r.status as Status, status as Status, {}, {
      type: isCancel ? 'REQUEST_CANCELLED' : 'REQUEST_REVIEWED',
      actor: ADMIN,
      message: isCancel ? 'Request cancelled by the Farm Story team.' : 'Request is being reviewed by the Farm Story team.',
    });
  }

  /** Assign (or reassign) an active agronomist. PENDING requests are implicitly reviewed first. */
  async assign(id: string, agronomistId: string) {
    const r = await this.findOne(id);
    const status = r.status as Status;
    if (status === 'COMPLETED' || status === 'CANCELLED') throw new BadRequestException(`This request is already ${status.toLowerCase()} and cannot be assigned.`);
    const agronomist = await this.prisma.agronomist.findUnique({ where: { id: agronomistId } });
    if (!agronomist) throw new NotFoundException('We could not find this agronomist.');
    if (agronomist.status !== 'ACTIVE') throw new BadRequestException('This agronomist is inactive and cannot take new requests.');
    if (r.assignedAgronomistId === agronomist.id) throw new BadRequestException(`${agronomist.fullName} is already assigned to this request.`);
    if (r.assessment) throw new BadRequestException('An assessment has already been submitted, so this request can no longer be reassigned.');

    const previous = r.agronomist?.fullName;
    const events: Prisma.ServiceRequestEventCreateWithoutServiceRequestInput[] = [];
    if (status === 'PENDING') {
      events.push({ type: 'REQUEST_REVIEWED', fromStatus: 'PENDING', toStatus: 'IN_REVIEW', actorRole: ADMIN.role, actorName: ADMIN.name, message: 'Request reviewed by the Farm Story team.' });
    }
    events.push({
      type: 'AGRONOMIST_ASSIGNED', fromStatus: status === 'PENDING' ? 'IN_REVIEW' : status, toStatus: 'ASSIGNED', actorRole: ADMIN.role, actorName: ADMIN.name,
      message: previous ? `Reassigned from ${previous} to ${agronomist.fullName}.` : `Assigned to agronomist ${agronomist.fullName}.`,
    });
    const res = await this.prisma.serviceRequest.updateMany({
      where: { id: r.id, status: status as any },
      data: { status: 'ASSIGNED', assignedAgronomistId: agronomist.id, assignedAt: new Date() },
    });
    if (res.count === 0) throw new ConflictException('This request was just updated by someone else. Please refresh and try again.');
    await this.prisma.serviceRequestEvent.createMany({ data: events.map((e) => ({ ...(e as any), serviceRequestId: r.id })) });
    return this.findOne(r.id);
  }

  /** The assigned agronomist records their field assessment (only while ASSIGNED). Editable until the request is completed. */
  async submitAssessment(id: string, agronomistId: string, dto: SubmitAssessmentDto) {
    const r = await this.findOne(id);
    this.assertAssignedTo(r, agronomistId);
    if (r.status !== 'ASSIGNED') throw new BadRequestException('An assessment can only be submitted while the request is assigned.');
    const followUpRequired = dto.followUpRequired ?? false;
    if (followUpRequired) {
      if (!dto.followUpDate) throw new BadRequestException('Please choose a follow-up date.');
      if (dto.followUpDate < startOfTodayUtc()) throw new BadRequestException('The follow-up date cannot be in the past.');
    }
    const data = {
      summary: dto.summary, observations: dto.observations ?? null, recommendedActions: dto.recommendedActions ?? null,
      followUpRequired, followUpDate: followUpRequired ? dto.followUpDate! : null,
    };
    const first = !r.assessment;
    await this.prisma.agronomistAssessment.upsert({
      where: { serviceRequestId: r.id },
      create: { ...data, serviceRequestId: r.id, agronomistId },
      update: data,
    });
    if (first) {
      await this.prisma.serviceRequestEvent.create({
        data: { serviceRequestId: r.id, type: 'ASSESSMENT_SUBMITTED', actorRole: 'AGRONOMIST', actorName: r.agronomist?.fullName, message: 'Field assessment submitted by the agronomist.' },
      });
    }
    return this.findOne(r.id);
  }

  /** Completing requires an assessment: a visit is only "completed" once there is a recorded outcome. */
  async complete(id: string, agronomistId: string) {
    const r = await this.findOne(id);
    this.assertAssignedTo(r, agronomistId);
    if (r.status !== 'ASSIGNED') throw new BadRequestException(r.status === 'COMPLETED' ? 'This request is already completed.' : 'Only an assigned request can be completed.');
    if (!r.assessment) throw new BadRequestException('Please submit your assessment before completing this request.');
    await this.transition(r.id, 'ASSIGNED', 'COMPLETED', {}, {
      type: 'REQUEST_COMPLETED', actor: { role: 'AGRONOMIST', name: r.agronomist?.fullName }, message: 'Request completed by the agronomist.',
    });
    return this.findOne(r.id);
  }

  private assertAssignedTo(r: { assignedAgronomistId: string | null }, agronomistId: string) {
    if (r.assignedAgronomistId !== agronomistId) throw new ForbiddenException('This request is not assigned to you.');
  }

  /** Compare-and-set status change plus its event, so two people acting at once cannot both succeed. */
  private async transition(
    id: string, from: Status, to: Status, extra: Prisma.ServiceRequestUpdateManyMutationInput,
    ev: { type: 'REQUEST_REVIEWED' | 'REQUEST_CANCELLED' | 'REQUEST_COMPLETED'; actor: Actor; message: string },
  ) {
    const res = await this.prisma.serviceRequest.updateMany({ where: { id, status: from as any }, data: { status: to as any, ...extra } });
    if (res.count === 0) throw new ConflictException('This request was just updated by someone else. Please refresh and try again.');
    await this.prisma.serviceRequestEvent.create({
      data: { serviceRequestId: id, type: ev.type, fromStatus: from as any, toStatus: to as any, actorRole: ev.actor.role, actorName: ev.actor.name, message: ev.message },
    });
    return this.findOne(id);
  }
}
