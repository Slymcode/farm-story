import { Module } from '@nestjs/common';
import { InsightModule } from '../insight/insight.module';
import { FarmController, InsightController } from './farm.controller';
import { FarmService } from './farm.service';

@Module({ imports: [InsightModule], controllers: [FarmController, InsightController], providers: [FarmService], exports: [FarmService] })
export class FarmModule {}
