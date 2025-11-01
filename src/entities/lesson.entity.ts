import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { LessonEnrollment } from './lesson-enrollment.entity';
import { LessonModule } from './lesson-module.entity';

export enum LessonLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
}

export enum LessonStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

@Entity('lessons')
export class Lesson {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text', nullable: true })
  thumbnail: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price: number;

  @Column({ type: 'boolean', default: false })
  isFree: boolean;

  @Column({
    type: 'enum',
    enum: LessonLevel,
    default: LessonLevel.BEGINNER,
  })
  level: LessonLevel;

  @Column({
    type: 'enum',
    enum: LessonStatus,
    default: LessonStatus.DRAFT,
  })
  status: LessonStatus;

  @Column({ type: 'int', default: 0 })
  duration: number; // en minutes

  @Column({ type: 'simple-array', nullable: true })
  tags: string[];

  @Column({ type: 'int', default: 0 })
  enrollmentCount: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'instructorId' })
  instructor: User;

  @Column()
  instructorId: number;

  @OneToMany(() => LessonModule, (module) => module.lesson, { cascade: true })
  modules: LessonModule[];

  @OneToMany(() => LessonEnrollment, (enrollment) => enrollment.lesson)
  enrollments: LessonEnrollment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
