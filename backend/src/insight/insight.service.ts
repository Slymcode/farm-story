import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../auth/auth.types';
import { assertOwnsFarm } from '../auth/ownership';
import { FarmInsightEngine, STATUS_LABELS, DISCLAIMER, presentInsight } from './farm-insight.engine';
import { explainChange, snapshotHash, SnapshotLike } from './insight-history';

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
    await this.recordSnapshot(farmId, r);
    return this.present(saved);
  }

  /** Stores a history row only when the engine's conclusion changed since the last one (no duplicate rows on repeated refreshes). */
  private async recordSnapshot(farmId: string, r: SnapshotLike) {
    const contentHash = snapshotHash(r);
    const last = await this.prisma.farmInsightSnapshot.findFirst({ where: { farmId }, orderBy: { createdAt: 'desc' }, select: { contentHash: true } });
    if (last?.contentHash === contentHash) return;
    await this.prisma.farmInsightSnapshot.create({
      data: {
        farmId, contentHash, opportunityScore: r.opportunityScore, healthStatus: r.healthStatus as any,
        scoreBreakdown: r.scoreBreakdown as unknown as Prisma.InputJsonValue,
        recommendations: r.recommendations as unknown as Prisma.InputJsonValue,
      },
    });
  }

  /** Past engine results (oldest first, capped) with a data-only explanation of what changed since the previous one. */
  async history(farmId: string, actor?: AuthUser) {
    await assertOwnsFarm(this.prisma, actor, farmId);
    const farm = await this.prisma.farm.findUnique({ where: { id: farmId }, select: { id: true } });
    if (!farm) throw new NotFoundException('We could not find this farm.');
    const rows = (await this.prisma.farmInsightSnapshot.findMany({ where: { farmId }, orderBy: { createdAt: 'desc' }, take: 50 })).reverse();
    const snapshots = rows.map((row, i) => {
      const cur: SnapshotLike = { opportunityScore: row.opportunityScore, healthStatus: row.healthStatus, scoreBreakdown: row.scoreBreakdown as any, recommendations: row.recommendations as any };
      const prevRow = rows[i - 1];
      const prev: SnapshotLike | null = prevRow ? { opportunityScore: prevRow.opportunityScore, healthStatus: prevRow.healthStatus, scoreBreakdown: prevRow.scoreBreakdown as any, recommendations: prevRow.recommendations as any } : null;
      return {
        id: row.id, createdAt: row.createdAt, opportunityScore: row.opportunityScore, healthStatus: row.healthStatus,
        statusLabel: STATUS_LABELS[row.healthStatus as keyof typeof STATUS_LABELS], recommendationCount: cur.recommendations.length,
        change: explainChange(prev, cur),
      };
    });
    return {
      farmId, snapshots, latestChange: snapshots.length ? snapshots[snapshots.length - 1].change : null,
      note: 'The opportunity score shows where support or better information could help. A lower score means fewer gaps were identified in the information recorded; it does not prove improvement.',
      disclaimer: DISCLAIMER,
    };
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
