import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsArray,
  MinLength,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { PodcastType } from '../../entities/podcast.entity';

export class CreatePodcastDto {
  @ApiProperty({ example: 'Episode 1: Introduction' })
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  title: string;

  @ApiProperty({ example: 'Premier épisode de notre série...' })
  @IsString()
  @MinLength(10)
  description: string;

  @ApiProperty({ enum: PodcastType, example: PodcastType.AUDIO })
  @IsEnum(PodcastType)
  type: PodcastType;

  @ApiProperty({ example: 1800, description: 'Durée en secondes' })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  duration: number;

  @ApiProperty({
    example: 'tech,startup',
    required: false,
    description:
      'Tags séparés par des virgules (ex: "tech,startup,innovation")',
  })
  @IsOptional()
  @Transform(({ value }) => {
    // Si c'est déjà un tableau, on le retourne tel quel
    if (Array.isArray(value)) {
      return value;
    }
    // Si c'est une chaîne, on la split par virgules
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);
    }
    // Sinon on retourne un tableau vide
    return [];
  })
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ example: 'Technology', required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ example: true, required: false, default: true })
  @IsOptional()
  @Transform(({ value }) => {
    // Gérer les différentes formes de booléens
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true' || value === '1';
    }
    if (typeof value === 'number') {
      return value === 1;
    }
    return false;
  })
  @IsBoolean()
  autoShareOnPublish?: boolean;
}

export class UpdatePodcastDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  description?: string;

  @IsOptional()
  @IsEnum(PodcastType)
  type?: PodcastType;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  duration?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value;
    }
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);
    }
    return [];
  })
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true' || value === '1';
    }
    if (typeof value === 'number') {
      return value === 1;
    }
    return false;
  })
  @IsBoolean()
  autoShareOnPublish?: boolean;
}
