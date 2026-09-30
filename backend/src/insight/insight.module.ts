import { Module } from '@nestjs/common';
import { FarmInsightEngine } from './farm-insight.engine';
import { InsightService } from './insight.service';

@Module({ providers: [FarmInsightEngine, InsightService], exports: [FarmInsightEngine, InsightService] })
export class InsightModule {}
