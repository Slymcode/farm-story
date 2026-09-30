import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { IdGeneratorService } from '../prisma/id-generator.service';
import { presentInsight } from '../insight/farm-insight.engine';
import { CreateFarmerDto } from './dto/create-farmer.dto';

export interface ListFarmersQuery { search?: string; county?: string; crop?: string; page?: number; pageSize?: number }

@Injectable()
export class FarmerService {
  constructor(private readonly prisma: PrismaService, private readonly ids: IdGeneratorService) {}

  async create(dto: CreateFarmerDto) {
    const farmerId = await this.ids.nextFarmerId();
    return this.prisma.farmer.create({ data: { ...dto, farmerId, country: 'Kenya' } });
  }

  /** Accepts either the internal UUID or the public Farm Story ID (FS-KEN-000001). */
  async findOne(idOrPublicId: string) {
    const farmer = await this.prisma.farmer.findFirst({
      where: { OR: [{ id: idOrPublicId }, { farmerId: idOrPublicId }] },
      include: {
        farms: { include: { insight: true }, orderBy: { createdAt: 'asc' } },
        serviceRequests: { orderBy: { createdAt: 'desc' }, include: { farm: { select: { farmName: true } } } },
      },
    });
    if (!farmer) throw new NotFoundException('We could not find this farmer.');
    return { ...farmer, farms: farmer.farms.map((f) => ({ ...f, insight: presentInsight(f.insight) })) };
  }

  /** Admin list: search + filters + pagination, with score and request count for the table. */
  async list(q: ListFarmersQuery) {
    const page = Math.max(1, Number(q.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(q.pageSize) || 20));
    const where: Prisma.FarmerWhereInput = {};
    if (q.search?.trim()) {
      const s = q.search.trim();
      where.OR = [
        { fullName: { contains: s, mode: 'insensitive' } },
        { farmerId: { contains: s, mode: 'insensitive' } },
        { farms: { some: { farmName: { contains: s, mode: 'insensitive' } } } },
      ];
    }
    if (q.county) where.county = q.county;
    if (q.crop) where.farms = { some: { primaryCrop: q.crop as any } };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.farmer.count({ where }),
      this.prisma.farmer.findMany({
        where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize,
        include: {
          farms: { take: 1, orderBy: { createdAt: 'asc' }, include: { insight: { select: { opportunityScore: true, healthStatus: true } } } },
          _count: { select: { serviceRequests: true } },
        },
      }),
    ]);
    const items = rows.map(({ farms, _count, ...f }) => {
      const farm = farms[0];
      return {
        ...f,
        farm: farm ? { id: farm.id, farmName: farm.farmName, primaryCrop: farm.primaryCrop, sizeAcres: farm.sizeAcres } : null,
        opportunityScore: farm?.insight?.opportunityScore ?? null,
        healthStatus: farm?.insight?.healthStatus ?? null,
        requestCount: _count.serviceRequests,
      };
    });
    return { items, total, page, pageSize };
  }
}
