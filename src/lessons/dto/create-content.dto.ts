import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsEnum,
  IsBoolean,
  IsOptional,
  Min,
} from 'class-validator';
import { ContentType } from '../../entities/lesson-content.entity';

export class CreateContentDto {
  @ApiProperty({ example: 'Introduction' })
  @IsString()
  title: string;

  @ApiProperty({ enum: ContentType, example: ContentType.VIDEO })
  @IsEnum(ContentType)
  type: ContentType;

  @ApiProperty({ example: 'https://example.com/video.mp4' })
  @IsString()
  content: string;

  @ApiProperty({ example: 15 })
  @IsNumber()
  @Min(0)
  duration: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @Min(0)
  order: number;

  @ApiProperty({ example: false })
  @IsBoolean()
  isFreePreview: boolean;
}
