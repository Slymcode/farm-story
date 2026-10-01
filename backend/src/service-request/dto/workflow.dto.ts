import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsDate, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() || undefined : value);

export class AssignAgronomistDto {
  @ApiProperty() @IsString({ message: 'Please choose an agronomist.' }) @IsNotEmpty({ message: 'Please choose an agronomist.' }) agronomistId: string;
}

export class SubmitAssessmentDto {
  @ApiProperty({ example: 'Soil is acidic in the lower block; trees look well-managed.' })
  @Transform(trim) @IsString({ message: 'Please write a short assessment summary.' }) @IsNotEmpty({ message: 'Please write a short assessment summary.' })
  @MaxLength(1000, { message: 'Please keep the summary under 1000 characters.' }) summary: string;
  @ApiPropertyOptional() @Transform(trim) @IsOptional() @IsString() @MaxLength(2000, { message: 'Please keep observations under 2000 characters.' }) observations?: string;
  @ApiPropertyOptional() @Transform(trim) @IsOptional() @IsString() @MaxLength(2000, { message: 'Please keep recommended actions under 2000 characters.' }) recommendedActions?: string;
  @ApiPropertyOptional({ default: false }) @IsOptional() @IsBoolean({ message: 'Follow-up must be yes or no.' }) followUpRequired?: boolean;
  @ApiPropertyOptional({ example: '2026-11-15', description: 'Required when a follow-up is needed; must be today or later.' })
  @IsOptional() @Type(() => Date) @IsDate({ message: 'Please enter a valid follow-up date.' }) followUpDate?: Date;
}
