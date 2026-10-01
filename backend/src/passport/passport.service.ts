import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../auth/auth.types';
import { assertOwnsFarm } from '../auth/ownership';

/** The ONLY fields that may appear on a public Farm Passport. Anything not listed here is private by default. */
export interface PublicPassport {
  publicId: string;
  farmName: string;
  county: string;
  country: string;
  primaryCrop: string;
  coffeeVarieties: string[];
  sizeAcres: number;
  registeredSince: Date;
  completedVisits: number;
  notice: string;
}

export const PASSPORT_NOTICE =
  'This page shows basic, farmer-shared farm details only. It is not a certification, quality grade or credit assessment.';

/** Pure mapper so the privacy boundary is unit-testable: picks public fields explicitly, never spreads a record. */
export function toPublicPassport(f: {
  publicId: string; farmName: string; primaryCrop: string; coffeeVariety: string[]; sizeAcres: number; createdAt: Date;
  farmer: { county: string; country: string }; _count: { serviceRequests: number };
}): PublicPassport {
  return {
    publicId: f.publicId, farmName: f.farmName, county: f.farmer.county, country: f.farmer.country, primaryCrop: f.primaryCrop,
    coffeeVarieties: f.coffeeVariety, sizeAcres: f.sizeAcres, registeredSince: f.createdAt, completedVisits: f._count.serviceRequests, notice: PASSPORT_NOTICE,
  };
}

@Injectable()
export class PassportService {
  constructor(private readonly prisma: PrismaService) {}

  async getPublic(publicId: string): Promise<PublicPassport> {
    const farm = await this.prisma.farm.findUnique({
      where: { publicId },
      select: {
        publicId: true, farmName: true, primaryCrop: true, coffeeVariety: true, sizeAcres: true, createdAt: true,
        farmer: { select: { county: true, country: true } },
        _count: { select: { serviceRequests: { where: { status: 'COMPLETED' } } } },
      },
    });
    if (!farm) throw new NotFoundException('We could not find this Farm Passport.');
    return toPublicPassport(farm);
  }

  /** Gives the farm a new public id, so a previously shared link or QR code stops working. Owner only. */
  async rotate(farmId: string, actor?: AuthUser) {
    await assertOwnsFarm(this.prisma, actor, farmId);
    const farm = await this.prisma.farm.findUnique({ where: { id: farmId }, select: { id: true } });
    if (!farm) throw new NotFoundException('We could not find this farm.');
    const updated = await this.prisma.farm.update({ where: { id: farmId }, data: { publicId: randomUUID() }, select: { publicId: true } });
    return { publicId: updated.publicId };
  }
}
