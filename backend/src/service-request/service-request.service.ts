import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { IdGeneratorService } from '../prisma/id-generator.service';
import { CreateServiceRequestDto } from './dto/service-request.dto';

const include = {
  farmer: { select: { id: true, farmerId: true, fullName: true, county: true, mobileNumber: true } },
  farm: { select: { id: true, farmName: true, location: true, latitude: true, longitude: true, primaryCrop: true, sizeAcres: true } },
} satisfies Prisma.ServiceRequestInclude;

@Injectable()
export class ServiceRequestService {
  constructor(private readonly prisma: PrismaService, private readonly ids: IdGeneratorService) {}

  async create(dto: CreateServiceRequestDto) {
    const farm = await this.prisma.farm.findUnique({ where: { id: dto.farmId } });
    if (!farm) throw new NotFoundException('We could not find this farm.');
    const farmer = await this.prisma.farmer.findFirst({ where: { OR: [{ id: dto.farmerId }, { farmerId: dto.farmerId }] } });
    if (!farmer) throw new NotFoundException('We could not find this farmer.');
    // Business rule: a request can only be made for a farm the farmer owns.
    if (farm.farmerId !== farmer.id) throw new BadRequestException('This farm does not belong to this farmer.');

    const requestId = await this.ids.nextRequestId();
    return this.prisma.serviceRequest.create({
      data: { requestId, farmerId: farmer.id, farmId: farm.id, type: dto.type, description: dto.description }, include,
    });
  }

  async list(q: { status?: string; farmerId?: string; outstanding?: string; page?: number; pageSize?: number }) {
    const page = Math.max(1, Number(q.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(q.pageSize) || 50));
    const where: Prisma.ServiceRequestWhereInput = {};
    if (q.status) where.status = q.status as any;
    else if (q.outstanding === 'true') where.status = { in: ['PENDING', 'IN_REVIEW', 'ASSIGNED'] };
    if (q.farmerId) where.farmerId = q.farmerId;
    const [total, items] = await this.prisma.$transaction([
      this.prisma.serviceRequest.count({ where }),
      this.prisma.serviceRequest.findMany({ where, include, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
    ]);
    return { items, total, page, pageSize };
  }

  async findOne(idOrRequestId: string) {
    const r = await this.prisma.serviceRequest.findFirst({ where: { OR: [{ id: idOrRequestId }, { requestId: idOrRequestId }] }, include });
    if (!r) throw new NotFoundException('We could not find this request.');
    return r;
  }

  async updateStatus(id: string, status: string) {
    const r = await this.findOne(id);
    return this.prisma.serviceRequest.update({ where: { id: r.id }, data: { status: status as any }, include });
  }
}
