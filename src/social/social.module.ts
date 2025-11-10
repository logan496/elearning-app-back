import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { SocialController } from './social.controller';
import { SocialShareService } from './social-share.service';
import { SocialAccount } from '../entities/social-account.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([SocialAccount]),
    ConfigModule,
  ],
  controllers: [SocialController],
  providers: [SocialShareService],
  exports: [SocialShareService],
})
export class SocialModule {}