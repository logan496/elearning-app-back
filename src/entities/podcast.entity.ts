import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum PodcastType {
  AUDIO = 'audio',
  VIDEO = 'video',
}

export enum PodcastStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  SCHEDULED = 'scheduled',
  ARCHIVED = 'archived',
}

@Entity('podcasts')
export class Podcast {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  // ✅ NOUVEAU: Type de podcast (audio ou vidéo)
  @Column({
    type: 'enum',
    enum: PodcastType,
    default: PodcastType.AUDIO,
  })
  type: PodcastType;

  // ✅ MODIFIÉ: Renommé de audioUrl à mediaUrl
  @Column({ type: 'text' })
  mediaUrl: string; // URL du fichier audio ou vidéo

  @Column({ type: 'text', nullable: true })
  thumbnailUrl: string;

  // ✅ NOUVEAU: URL de la vidéo si type = VIDEO
  @Column({ type: 'text', nullable: true })
  videoThumbnail: string; // Miniature spécifique pour vidéo

  @Column({ type: 'int', default: 0 })
  duration: number; // Durée en secondes

  @Column({
    type: 'enum',
    enum: PodcastStatus,
    default: PodcastStatus.DRAFT,
  })
  status: PodcastStatus;

  @Column({ type: 'simple-array', nullable: true })
  tags: string[];

  @Column({ type: 'varchar', length: 100, nullable: true })
  category: string;

  @Column({ type: 'int', default: 0 })
  listenCount: number;

  @Column({ type: 'int', default: 0 })
  likeCount: number;

  @ManyToOne(() => User, (user) => user.podcasts, { eager: true })
  @JoinColumn({ name: 'publisherId' })
  publisher: User;

  @Column()
  publisherId: number;

  // ✅ NOUVEAU: Partage sur les réseaux sociaux
  @Column({ type: 'boolean', default: true })
  autoShareOnPublish: boolean; // Partager automatiquement lors de la publication

  @Column({ type: 'simple-json', nullable: true })
  socialShareData: {
    facebook?: {
      postId?: string;
      sharedAt?: Date;
      success?: boolean;
      error?: string;
    };
    twitter?: {
      tweetId?: string;
      sharedAt?: Date;
      success?: boolean;
      error?: string;
    };
    linkedin?: {
      postId?: string;
      sharedAt?: Date;
      success?: boolean;
      error?: string;
    };
  };

  @Column({ type: 'timestamp', nullable: true })
  publishedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  scheduledFor: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}