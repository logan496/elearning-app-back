import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Podcast } from './podcast.entity';
import { GeneralMessage } from './general-message.entity';
import { DirectMessage } from './direct-message.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({
    default: 'https://api.dicebear.com/7.x/avataaars/svg?seed=default',
  })
  avatar: string;

  @Column({ default: false })
  isPublisher: boolean;

  // ✅ NOUVEAU: Rôle admin
  @Column({ default: false })
  isAdmin: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Podcast, (podcast) => podcast.publisher)
  podcasts: Podcast[];

  @OneToMany(() => GeneralMessage, (msg) => msg.sender)
  generalMessages: GeneralMessage[];

  @OneToMany(() => DirectMessage, (msg) => msg.sender)
  sentMessages: DirectMessage[];

  @OneToMany(() => DirectMessage, (msg) => msg.recipient)
  receivedMessages: DirectMessage[];

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ type: 'text', nullable: true })
  profilePicture: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  website: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  linkedin: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  github: string;

  @Column({ type: 'simple-array', nullable: true })
  skills: string[];
}