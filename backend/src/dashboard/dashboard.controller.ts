import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ResponseMessage } from '../common/response';
import { ServiceRequestService } from '../service-request/service-request.service';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService, private readonly requests: ServiceRequestService) {}

  @Get('summary') @ResponseMessage('Dashboard summary loaded')
  @ApiOperation({ summary: 'KPIs: farmers, acres, estimated coffee production, service requests (all DB-computed)' })
  summary() { return this.dashboard.summary(); }

  @Get('locations') @ResponseMessage('Location summary loaded')
  @ApiOperation({ summary: 'Farmers per county plus farm markers for the map' })
  locations() { return this.dashboard.locations(); }

  @Get('recent-farmers') @ResponseMessage('Recent farmers loaded')
  @ApiOperation({ summary: 'Most recently onboarded farmers' })
  recent(@Query('limit') limit?: string) { return this.dashboard.recentFarmers(Math.min(20, Number(limit) || 5)); }

  @Get('service-requests') @ResponseMessage('Outstanding requests loaded')
  @ApiOperation({ summary: 'Outstanding (pending / in review / assigned) service requests' })
  outstanding() { return this.requests.list({ outstanding: 'true', pageSize: 20 }); }
}
