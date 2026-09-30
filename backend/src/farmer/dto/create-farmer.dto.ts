import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export const LANGUAGES = ['English', 'Kiswahili', 'Kikuyu', 'Luo', 'Kalenjin', 'Other'] as const;
const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
const phone = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.replace(/[\s-]/g, '') : value);

export class CreateFarmerDto {
  @ApiProperty({ example: 'John Mwangi' })
  @Transform(trim) @IsString({ message: 'Please enter your full name.' })
  @IsNotEmpty({ message: 'Please enter your full name.' }) @MaxLength(120, { message: 'Please use a shorter name.' })
  fullName: string;

  @ApiProperty({ example: '+254712345678', description: 'International or local (07…/01…) format' })
  @Transform(phone) @IsString({ message: 'Please enter a valid mobile number.' })
  @Matches(/^\+?\d{9,15}$/, { message: 'Please enter a valid mobile number, for example 0712 345 678.' })
  mobileNumber: string;

  @ApiPropertyOptional({ example: 'john@example.com' })
  @Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? undefined : trim({ value })))
  @IsOptional() @IsEmail({}, { message: 'Please enter a valid email address, or leave it blank.' })
  email?: string;

  @ApiProperty({ example: 'Nyeri' })
  @Transform(trim) @IsString({ message: 'Please choose your county.' }) @IsNotEmpty({ message: 'Please choose your county.' }) @MaxLength(80)
  county: string;

  @ApiPropertyOptional({ example: 'Mathira' })
  @Transform(trim) @IsOptional() @IsString() @MaxLength(80)
  region?: string;

  @ApiProperty({ enum: LANGUAGES, example: 'English' })
  @IsIn(LANGUAGES as unknown as string[], { message: 'Please choose your preferred language.' })
  preferredLanguage: string;
}
