import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { JobApplication } from '../entities/job-application.entity';
import { JobPosting } from '../entities/job-posting.entity';
import { Lesson } from '../entities/lesson.entity';
import { BlogPost } from '../entities/blog-post.entity';
import {
  UpdateUserRoleDto,
  UpdatePublisherStatusDto,
} from './dto/update-user-role.dto';
import { ApproveApplicationDto } from './dto/approve-application.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(JobApplication)
    private applicationRepository: Repository<JobApplication>,
    @InjectRepository(JobPosting)
    private jobRepository: Repository<JobPosting>,
    @InjectRepository(Lesson)
    private lessonRepository: Repository<Lesson>,
    @InjectRepository(BlogPost)
    private blogRepository: Repository<BlogPost>,
  ) {}

  // ========== GESTION DES UTILISATEURS ==========

  async getAllUsers(
    page: number = 1,
    limit: number = 20,
  ): Promise<{ users: User[]; total: number; pages: number }> {
    const [users, total] = await this.userRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
      select: [
        'id',
        'username',
        'email',
        'avatar',
        'isAdmin',
        'isPublisher',
        'createdAt',
      ],
    });

    return {
      users,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  async getUserById(userId: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    return user;
  }

  async makeUserAdmin(
    adminId: number,
    targetUserId: number,
    updateRoleDto: UpdateUserRoleDto,
  ): Promise<User> {
    // Vérifier que l'admin ne se retire pas lui-même les droits
    if (adminId === targetUserId && !updateRoleDto.isAdmin) {
      throw new BadRequestException(
        'Vous ne pouvez pas vous retirer les droits administrateur',
      );
    }

    const user = await this.userRepository.findOne({
      where: { id: targetUserId },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    user.isAdmin = updateRoleDto.isAdmin;
    return await this.userRepository.save(user);
  }

  async updatePublisherStatus(
    targetUserId: number,
    updateStatusDto: UpdatePublisherStatusDto,
  ): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: targetUserId },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    user.isPublisher = updateStatusDto.isPublisher;
    return await this.userRepository.save(user);
  }

  async deleteUser(userId: number): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    if (user.isAdmin) {
      throw new BadRequestException(
        'Impossible de supprimer un administrateur',
      );
    }

    await this.userRepository.remove(user);
  }

  // ========== GESTION DES CANDIDATURES ==========

  async getAllApplications(
    page: number = 1,
    limit: number = 20,
    status?: string,
  ): Promise<{ applications: JobApplication[]; total: number; pages: number }> {
    const query = this.applicationRepository
      .createQueryBuilder('app')
      .leftJoinAndSelect('app.user', 'user')
      .leftJoinAndSelect('app.job', 'job')
      .orderBy('app.appliedAt', 'DESC');

    if (status) {
      query.where('app.status = :status', { status });
    }

    const total = await query.getCount();
    const applications = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      applications,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  async approveApplication(
    applicationId: number,
    adminId: number,
    approveDto: ApproveApplicationDto,
  ): Promise<JobApplication> {
    const application = await this.applicationRepository.findOne({
      where: { id: applicationId },
      relations: ['user', 'job'],
    });

    if (!application) {
      throw new NotFoundException('Candidature introuvable');
    }

    application.status = approveDto.status;
    application.feedback = approveDto.feedback || application.feedback;
    application.reviewedAt = new Date();
    application.reviewedBy = adminId;

    return await this.applicationRepository.save(application);
  }

  // ========== GESTION DES LEÇONS ==========

  async getAllLessons(
    page: number = 1,
    limit: number = 20,
  ): Promise<{ lessons: Lesson[]; total: number; pages: number }> {
    const [lessons, total] = await this.lessonRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      relations: ['instructor'],
      order: { createdAt: 'DESC' },
    });

    return {
      lessons,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  async deleteLesson(lessonId: number): Promise<void> {
    const lesson = await this.lessonRepository.findOne({
      where: { id: lessonId },
    });

    if (!lesson) {
      throw new NotFoundException('Leçon introuvable');
    }

    await this.lessonRepository.remove(lesson);
  }

  // ========== GESTION DES ARTICLES ==========

  async getAllBlogPosts(
    page: number = 1,
    limit: number = 20,
  ): Promise<{ posts: BlogPost[]; total: number; pages: number }> {
    const [posts, total] = await this.blogRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      relations: ['author'],
      order: { createdAt: 'DESC' },
    });

    return {
      posts,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  async deleteBlogPost(postId: number): Promise<void> {
    const post = await this.blogRepository.findOne({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Article introuvable');
    }

    await this.blogRepository.remove(post);
  }

  // ========== STATISTIQUES ==========

  async getDashboardStats() {
    const [
      totalUsers,
      totalAdmins,
      totalPublishers,
      totalLessons,
      totalPosts,
      totalApplications,
      pendingApplications,
      totalJobs,
      openJobs,
    ] = await Promise.all([
      this.userRepository.count(),
      this.userRepository.count({ where: { isAdmin: true } }),
      this.userRepository.count({ where: { isPublisher: true } }),
      this.lessonRepository.count(),
      this.blogRepository.count(),
      this.applicationRepository.count(),
      this.applicationRepository.count({ where: { status: 'pending' as any } }),
      this.jobRepository.count(),
      this.jobRepository.count({ where: { status: 'open' as any } }),
    ]);

    // Utilisateurs récents
    const recentUsers = await this.userRepository.find({
      order: { createdAt: 'DESC' },
      take: 5,
      select: [
        'id',
        'username',
        'email',
        'createdAt',
        'isAdmin',
        'isPublisher',
      ],
    });

    // Offres d'emploi récentes
    const recentJobs = await this.jobRepository.find({
      order: { createdAt: 'DESC' },
      take: 10,
      relations: ['poster'],
    });

    // Candidatures récentes
    const recentApplications = await this.applicationRepository.find({
      order: { appliedAt: 'DESC' },
      take: 10,
      relations: ['user', 'job'],
    });

    return {
      users: {
        total: totalUsers,
        admins: totalAdmins,
        publishers: totalPublishers,
        recent: recentUsers,
      },
      content: {
        lessons: totalLessons,
        blogPosts: totalPosts,
      },
      jobs: {
        total: totalJobs,
        open: openJobs,
        recent: recentJobs,
      },
      applications: {
        total: totalApplications,
        pending: pendingApplications,
        recent: recentApplications,
      },
    };
  }
}
