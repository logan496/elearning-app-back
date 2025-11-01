import { ApiProperty } from '@nestjs/swagger';
import { LessonLevel, LessonStatus } from '../../entities/lesson.entity';

export class InstructorDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  username: string;

  @ApiProperty()
  avatar: string;
}

export class LessonResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  thumbnail: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  isFree: boolean;

  @ApiProperty({ enum: LessonLevel })
  level: LessonLevel;

  @ApiProperty({ enum: LessonStatus })
  status: LessonStatus;

  @ApiProperty()
  duration: number;

  @ApiProperty()
  tags: string[];

  @ApiProperty()
  enrollmentCount: number;

  @ApiProperty({ type: InstructorDto })
  instructor: InstructorDto;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  isEnrolled?: boolean;

  @ApiProperty()
  progress?: number;
}
