import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  IsBoolean,
  MinLength,
  MaxLength,
} from 'class-validator';
import { BlogCategory } from '../../entities/blog-post.entity';

export class CreatePostDto {
  @ApiProperty({ example: 'Introduction à TypeScript' })
  @IsString()
  @MinLength(5)
  @MaxLength(255)
  title: string;

  @ApiProperty({ example: 'Un aperçu rapide de TypeScript' })
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  excerpt: string;

  @ApiProperty({ example: 'Contenu complet du post...' })
  @IsString()
  @MinLength(50)
  content: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  featuredImage?: string;

  @ApiProperty({ enum: BlogCategory, example: BlogCategory.PROGRAMMING })
  @IsEnum(BlogCategory)
  category: BlogCategory;

  @ApiProperty({ example: ['typescript', 'javascript'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ example: true })
  @IsBoolean()
  commentsEnabled: boolean;
}

export class UpdatePostDto {
  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  excerpt?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  featuredImage?: string;

  @IsOptional()
  @IsEnum(BlogCategory)
  category?: BlogCategory;

  @IsOptional()
  @IsArray()
  tags?: string[];

  @IsOptional()
  @IsBoolean()
  commentsEnabled?: boolean;
}