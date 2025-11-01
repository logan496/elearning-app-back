import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { BlogPost } from './blog-post.entity';

@Entity('blog_likes')
@Unique(['userId', 'postId'])
export class BlogLike {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;

  @ManyToOne(() => BlogPost, (post) => post.likes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post: BlogPost;

  @Column()
  postId: number;

  @CreateDateColumn()
  createdAt: Date;
}