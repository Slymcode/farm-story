import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'john@example.com' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: 'Please enter a valid email address.' })
  email: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString({ message: 'Please enter your password.' }) @IsNotEmpty({ message: 'Please enter your password.' })
  password: string;
}

export class AuthUserResponse {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() email: string;
  @ApiProperty({ enum: ['FARMER'] }) role: 'FARMER';
  @ApiProperty() onboardingCompleted: boolean;
  @ApiProperty({ nullable: true, description: 'The linked Farmer record, once farmer details were saved during onboarding.', example: { id: 'uuid', farmerId: 'FS-KEN-000001', farmId: 'uuid' } })
  farmer: { id: string; farmerId: string; farmId: string | null } | null;
}
