import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateModuleDto {
  @ApiProperty({ example: 'Module 1: Les bases' })
  @IsString()
  title: string;

  @ApiProperty({
    example: 'Introduction aux concepts de base',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @Min(0)
  order: number;
}
