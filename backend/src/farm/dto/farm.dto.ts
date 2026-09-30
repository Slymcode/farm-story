import { ApiProperty, ApiPropertyOptional, PartialType, OmitType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsDateString, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, MaxLength, Min, registerDecorator, ValidationOptions } from 'class-validator';

export enum CropTypeDto { COFFEE = 'COFFEE', MAIZE = 'MAIZE', BEANS = 'BEANS', TEA = 'TEA', OTHER = 'OTHER' }
export enum ChallengeDto {
  LOW_YIELD = 'LOW_YIELD', PESTS_DISEASE = 'PESTS_DISEASE', SOIL_QUALITY = 'SOIL_QUALITY', WATER_AVAILABILITY = 'WATER_AVAILABILITY',
  BUYER_ACCESS = 'BUYER_ACCESS', FINANCE_ACCESS = 'FINANCE_ACCESS', INPUT_COSTS = 'INPUT_COSTS',
}

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
/** Blank strings from forms become undefined so optional numeric/date fields validate cleanly. */
const blank = ({ value }: { value: unknown }) => (value === '' || value === null ? undefined : value);

/**
 * Rejects dates after today. Compared by calendar day against the latest timezone on Earth
 * (UTC+14), so a farmer whose local "today" is already ahead of UTC is never wrongly rejected.
 */
export function isNotFutureDate(value: unknown, now: number = Date.now()): boolean {
  if (typeof value !== 'string') return false;
  const day = value.slice(0, 10);
  const latestToday = new Date(now + 14 * 3600 * 1000).toISOString().slice(0, 10);
  return day <= latestToday;
}
export function NotFutureDate(options?: ValidationOptions) {
  return (object: object, propertyName: string) =>
    registerDecorator({ name: 'notFutureDate', target: object.constructor, propertyName, options, validator: { validate: (v) => isNotFutureDate(v) } });
}

export class CreateFarmDto {
  @ApiProperty({ description: 'Farmer UUID or public Farm Story ID (FS-KEN-000001)' })
  @IsString({ message: 'Farmer is required.' }) @IsNotEmpty({ message: 'Farmer is required.' })
  farmerId: string;

  @ApiProperty({ example: "John's Coffee Farm" })
  @Transform(trim) @IsString({ message: 'Please enter a farm name.' }) @IsNotEmpty({ message: 'Please enter a farm name.' }) @MaxLength(120)
  farmName: string;

  @ApiProperty({ example: 'Nyeri County, Kenya', description: 'Human-readable location' })
  @Transform(trim) @IsString({ message: 'Please describe where the farm is.' }) @IsNotEmpty({ message: 'Please describe where the farm is.' }) @MaxLength(200)
  location: string;

  @ApiProperty({ example: -0.4201 })
  @Type(() => Number) @IsNumber({}, { message: 'Please enter a valid latitude (-90 to 90).' })
  @Min(-90, { message: 'Please enter a valid latitude (-90 to 90).' }) @Max(90, { message: 'Please enter a valid latitude (-90 to 90).' })
  latitude: number;

  @ApiProperty({ example: 36.9476 })
  @Type(() => Number) @IsNumber({}, { message: 'Please enter a valid longitude (-180 to 180).' })
  @Min(-180, { message: 'Please enter a valid longitude (-180 to 180).' }) @Max(180, { message: 'Please enter a valid longitude (-180 to 180).' })
  longitude: number;

  @ApiProperty({ example: 2.5 })
  @Type(() => Number) @IsNumber({}, { message: 'Please enter a valid farm size.' }) @Min(0.01, { message: 'Please enter a valid farm size.' }) @Max(100000, { message: 'Please enter a valid farm size.' })
  sizeAcres: number;

  @ApiProperty({ enum: CropTypeDto })
  @IsEnum(CropTypeDto, { message: 'Please choose your main crop.' })
  primaryCrop: CropTypeDto;

  @ApiPropertyOptional({ type: [String], example: ['SL28', 'Ruiru 11'], description: 'Coffee only' })
  @IsOptional() @IsArray({ message: 'Please choose valid coffee varieties.' }) @ArrayMaxSize(10) @IsString({ each: true })
  coffeeVariety?: string[];

  @ApiPropertyOptional({ example: 1100, description: 'Coffee only' })
  @Transform(blank) @IsOptional() @Type(() => Number) @IsInt({ message: 'Please enter a valid number of trees.' }) @Min(0, { message: 'Please enter a valid number of trees.' })
  coffeeTrees?: number;

  @ApiPropertyOptional({ example: 1800, description: 'Estimated annual production in kg' })
  @Transform(blank) @IsOptional() @Type(() => Number) @IsNumber({}, { message: 'Please enter a valid production amount.' }) @Min(0, { message: 'Production cannot be negative.' })
  estimatedAnnualProductionKg?: number;

  @ApiPropertyOptional({ example: '2025-12-15' })
  @Transform(blank) @IsOptional() @IsDateString({}, { message: 'Please enter a valid harvest date.' }) @NotFutureDate({ message: 'Harvest date cannot be in the future.' })
  lastHarvestDate?: string;

  @ApiPropertyOptional({ example: '2024-03-01', description: 'Leave empty if unknown' })
  @Transform(blank) @IsOptional() @IsDateString({}, { message: 'Please enter a valid soil test date.' }) @NotFutureDate({ message: 'Soil test date cannot be in the future.' })
  lastSoilTestDate?: string;

  @ApiProperty({ enum: ChallengeDto, isArray: true, example: ['LOW_YIELD'] })
  @IsArray({ message: 'Please choose your challenges.' }) @IsEnum(ChallengeDto, { each: true, message: 'One of the selected challenges is not valid.' })
  challenges: ChallengeDto[];
}

export class UpdateFarmDto extends PartialType(OmitType(CreateFarmDto, ['farmerId'] as const)) {}
