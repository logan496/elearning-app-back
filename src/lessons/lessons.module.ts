import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LessonsController } from './lessons.controller';
import { LessonsService } from './lessons.service';
import { Lesson } from '../entities/lesson.entity';
import { LessonModule as LessonModuleEntity } from '../entities/lesson-module.entity';
import { LessonContent } from '../entities/lesson-content.entity';
import { LessonEnrollment } from '../entities/lesson-enrollment.entity';
import { LessonProgress } from '../entities/lesson-progress.entity';
import { Payment } from '../entities/payment.entity';
import { User } from '../entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Lesson,
      LessonModuleEntity,
      LessonContent,
      LessonEnrollment,
      LessonProgress,
      Payment,
      User, // ✅ Ajouté pour vérifier isPublisher
    ]),
    // JwtModule et ConfigModule sont déjà globaux dans AppModule
  ],
  controllers: [LessonsController],
  providers: [LessonsService],
  exports: [LessonsService],
})
export class LessonsModule {}