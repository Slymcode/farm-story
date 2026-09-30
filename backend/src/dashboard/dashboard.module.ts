import { Module } from '@nestjs/common';
import { ServiceRequestModule } from '../service-request/service-request.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({ imports: [ServiceRequestModule], controllers: [DashboardController], providers: [DashboardService] })
export class DashboardModule {}
