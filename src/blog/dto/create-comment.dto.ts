import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, MinLength } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ example: 'Super article !' })
  @IsString()
  @MinLength(1)
  content: string;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsNumber()
  parentId?: number;
}