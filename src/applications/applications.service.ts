import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JobPosting, JobStatus } from '../entities/job-posting.entity';
import {
  JobApplication,
  ApplicationStatus,
} from '../entities/job-application.entity';
import {
  CreateJobPostingDto,
  UpdateJobPostingDto,
} from './dto/create-job-posting.dto';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectRepository(JobPosting)
    private jobRepository: Repository<JobPosting>,
    @InjectRepository(JobApplication)
    private applicationRepository: Repository<JobApplication>,
  ) {}

  // ========== GESTION DES OFFRES D'EMPLOI ==========

  async createJobPosting(
    posterId: number,
    createJobDto: CreateJobPostingDto,
  ): Promise<JobPosting> {
    const slug = this.generateSlug(createJobDto.title);

    const job = this.jobRepository.create({
      ...createJobDto,
      postedBy: posterId,
      slug,
    });

    return await this.jobRepository.save(job);
  }

  async getAllJobPostings(
    page: number = 1,
    limit: number = 10,
    jobType?: string,
    location?: string,
    isRemote?: boolean,
  ): Promise<{ jobs: JobPosting[]; total: number; pages: number }> {
    const query = this.jobRepository
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.poster', 'poster')
      .where('job.status = :status', { status: JobStatus.OPEN })
      .orderBy('job.createdAt', 'DESC');

    if (jobType) {
      query.andWhere('job.jobType = :jobType', { jobType });
    }

    if (location) {
      query.andWhere('job.location LIKE :location', {
        location: `%${location}%`,
      });
    }

    if (isRemote !== undefined) {
      query.andWhere('job.isRemote = :isRemote', { isRemote });
    }

    const total = await query.getCount();
    const jobs = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      jobs,
      total,
      pages: Math.ceil(total / limit),
    };
  }


  async getJobBySlug(slug: string, userId?: number): Promise<JobPosting> {
    const job = await this.jobRepository.findOne({
      where: { slug },
      relations: ['poster'],
    });

    if (!job) {
      throw new NotFoundException('Offre introuvable');
    }

    // Incrémenter le compteur de vues
    job.viewCount += 1;
    await this.jobRepository.save(job);

    // Vérifier si l'utilisateur a déjà postulé
    if (userId) {
      const application = await this.applicationRepository.findOne({
        where: { userId, jobId: job.id },
      });
      (job as any).hasApplied = !!application;
      (job as any).userApplication = application;
    }

    return job;
  }

  async getMyJobPostings(posterId: number): Promise<JobPosting[]> {
    return await this.jobRepository.find({
      where: { postedBy: posterId },
      relations: ['applications'],
      order: { createdAt: 'DESC' },
    });
  }

  async updateJobPosting(
    jobId: number,
    posterId: number,
    updateJobDto: UpdateJobPostingDto,
  ): Promise<JobPosting> {
    const job = await this.jobRepository.findOne({ where: { id: jobId } });

    if (!job) {
      throw new NotFoundException('Offre introuvable');
    }

    if (job.postedBy !== posterId) {
      throw new ForbiddenException('Vous ne pouvez pas modifier cette offre');
    }

    Object.assign(job, updateJobDto);
    return await this.jobRepository.save(job);
  }

  async publishJobPosting(
    jobId: number,
    posterId: number,
  ): Promise<JobPosting> {
    const job = await this.jobRepository.findOne({ where: { id: jobId } });

    if (!job) {
      throw new NotFoundException('Offre introuvable');
    }

    if (job.postedBy !== posterId) {
      throw new ForbiddenException('Vous ne pouvez pas publier cette offre');
    }

    job.status = JobStatus.OPEN;
    job.publishedAt = new Date();

    return await this.jobRepository.save(job);
  }

  async closeJobPosting(jobId: number, posterId: number): Promise<JobPosting> {
    const job = await this.jobRepository.findOne({ where: { id: jobId } });

    if (!job) {
      throw new NotFoundException('Offre introuvable');
    }

    if (job.postedBy !== posterId) {
      throw new ForbiddenException('Vous ne pouvez pas fermer cette offre');
    }

    job.status = JobStatus.CLOSED;
    return await this.jobRepository.save(job);
  }

  async deleteJobPosting(jobId: number, posterId: number): Promise<void> {
    const job = await this.jobRepository.findOne({ where: { id: jobId } });

    if (!job) {
      throw new NotFoundException('Offre introuvable');
    }

    if (job.postedBy !== posterId) {
      throw new ForbiddenException('Vous ne pouvez pas supprimer cette offre');
    }

    await this.jobRepository.remove(job);
  }

  // ========== GESTION DES CANDIDATURES ==========

  async applyToJob(
    userId: number,
    jobId: number,
    createApplicationDto: CreateApplicationDto,
  ): Promise<JobApplication> {
    const job = await this.jobRepository.findOne({ where: { id: jobId } });

    if (!job) {
      throw new NotFoundException('Offre introuvable');
    }

    if (job.status !== JobStatus.OPEN) {
      throw new BadRequestException(
        "Cette offre n'accepte plus de candidatures",
      );
    }

    // Vérifier si deadline dépassée
    if (job.deadline && job.deadline < new Date()) {
      throw new BadRequestException('La date limite est dépassée');
    }

    // Vérifier si déjà candidaté
    const existingApplication = await this.applicationRepository.findOne({
      where: { userId, jobId },
    });

    if (existingApplication) {
      throw new BadRequestException('Vous avez déjà postulé à cette offre');
    }

    const application = this.applicationRepository.create({
      ...createApplicationDto,
      userId,
      jobId,
    });

    await this.applicationRepository.save(application);

    // Incrémenter le compteur de candidatures
    job.applicationCount += 1;
    await this.jobRepository.save(job);

    return application;
  }

  async getMyApplications(userId: number): Promise<JobApplication[]> {
    return await this.applicationRepository.find({
      where: { userId },
      relations: ['job', 'job.poster'],
      order: { appliedAt: 'DESC' },
    });
  }

  async getJobApplications(
    jobId: number,
    posterId: number,
  ): Promise<JobApplication[]> {
    const job = await this.jobRepository.findOne({ where: { id: jobId } });

    if (!job) {
      throw new NotFoundException('Offre introuvable');
    }

    if (job.postedBy !== posterId) {
      throw new ForbiddenException(
        'Vous ne pouvez pas voir les candidatures de cette offre',
      );
    }

    return await this.applicationRepository.find({
      where: { jobId },
      relations: ['user'],
      order: { appliedAt: 'DESC' },
    });
  }

  async updateApplicationStatus(
    applicationId: number,
    posterId: number,
    updateStatusDto: UpdateApplicationStatusDto,
  ): Promise<JobApplication> {
    const application = await this.applicationRepository.findOne({
      where: { id: applicationId },
      relations: ['job'],
    });

    if (!application) {
      throw new NotFoundException('Candidature introuvable');
    }

    if (application.job.postedBy !== posterId) {
      throw new ForbiddenException(
        'Vous ne pouvez pas modifier cette candidature',
      );
    }

    application.status = updateStatusDto.status;
    application.notes = updateStatusDto.notes || application.notes;
    application.feedback = updateStatusDto.feedback || application.feedback;
    application.reviewedAt = new Date();
    application.reviewedBy = posterId;

    return await this.applicationRepository.save(application);
  }

  async withdrawApplication(
    applicationId: number,
    userId: number,
  ): Promise<JobApplication> {
    const application = await this.applicationRepository.findOne({
      where: { id: applicationId },
      relations: ['job'],
    });

    if (!application) {
      throw new NotFoundException('Candidature introuvable');
    }

    if (application.userId !== userId) {
      throw new ForbiddenException(
        'Vous ne pouvez pas retirer cette candidature',
      );
    }

    application.status = ApplicationStatus.WITHDRAWN;
    return await this.applicationRepository.save(application);
  }

  // ========== STATISTIQUES ==========

  async getJobStatistics(jobId: number, posterId: number) {
    const job = await this.jobRepository.findOne({ where: { id: jobId } });

    if (!job) {
      throw new NotFoundException('Offre introuvable');
    }

    if (job.postedBy !== posterId) {
      throw new ForbiddenException('Accès refusé');
    }

    const applications = await this.applicationRepository.find({
      where: { jobId },
    });

    const statusCounts = applications.reduce(
      (acc, app) => {
        acc[app.status] = (acc[app.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      totalApplications: applications.length,
      statusBreakdown: statusCounts,
      viewCount: job.viewCount,
      averageApplicationsPerDay:
        applications.length /
        Math.max(
          1,
          Math.ceil(
            (Date.now() - job.createdAt.getTime()) / (1000 * 60 * 60 * 24),
          ),
        ),
    };
  }

  // ========== UTILITAIRES ==========

  private generateSlug(title: string): string {
    return (
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') +
      '-' +
      Date.now()
    );
  }

  async searchJobs(query: string): Promise<JobPosting[]> {
    return await this.jobRepository
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.poster', 'poster')
      .where('job.status = :status', { status: JobStatus.OPEN })
      .andWhere(
        '(job.title LIKE :query OR job.description LIKE :query OR job.company LIKE :query)',
        { query: `%${query}%` },
      )
      .orderBy('job.createdAt', 'DESC')
      .getMany();
  }
}
