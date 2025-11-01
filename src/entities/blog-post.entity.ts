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
import { BlogComment } from './blog-comment.entity';
import { BlogLike } from './blog-like.entity';

export enum BlogStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export enum BlogCategory {
  TECHNOLOGY = 'technology',
  DESIGN = 'design',
  BUSINESS = 'business',
  MARKETING = 'marketing',
  PROGRAMMING = 'programming',
  TUTORIAL = 'tutorial',
  NEWS = 'news',
  OTHER = 'other',
}

@Entity('blog_posts')
export class BlogPost {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 500 })
  slug: string;

  @Column({ type: 'text' })
  excerpt: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'text', nullable: true })
  featuredImage: string;

  @Column({
    type: 'enum',
    enum: BlogStatus,
    default: BlogStatus.DRAFT,
  })
  status: BlogStatus;

  @Column({
    type: 'enum',
    enum: BlogCategory,
    default: BlogCategory.OTHER,
  })
  category: BlogCategory;

  @Column({ type: 'simple-array', nullable: true })
  tags: string[];

  @Column({ type: 'int', default: 0 })
  viewCount: number;

  @Column({ type: 'int', default: 0 })
  likeCount: number;

  @Column({ type: 'int', default: 0 })
  commentCount: number;

  @Column({ type: 'int', default: 5 })
  readTime: number; // en minutes

  @Column({ type: 'boolean', default: true })
  commentsEnabled: boolean;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'authorId' })
  author: User;

  @Column()
  authorId: number;

  @OneToMany(() => BlogComment, (comment) => comment.post)
  comments: BlogComment[];

  @OneToMany(() => BlogLike, (like) => like.post)
  likes: BlogLike[];

  @Column({ type: 'timestamp', nullable: true })
  publishedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}