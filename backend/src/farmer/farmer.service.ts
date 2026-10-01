import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { IdGeneratorService } from '../prisma/id-generator.service';
import { presentInsight } from '../insight/farm-insight.engine';
import { farmersToCsv } from './farmer.export';
import { AuthUser } from '../auth/auth.types';
import { NOT_YOURS } from '../auth/ownership';
import { CreateFarmerDto } from './dto/create-farmer.dto';

const EXPORT_LIMIT = 10000;
/** The linked login account id is internal; it is never sent to API clients. */
export const publicFarmer = <T extends { userId?: string | null }>({ userId: _userId, ...rest }: T): Omit<T, 'userId'> => rest;

export interface ListFarmersQuery { search?: string; county?: string; crop?: string; page?: number; pageSize?: number }

@Injectable()
export class FarmerService {
  constructor(private readonly prisma: PrismaService, private readonly ids: IdGeneratorService) {}

  /**
   * Registers a farmer. When a logged-in farmer calls this, the record is linked to their account and the call is
   * idempotent: if they already saved their details (e.g. closed the app mid-onboarding) the same record is updated, so a
   * resumed onboarding never creates a second Farmer.
   */
  async create(dto: CreateFarmerDto, actor?: AuthUser) {
    if (actor) {
      const existing = await this.prisma.farmer.findUnique({ where: { userId: actor.id } });
      if (existing) return publicFarmer(await this.prisma.farmer.update({ where: { id: existing.id }, data: { ...dto } }));
    }
    const farmerId = await this.ids.nextFarmerId();
    return publicFarmer(await this.prisma.farmer.create({ data: { ...dto, farmerId, country: 'Kenya', ...(actor ? { userId: actor.id } : {}) } }));
  }

  /** Accepts either the internal UUID or the public Farm Story ID (FS-KEN-000001). */
  async findOne(idOrPublicId: string, actor?: AuthUser) {
    const farmer = await this.prisma.farmer.findFirst({
      where: { OR: [{ id: idOrPublicId }, { farmerId: idOrPublicId }] },
      include: {
        farms: { include: { insight: true }, orderBy: { createdAt: 'asc' } },
        serviceRequests: { orderBy: { createdAt: 'desc' }, include: { farm: { select: { farmName: true } } } },
      },
    });
    if (!farmer) throw new NotFoundException('We could not find this farmer.');
    if (actor && farmer.userId !== actor.id) throw new ForbiddenException(NOT_YOURS); // farmers only see their own record
    return { ...publicFarmer(farmer), farms: farmer.farms.map((f) => ({ ...f, insight: presentInsight(f.insight) })) };
  }

  /** Admin list: search + filters + pagination, with score and request count for the table. */
  async list(q: ListFarmersQuery) {
    const page = Math.max(1, Number(q.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(q.pageSize) || 20));
    const where = this.buildWhere(q);

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
    const items = rows.map(({ farms, _count, userId: _u, ...f }) => {
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

  /** Shared by the admin list and the CSV export so exports respect the same filters. */
  private buildWhere(q: ListFarmersQuery): Prisma.FarmerWhereInput {
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
    return where;
  }

  /** CSV of real database rows (same filters as the list, no pagination, capped for safety). */
  async exportCsv(q: ListFarmersQuery) {
    const farmers = await this.prisma.farmer.findMany({
      where: this.buildWhere(q), orderBy: { createdAt: 'desc' }, take: EXPORT_LIMIT,
      include: { farms: { orderBy: { createdAt: 'asc' }, include: { insight: { select: { opportunityScore: true, healthStatus: true } } } } },
    });
    return farmersToCsv(farmers);
  }
}
