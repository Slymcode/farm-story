import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { IdGeneratorService } from '../prisma/id-generator.service';
import { AuthUser } from '../auth/auth.types';
import { assertOwnsFarmer, NOT_YOURS, ownFarmerId } from '../auth/ownership';
import { requestsToCsv } from './service-request.export';
import { CreateServiceRequestDto } from './dto/service-request.dto';

const STATUSES = ['PENDING', 'IN_REVIEW', 'ASSIGNED', 'COMPLETED', 'CANCELLED'];
const include = {
  farmer: { select: { id: true, farmerId: true, fullName: true, county: true, mobileNumber: true } },
  farm: { select: { id: true, farmName: true, location: true, latitude: true, longitude: true, primaryCrop: true, sizeAcres: true } },
} satisfies Prisma.ServiceRequestInclude;

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
      data: { requestId, farmerId: farmer.id, farmId: farm.id, type: dto.type, description: dto.description }, include,
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
    const r = await this.prisma.serviceRequest.findFirst({ where: { OR: [{ id: idOrRequestId }, { requestId: idOrRequestId }] }, include });
    if (!r) throw new NotFoundException('We could not find this request.');
    await assertOwnsFarmer(this.prisma, actor, r.farmerId);
    return r;
  }

  async updateStatus(id: string, status: string) {
    const r = await this.findOne(id);
    return this.prisma.serviceRequest.update({ where: { id: r.id }, data: { status: status as any }, include });
  }
}
