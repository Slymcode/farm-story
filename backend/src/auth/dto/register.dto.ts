import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
const email = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().toLowerCase() : value);

export class RegisterDto {
  @ApiProperty({ example: 'John Mwangi' })
  @Transform(trim) @IsString({ message: 'Please enter your full name.' }) @IsNotEmpty({ message: 'Please enter your full name.' })
  @MaxLength(120, { message: 'Please use a shorter name.' })
  name: string;

  @ApiProperty({ example: 'john@example.com' })
  @Transform(email) @IsEmail({}, { message: 'Please enter a valid email address.' }) @MaxLength(254, { message: 'Please enter a valid email address.' })
  email: string;

  @ApiProperty({ example: 'Password123!', minLength: 8, maxLength: 72, description: 'At least 8 characters (bcrypt only uses the first 72).' })
  @IsString({ message: 'Password must be at least 8 characters.' })
  @MinLength(8, { message: 'Password must be at least 8 characters.' }) @MaxLength(72, { message: 'Password must be 72 characters or fewer.' })
  password: string;
}
