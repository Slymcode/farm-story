import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../auth/auth.types';
import { assertOwnsFarm } from '../auth/ownership';
import { FarmInsightEngine, presentInsight } from './farm-insight.engine';

@Injectable()
export class InsightService {
  constructor(private readonly prisma: PrismaService, private readonly engine: FarmInsightEngine) {}

  /** Runs the deterministic engine and upserts the single current insight for the farm. */
  async generateForFarm(farmId: string, actor?: AuthUser) {
    await assertOwnsFarm(this.prisma, actor, farmId);
    const farm = await this.prisma.farm.findUnique({ where: { id: farmId } });
    if (!farm) throw new NotFoundException('We could not find this farm.');
    const r = this.engine.generate(farm);
    const data = {
      opportunityScore: r.opportunityScore, healthStatus: r.healthStatus, summary: r.summary,
      insights: r.insights as unknown as Prisma.InputJsonValue,
      recommendations: r.recommendations as unknown as Prisma.InputJsonValue,
      scoreBreakdown: r.scoreBreakdown as unknown as Prisma.InputJsonValue,
    };
    const saved = await this.prisma.farmInsight.upsert({ where: { farmId }, create: { farmId, ...data }, update: { ...data, generatedAt: new Date() } });
    return this.present(saved);
  }

  /** Serves the stored insight; only generates when none exists (no unnecessary recomputation). */
  async getForFarm(farmId: string, actor?: AuthUser) {
    await assertOwnsFarm(this.prisma, actor, farmId);
    const existing = await this.prisma.farmInsight.findUnique({ where: { farmId } });
    return existing ? this.present(existing) : this.generateForFarm(farmId);
  }

  private present<T extends { healthStatus: any }>(i: T) {
    return presentInsight(i)!;
  }
}
