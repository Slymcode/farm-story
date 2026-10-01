import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { ArrayUnique, IsArray, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ServiceTypeDto } from '../../service-request/dto/service-request.dto';

export enum AgronomistStatusDto { ACTIVE = 'ACTIVE', INACTIVE = 'INACTIVE' }
const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() || undefined : value);
const lower = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().toLowerCase() : value);

export class CreateAgronomistDto {
  @ApiProperty({ example: 'Grace Wanjiku' }) @Transform(trim) @IsString({ message: 'Full name is required.' }) @IsNotEmpty({ message: 'Full name is required.' }) @MaxLength(120) fullName: string;
  @ApiProperty({ example: 'grace@farmstory.africa' }) @Transform(lower) @IsEmail({}, { message: 'Please enter a valid email address.' }) email: string;
  @ApiPropertyOptional() @Transform(trim) @IsOptional() @IsString() @MaxLength(30) phone?: string;
  @ApiPropertyOptional({ example: 'Nyeri' }) @Transform(trim) @IsOptional() @IsString() @MaxLength(80) county?: string;
  @ApiPropertyOptional({ enum: ServiceTypeDto, isArray: true })
  @IsOptional() @IsArray() @ArrayUnique() @IsEnum(ServiceTypeDto, { each: true, message: 'Please choose valid specialties.' }) specialties?: ServiceTypeDto[];
}

export class UpdateAgronomistDto {
  @ApiPropertyOptional() @Transform(trim) @IsOptional() @IsString() @IsNotEmpty() @MaxLength(120) fullName?: string;
  @ApiPropertyOptional() @Transform(trim) @IsOptional() @IsString() @MaxLength(30) phone?: string;
  @ApiPropertyOptional() @Transform(trim) @IsOptional() @IsString() @MaxLength(80) county?: string;
  @ApiPropertyOptional({ enum: ServiceTypeDto, isArray: true }) @IsOptional() @IsArray() @ArrayUnique() @IsEnum(ServiceTypeDto, { each: true }) specialties?: ServiceTypeDto[];
  @ApiPropertyOptional({ enum: AgronomistStatusDto }) @IsOptional() @IsEnum(AgronomistStatusDto, { message: 'Please choose a valid status.' }) status?: AgronomistStatusDto;
}
