import { Body, Controller, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ResponseMessage } from '../common/response';
import { SubmitAssessmentDto } from '../service-request/dto/workflow.dto';
import { AgronomistService } from './agronomist.service';
import { CreateAgronomistDto, UpdateAgronomistDto } from './dto/agronomist.dto';

@ApiTags('Agronomists')
@Controller('agronomists')
export class AgronomistController {
  constructor(private readonly agronomists: AgronomistService) {}

  @Get() @ResponseMessage('Agronomists loaded')
  @ApiOperation({ summary: 'List agronomists with their open / completed request counts (admin)' }) @ApiQuery({ name: 'status', required: false, enum: ['ACTIVE', 'INACTIVE'] })
  list(@Query() q: any) { return this.agronomists.list(q); }

  @Post() @HttpCode(201) @ResponseMessage('Agronomist added')
  @ApiOperation({ summary: 'Add an agronomist (admin)' }) @ApiResponse({ status: 409, description: 'Email already exists' })
  create(@Body() dto: CreateAgronomistDto) { return this.agronomists.create(dto); }

  @Patch(':id') @ResponseMessage('Agronomist updated')
  @ApiOperation({ summary: 'Update an agronomist, including ACTIVE / INACTIVE (admin). Inactive agronomists keep existing work but cannot receive new requests.' })
  update(@Param('id') id: string, @Body() dto: UpdateAgronomistDto) { return this.agronomists.update(id, dto); }

  // --- Workspace. Prototype: the agronomist is chosen with the demo "viewing as" selector; there is no agronomist login. ---
  @Get(':id/dashboard') @ResponseMessage('Agronomist dashboard loaded')
  @ApiOperation({ summary: 'Workspace KPIs (assigned, pending visits, completed, follow-ups due) computed from real requests and assessments' })
  dashboard(@Param('id') id: string) { return this.agronomists.dashboard(id); }

  @Get(':id/requests') @ResponseMessage('Assigned requests loaded')
  @ApiOperation({ summary: "This agronomist's assigned requests" }) @ApiQuery({ name: 'status', required: false, enum: ['ASSIGNED', 'COMPLETED'] })
  requests(@Param('id') id: string, @Query() q: any) { return this.agronomists.myRequests(id, q); }

  @Get(':id/requests/:requestId') @ResponseMessage('Request loaded')
  @ApiOperation({ summary: 'Request detail for the assigned agronomist (farmer, farm, insight, action plan, assessment, timeline)' })
  @ApiResponse({ status: 403, description: 'Not assigned to this agronomist' })
  detail(@Param('id') id: string, @Param('requestId') requestId: string) { return this.agronomists.requestDetail(id, requestId); }

  @Post(':id/requests/:requestId/assessment') @HttpCode(200) @ResponseMessage('Assessment saved')
  @ApiOperation({ summary: 'Submit (or edit, until completion) the field assessment for an assigned request' })
  assessment(@Param('id') id: string, @Param('requestId') requestId: string, @Body() dto: SubmitAssessmentDto) { return this.agronomists.submitAssessment(id, requestId, dto); }

  @Post(':id/requests/:requestId/complete') @HttpCode(200) @ResponseMessage('Request completed')
  @ApiOperation({ summary: 'Complete a request. Requires a submitted assessment.' })
  complete(@Param('id') id: string, @Param('requestId') requestId: string) { return this.agronomists.complete(id, requestId); }
}
