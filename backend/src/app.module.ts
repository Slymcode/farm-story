import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { FarmerModule } from './farmer/farmer.module';
import { FarmModule } from './farm/farm.module';
import { InsightModule } from './insight/insight.module';
import { ServiceRequestModule } from './service-request/service-request.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AiModule } from './ai/ai.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, AuthModule, FarmerModule, FarmModule, InsightModule, ServiceRequestModule, DashboardModule, AiModule],
})
export class AppModule {}
