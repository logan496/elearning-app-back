import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateUserRoleDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  isAdmin: boolean;
}

export class UpdatePublisherStatusDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  isPublisher: boolean;
}