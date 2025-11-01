import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsBoolean, Min } from 'class-validator';

export class UpdateProgressDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  contentId: number;

  @ApiProperty({ example: true })
  @IsBoolean()
  isCompleted: boolean;

  @ApiProperty({ example: 120 })
  @IsNumber()
  @Min(0)
  timeSpent: number;
}
