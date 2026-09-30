import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export enum ServiceTypeDto {
  AGRONOMIST_VISIT = 'AGRONOMIST_VISIT', SOIL_TEST = 'SOIL_TEST', BIOCHAR_ASSESSMENT = 'BIOCHAR_ASSESSMENT',
  COFFEE_QUALITY_ASSESSMENT = 'COFFEE_QUALITY_ASSESSMENT', BUYER_OFFTAKE_SUPPORT = 'BUYER_OFFTAKE_SUPPORT',
}
export enum RequestStatusDto { PENDING = 'PENDING', IN_REVIEW = 'IN_REVIEW', ASSIGNED = 'ASSIGNED', COMPLETED = 'COMPLETED', CANCELLED = 'CANCELLED' }

export class CreateServiceRequestDto {
  @ApiProperty() @IsString({ message: 'Farmer is required.' }) @IsNotEmpty({ message: 'Farmer is required.' }) farmerId: string;
  @ApiProperty() @IsString({ message: 'Farm is required.' }) @IsNotEmpty({ message: 'Farm is required.' }) farmId: string;
  @ApiProperty({ enum: ServiceTypeDto }) @IsEnum(ServiceTypeDto, { message: 'Please choose a valid service.' }) type: ServiceTypeDto;
  @ApiPropertyOptional({ example: 'Best to visit in the morning.' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() || undefined : value))
  @IsOptional() @IsString() @MaxLength(500, { message: 'Please keep your note under 500 characters.' })
  description?: string;
}

export class UpdateRequestStatusDto {
  @ApiProperty({ enum: RequestStatusDto }) @IsEnum(RequestStatusDto, { message: 'Please choose a valid status.' }) status: RequestStatusDto;
}
