import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { LessonModule } from './lesson-module.entity';

export enum ContentType {
  VIDEO = 'video',
  TEXT = 'text',
  QUIZ = 'quiz',
  DOCUMENT = 'document',
}

@Entity('lesson_contents')
export class LessonContent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({
    type: 'enum',
    enum: ContentType,
    default: ContentType.TEXT,
  })
  type: ContentType;

  @Column({ type: 'text' })
  content: string; // URL pour vidéo/document, texte HTML pour text, JSON pour quiz

  @Column({ type: 'int', default: 0 })
  duration: number; // en minutes

  @Column({ type: 'int', default: 0 })
  order: number;

  @Column({ type: 'boolean', default: false })
  isFreePreview: boolean; // Contenu gratuit pour preview

  @ManyToOne(() => LessonModule, (module) => module.contents, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'moduleId' })
  module: LessonModule;

  @Column()
  moduleId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}