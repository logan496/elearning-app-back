import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { User } from './user.entity';

@Entity('podcasts')
export class Podcast {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column()
  duration: string;

  @Column()
  audioUrl: string;

  @Column({ default: '/placeholder.svg' })
  imageUrl: string;

  @Column({ default: 0 })
  views: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.podcasts)
  publisher: User;

  @Column()
  publisherId: number;
}
