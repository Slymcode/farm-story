import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InsightService } from '../insight/insight.service';
import { presentInsight } from '../insight/farm-insight.engine';
import { AuthUser } from '../auth/auth.types';
import { NOT_YOURS, ownFarmerId } from '../auth/ownership';
import { publicFarmer } from '../farmer/farmer.service';
import { CreateFarmDto, UpdateFarmDto } from './dto/farm.dto';

const toDate = (v?: string) => (v ? new Date(v) : undefined);

/**
 * Builds the Prisma update payload for a PATCH. Omitted fields stay `undefined`, which Prisma
 * treats as "leave unchanged". Coffee-only fields are touched only when they are explicitly
 * supplied for a coffee farm, or cleared when the crop is explicitly changed away from coffee.
 */
export function buildFarmUpdateData(existing: { primaryCrop: string }, dto: UpdateFarmDto) {
  const nextCrop = dto.primaryCrop ?? existing.primaryCrop;
  const leavingCoffee = existing.primaryCrop === 'COFFEE' && nextCrop !== 'COFFEE';
  const coffee =
    nextCrop === 'COFFEE'
      ? { coffeeVariety: dto.coffeeVariety, coffeeTrees: dto.coffeeTrees }
      : leavingCoffee
        ? { coffeeVariety: [] as string[], coffeeTrees: null }
        : {}; // non-coffee stays non-coffee: coffee fields are not applicable, leave as is
  return {
    farmName: dto.farmName, location: dto.location, latitude: dto.latitude, longitude: dto.longitude,
    sizeAcres: dto.sizeAcres, primaryCrop: dto.primaryCrop,
    ...coffee,
    estimatedAnnualProductionKg: dto.estimatedAnnualProductionKg,
    lastHarvestDate: toDate(dto.lastHarvestDate), lastSoilTestDate: toDate(dto.lastSoilTestDate),
    challenges: dto.challenges ? Array.from(new Set(dto.challenges)) : undefined,
  };
}

@Injectable()
export class FarmService {
  constructor(private readonly prisma: PrismaService, private readonly insights: InsightService) {}

  async create(dto: CreateFarmDto, actor?: AuthUser) {
    // A logged-in farmer always registers a farm for THEIR OWN farmer record; a farmerId sent by the browser is not trusted.
    if (actor) {
      const own = await ownFarmerId(this.prisma, actor);
      if (!own) throw new BadRequestException('Please save your farmer details first.');
      dto.farmerId = own;
    }
    const farmer = await this.prisma.farmer.findFirst({ where: { OR: [{ id: dto.farmerId }, { farmerId: dto.farmerId }] } });
    if (!farmer) throw new NotFoundException('We could not find this farmer. Please register first.');
    const isCoffee = dto.primaryCrop === 'COFFEE';
    const farm = await this.prisma.farm.create({
      data: {
        farmerId: farmer.id, farmName: dto.farmName, location: dto.location, latitude: dto.latitude, longitude: dto.longitude,
        sizeAcres: dto.sizeAcres, primaryCrop: dto.primaryCrop,
        // Coffee-only fields are ignored for other crops.
        coffeeVariety: isCoffee ? dto.coffeeVariety ?? [] : [], coffeeTrees: isCoffee ? dto.coffeeTrees ?? null : null,
        estimatedAnnualProductionKg: dto.estimatedAnnualProductionKg ?? null,
        lastHarvestDate: toDate(dto.lastHarvestDate), lastSoilTestDate: toDate(dto.lastSoilTestDate),
        challenges: Array.from(new Set(dto.challenges)),
      },
    });
    if (actor) await this.prisma.user.update({ where: { id: actor.id }, data: { onboardingCompleted: true } }); // onboarding is done once the farm exists
    await this.insights.generateForFarm(farm.id); // Insight is created as part of farm registration.
    return this.findOne(farm.id, actor);
  }

  async findOne(id: string, actor?: AuthUser) {
    const farm = await this.prisma.farm.findUnique({ where: { id }, include: { farmer: true, insight: true } });
    if (!farm) throw new NotFoundException('We could not find this farm.');
    if (actor && farm.farmer.userId !== actor.id) throw new ForbiddenException(NOT_YOURS);
    return { ...farm, farmer: publicFarmer(farm.farmer), insight: presentInsight(farm.insight) };
  }

  async update(id: string, dto: UpdateFarmDto, actor?: AuthUser) {
    const existing = await this.findOne(id, actor);
    await this.prisma.farm.update({ where: { id }, data: buildFarmUpdateData(existing, dto) });
    await this.insights.generateForFarm(id); // inputs changed → refresh the single current insight
    return this.findOne(id, actor);
  }
}
