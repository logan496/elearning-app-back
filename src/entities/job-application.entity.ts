import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { JobPosting } from './job-posting.entity';

export enum ApplicationStatus {
  PENDING = 'pending',
  REVIEWING = 'reviewing',
  SHORTLISTED = 'shortlisted',
  INTERVIEW = 'interview',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn',
}

@Entity('job_applications')
@Unique(['userId', 'jobId'])
export class JobApplication {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;

  @ManyToOne(() => JobPosting, (job) => job.applications, { eager: true })
  @JoinColumn({ name: 'jobId' })
  job: JobPosting;

  @Column()
  jobId: number;

  @Column({ type: 'text' })
  coverLetter: string;

  @Column({ type: 'text', nullable: true })
  resumeUrl: string;

  @Column({ type: 'text', nullable: true })
  portfolioUrl: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  linkedinUrl: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  githubUrl: string;

  @Column({ type: 'simple-array', nullable: true })
  additionalDocuments: string[];

  @Column({
    type: 'enum',
    enum: ApplicationStatus,
    default: ApplicationStatus.PENDING,
  })
  status: ApplicationStatus;

  @Column({ type: 'text', nullable: true })
  notes: string; // Notes internes du recruteur

  @Column({ type: 'text', nullable: true })
  feedback: string; // Feedback donné au candidat

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt: Date;

  @Column({ type: 'int', nullable: true })
  reviewedBy: number;

  @CreateDateColumn()
  appliedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}