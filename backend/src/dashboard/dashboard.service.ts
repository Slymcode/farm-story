import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  /** Every figure is computed from the database — nothing is hardcoded. */
  async summary() {
    const [farmers, farms, acres, coffee, requests, outstanding, avgScore, byStatus] = await Promise.all([
      this.prisma.farmer.count(),
      this.prisma.farm.count(),
      this.prisma.farm.aggregate({ _sum: { sizeAcres: true } }),
      this.prisma.farm.aggregate({ _sum: { estimatedAnnualProductionKg: true }, where: { primaryCrop: 'COFFEE' } }),
      this.prisma.serviceRequest.count(),
      this.prisma.serviceRequest.count({ where: { status: { in: ['PENDING', 'IN_REVIEW', 'ASSIGNED'] } } }),
      this.prisma.farmInsight.aggregate({ _avg: { opportunityScore: true } }),
      this.prisma.serviceRequest.groupBy({ by: ['status'], _count: { _all: true } }),
    ]);
    return {
      farmersOnboarded: farmers, farms,
      totalAcres: Math.round((acres._sum.sizeAcres ?? 0) * 10) / 10,
      estimatedAnnualCoffeeProductionKg: Math.round(coffee._sum.estimatedAnnualProductionKg ?? 0),
      serviceRequests: requests, outstandingRequests: outstanding,
      averageOpportunityScore: avgScore._avg.opportunityScore == null ? null : Math.round(avgScore._avg.opportunityScore),
      requestsByStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count._all])),
    };
  }

  async locations() {
    const [farmers, farms] = await Promise.all([
      this.prisma.farmer.groupBy({ by: ['county'], _count: { _all: true }, orderBy: { _count: { county: 'desc' } } }),
      this.prisma.farm.findMany({
        select: { id: true, farmName: true, latitude: true, longitude: true, primaryCrop: true, sizeAcres: true, farmer: { select: { id: true, county: true, fullName: true } } },
      }),
    ]);
    const acresByCounty = new Map<string, number>();
    farms.forEach((f) => acresByCounty.set(f.farmer.county, (acresByCounty.get(f.farmer.county) ?? 0) + f.sizeAcres));
    return {
      counties: farmers.map((c) => ({ county: c.county, farmers: c._count._all, acres: Math.round((acresByCounty.get(c.county) ?? 0) * 10) / 10 })),
      markers: farms.map((f) => ({ farmId: f.id, farmerId: f.farmer.id, farmName: f.farmName, farmerName: f.farmer.fullName, county: f.farmer.county, latitude: f.latitude, longitude: f.longitude, primaryCrop: f.primaryCrop, sizeAcres: f.sizeAcres })),
    };
  }

  recentFarmers(limit = 5) {
    return this.prisma.farmer.findMany({
      orderBy: { createdAt: 'desc' }, take: limit,
      select: { id: true, farmerId: true, fullName: true, county: true, createdAt: true, farms: { take: 1, select: { farmName: true, primaryCrop: true, sizeAcres: true } } },
    });
  }
}
