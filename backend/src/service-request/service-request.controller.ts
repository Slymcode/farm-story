import { Body, Controller, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
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
  create(@Body() dto: CreateServiceRequestDto) { return this.requests.create(dto); }

  @Get() @ResponseMessage('Service requests loaded')
  @ApiOperation({ summary: 'List service requests; filter by status, farmerId, or outstanding=true' })
  @ApiQuery({ name: 'status', required: false }) @ApiQuery({ name: 'farmerId', required: false }) @ApiQuery({ name: 'outstanding', required: false })
  list(@Query() q: any) { return this.requests.list(q); }

  @Get(':id') @ResponseMessage('Service request loaded')
  @ApiOperation({ summary: 'Get a service request (UUID or FS-REQ-… ID)' })
  findOne(@Param('id') id: string) { return this.requests.findOne(id); }

  @Patch(':id/status') @ResponseMessage('Request status updated')
  @ApiOperation({ summary: 'Update request status (admin)' })
  status(@Param('id') id: string, @Body() dto: UpdateRequestStatusDto) { return this.requests.updateStatus(id, dto.status); }
}
