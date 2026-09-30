import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class FarmQuestionDto {
  @ApiProperty({ description: 'Farm UUID' })
  @IsString({ message: 'Farm is required.' }) @IsNotEmpty({ message: 'Farm is required.' })
  farmId: string;

  @ApiProperty({ example: 'How can I improve my coffee farm?' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'Please type your question.' })
  @MinLength(3, { message: 'Please type your question.' })
  @MaxLength(500, { message: 'Please keep your question under 500 characters.' })
  question: string;
}
