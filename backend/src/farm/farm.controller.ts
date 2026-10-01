import { Body, Controller, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ResponseMessage } from '../common/response';
import { InsightService } from '../insight/insight.service';
import { CreateFarmDto, UpdateFarmDto } from './dto/farm.dto';
import { FarmService } from './farm.service';

@ApiTags('Farms')
@Controller('farms')
export class FarmController {
  constructor(private readonly farms: FarmService) {}

  @Post() @HttpCode(201) @ResponseMessage('Farm registered successfully')
  @ApiOperation({ summary: 'Register a farm. The Farm Insight is generated automatically.' })
  @ApiResponse({ status: 201, description: 'Farm created (includes farmer and insight)' })
  @ApiResponse({ status: 400, description: 'VALIDATION_ERROR' }) @ApiResponse({ status: 404, description: 'Farmer not found' })
  create(@Body() dto: CreateFarmDto, @CurrentUser() user?: AuthUser) { return this.farms.create(dto, user); }

  @Get(':id') @ResponseMessage('Farm loaded')
  @ApiOperation({ summary: 'Get a farm with its farmer and current insight' })
  findOne(@Param('id') id: string, @CurrentUser() user?: AuthUser) { return this.farms.findOne(id, user); }

  @Patch(':id') @ResponseMessage('Farm updated successfully')
  @ApiOperation({ summary: 'Update a farm; the insight is regenerated from the new data' })
  update(@Param('id') id: string, @Body() dto: UpdateFarmDto, @CurrentUser() user?: AuthUser) { return this.farms.update(id, dto, user); }
}

@ApiTags('Insights')
@Controller('farms/:id/insight')
export class InsightController {
  constructor(private readonly insights: InsightService) {}

  @Get() @ResponseMessage('Farm insight loaded')
  @ApiOperation({ summary: 'Get the current deterministic Farm Insight (score, insights, recommendations, breakdown)' })
  get(@Param('id') id: string, @CurrentUser() user?: AuthUser) { return this.insights.getForFarm(id, user); }

  @Post('generate') @HttpCode(200) @ResponseMessage('Farm insight regenerated')
  @ApiOperation({ summary: 'Regenerate the insight (upserts — one current insight per farm)' })
  generate(@Param('id') id: string, @CurrentUser() user?: AuthUser) { return this.insights.generateForFarm(id, user); }
}
