import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminGuard } from '../guards/admin.guard';
import { User } from '../entities/user.entity';
import { JobApplication } from '../entities/job-application.entity';
import { JobPosting } from '../entities/job-posting.entity';
import { Lesson } from '../entities/lesson.entity';
import { BlogPost } from '../entities/blog-post.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      JobApplication,
      JobPosting,
      Lesson,
      BlogPost,
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminGuard],
  exports: [AdminService, AdminGuard],
})
export class AdminModule {}
