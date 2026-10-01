import { Body, Controller, Get, HttpCode, Param, Patch, Post, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { sendCsv } from '../common/csv';
import { AuthUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ResponseMessage } from '../common/response';
import { CreateServiceRequestDto, UpdateRequestStatusDto } from './dto/service-request.dto';
import { ServiceRequestService } from './service-request.service';

@ApiTags('Service Requests')
@Controller('service-requests')
export class ServiceRequestController {
  constructor(private readonly requests: ServiceRequestService) {}

  @Post() @HttpCode(201) @ResponseMessage('Request submitted successfully')
  @ApiOperation({ summary: 'Create a service request (status starts as PENDING; ID like FS-REQ-000021)' })
  @ApiResponse({ status: 400, description: 'Validation error or the farm does not belong to the farmer' })
  create(@Body() dto: CreateServiceRequestDto, @CurrentUser() user?: AuthUser) { return this.requests.create(dto, user); }

  @Get() @ResponseMessage('Service requests loaded')
  @ApiOperation({ summary: 'List service requests; filter by status, farmerId, or outstanding=true' })
  @ApiQuery({ name: 'status', required: false }) @ApiQuery({ name: 'farmerId', required: false }) @ApiQuery({ name: 'outstanding', required: false })
  list(@Query() q: any, @CurrentUser() user?: AuthUser) { return this.requests.list(q, user); }

  // Declared before ':id' so "export" is never treated as an id.
  @Get('export')
  @ApiOperation({ summary: 'Download service requests as CSV. Respects the status / outstanding filters.' })
  @ApiQuery({ name: 'status', required: false }) @ApiQuery({ name: 'outstanding', required: false })
  async export(@Query() q: any, @Res() res: Response) { sendCsv(res, 'farm-story-service-requests', await this.requests.exportCsv(q)); }

  @Get(':id') @ResponseMessage('Service request loaded')
  @ApiOperation({ summary: 'Get a service request (UUID or FS-REQ-… ID)' })
  findOne(@Param('id') id: string, @CurrentUser() user?: AuthUser) { return this.requests.findOne(id, user); }

  @Patch(':id/status') @ResponseMessage('Request status updated')
  @ApiOperation({ summary: 'Update request status (admin)' })
  status(@Param('id') id: string, @Body() dto: UpdateRequestStatusDto) { return this.requests.updateStatus(id, dto.status); }
}
