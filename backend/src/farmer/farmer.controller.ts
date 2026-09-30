import { Body, Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ResponseMessage } from '../common/response';
import { CreateFarmerDto } from './dto/create-farmer.dto';
import { FarmerService } from './farmer.service';

@ApiTags('Farmers')
@Controller('farmers')
export class FarmerController {
  constructor(private readonly farmers: FarmerService) {}

  @Post() @HttpCode(201) @ResponseMessage('Farmer registered successfully')
  @ApiOperation({ summary: 'Register a farmer and generate their Farm Story ID (FS-KEN-000001)' })
  @ApiResponse({ status: 201, description: 'Farmer created' })
  @ApiResponse({ status: 400, description: 'VALIDATION_ERROR — friendly per-field messages in `details`' })
  create(@Body() dto: CreateFarmerDto) { return this.farmers.create(dto); }

  @Get() @ResponseMessage('Farmers loaded')
  @ApiOperation({ summary: 'List farmers (admin) with search, county/crop filters and pagination' })
  @ApiQuery({ name: 'search', required: false }) @ApiQuery({ name: 'county', required: false })
  @ApiQuery({ name: 'crop', required: false }) @ApiQuery({ name: 'page', required: false }) @ApiQuery({ name: 'pageSize', required: false })
  list(@Query() q: any) { return this.farmers.list(q); }

  @Get(':id') @ResponseMessage('Farmer loaded')
  @ApiOperation({ summary: 'Get a farmer with farms, insight and service requests (UUID or FS-KEN-… ID)' })
  @ApiResponse({ status: 404, description: 'NOT_FOUND' })
  findOne(@Param('id') id: string) { return this.farmers.findOne(id); }
}
