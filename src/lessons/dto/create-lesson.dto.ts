import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsArray,
  Min,
} from 'class-validator';
import { LessonLevel } from '../../entities/lesson.entity';

export class CreateLessonDto {
  @ApiProperty({ example: 'Introduction à JavaScript' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Apprenez les bases de JavaScript' })
  @IsString()
  description: string;

  @ApiProperty({
    example: 'https://example.com/thumbnail.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  thumbnail?: string;

  @ApiProperty({ example: 29.99 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: false })
  @IsBoolean()
  isFree: boolean;

  @ApiProperty({ enum: LessonLevel, example: LessonLevel.BEGINNER })
  @IsEnum(LessonLevel)
  level: LessonLevel;

  @ApiProperty({ example: 120 })
  @IsNumber()
  @Min(0)
  duration: number;

  @ApiProperty({ example: ['javascript', 'programming'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
