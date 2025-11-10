import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PodcastController } from './podcast.controller';
import { PodcastService } from './podcast.service';
import { Podcast } from '../entities/podcast.entity';
import { User } from '../entities/user.entity';
import { SocialModule } from '../social/social.module';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Podcast, User]),
    SocialModule,
    UploadModule, // ✅ Import du module upload
  ],
  controllers: [PodcastController],
  providers: [PodcastService],
  exports: [PodcastService],
})
export class PodcastModule {}
