import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsNumber } from 'class-validator';
import { SocialPlatform } from '../../entities/social-account.entity';

export class ConnectSocialAccountDto {
  @ApiProperty({ enum: SocialPlatform, example: SocialPlatform.FACEBOOK })
  @IsEnum(SocialPlatform)
  platform: SocialPlatform;

  @ApiProperty()
  @IsString()
  accessToken: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  refreshToken?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  expiresIn?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  platformUserId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  platformUsername?: string;
}