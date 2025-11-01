import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lesson, LessonStatus } from '../entities/lesson.entity';
import { LessonModule } from '../entities/lesson-module.entity';
import { LessonContent } from '../entities/lesson-content.entity';
import {
  LessonEnrollment,
  EnrollmentStatus,
} from '../entities/lesson-enrollment.entity';
import { LessonProgress } from '../entities/lesson-progress.entity';
import { Payment, PaymentStatus } from '../entities/payment.entity';
import { User } from '../entities/user.entity';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { CreateModuleDto } from './dto/create-module.dto';
import { CreateContentDto } from './dto/create-content.dto';
import { EnrollLessonDto } from './dto/enroll-lesson.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';

@Injectable()
export class LessonsService {
  constructor(
    @InjectRepository(Lesson)
    private lessonRepository: Repository<Lesson>,
    @InjectRepository(LessonModule)
    private moduleRepository: Repository<LessonModule>,
    @InjectRepository(LessonContent)
    private contentRepository: Repository<LessonContent>,
    @InjectRepository(LessonEnrollment)
    private enrollmentRepository: Repository<LessonEnrollment>,
    @InjectRepository(LessonProgress)
    private progressRepository: Repository<LessonProgress>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // ========== GESTION DES LEÇONS ==========

  async createLesson(
    instructorId: number,
    createLessonDto: CreateLessonDto,
  ): Promise<Lesson> {
    // ✅ Vérifier que l'utilisateur a le droit de créer des leçons
    const user = await this.userRepository.findOne({
      where: { id: instructorId },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    if (!user.isPublisher) {
      throw new ForbiddenException(
        'Vous devez avoir le statut de publisher pour créer des leçons',
      );
    }

    const lesson = this.lessonRepository.create({
      ...createLessonDto,
      instructorId,
    });

    return await this.lessonRepository.save(lesson);
  }

  async getAllLessons(userId?: number): Promise<Lesson[]> {
    const lessons = await this.lessonRepository.find({
      where: { status: LessonStatus.PUBLISHED },
      relations: ['instructor', 'modules'],
      order: { createdAt: 'DESC' },
    });

    if (userId) {
      // Vérifier l'inscription pour chaque leçon
      const lessonsWithEnrollment = await Promise.all(
        lessons.map(async (lesson) => {
          const enrollment = await this.enrollmentRepository.findOne({
            where: { lessonId: lesson.id, userId },
          });
          return {
            ...lesson,
            isEnrolled: !!enrollment,
            progress: enrollment?.progress || 0,
          };
        }),
      );
      return lessonsWithEnrollment as any;
    }

    return lessons;
  }

  async getLessonById(lessonId: number, userId?: number): Promise<Lesson> {
    const lesson = await this.lessonRepository.findOne({
      where: { id: lessonId },
      relations: ['instructor', 'modules', 'modules.contents'],
    });

    if (!lesson) {
      throw new NotFoundException('Leçon introuvable');
    }

    // Si un utilisateur est connecté, vérifier son accès
    if (userId) {
      const enrollment = await this.checkUserAccess(userId, lessonId);
      (lesson as any).isEnrolled = !!enrollment;
      (lesson as any).progress = enrollment?.progress || 0;

      // Si pas inscrit, masquer le contenu payant
      if (!enrollment && !lesson.isFree) {
        lesson.modules.forEach((module) => {
          module.contents = module.contents.filter((c) => c.isFreePreview);
        });
      }
    } else {
      // Utilisateur non connecté, ne montrer que les previews
      lesson.modules.forEach((module) => {
        module.contents = module.contents.filter((c) => c.isFreePreview);
      });
    }

    return lesson;
  }

  async getMyLessons(instructorId: number): Promise<Lesson[]> {
    return await this.lessonRepository.find({
      where: { instructorId },
      relations: ['modules'],
      order: { createdAt: 'DESC' },
    });
  }

  async updateLesson(
    lessonId: number,
    instructorId: number,
    updateLessonDto: UpdateLessonDto,
  ): Promise<Lesson> {
    const lesson = await this.lessonRepository.findOne({
      where: { id: lessonId },
    });

    if (!lesson) {
      throw new NotFoundException('Leçon introuvable');
    }

    if (lesson.instructorId !== instructorId) {
      throw new ForbiddenException(
        'Vous ne pouvez pas modifier cette leçon',
      );
    }

    Object.assign(lesson, updateLessonDto);
    return await this.lessonRepository.save(lesson);
  }

  async publishLesson(lessonId: number, instructorId: number): Promise<Lesson> {
    const lesson = await this.lessonRepository.findOne({
      where: { id: lessonId },
    });

    if (!lesson) {
      throw new NotFoundException('Leçon introuvable');
    }

    if (lesson.instructorId !== instructorId) {
      throw new ForbiddenException(
        'Vous ne pouvez pas publier cette leçon',
      );
    }

    lesson.status = LessonStatus.PUBLISHED;
    return await this.lessonRepository.save(lesson);
  }

  async deleteLesson(lessonId: number, instructorId: number): Promise<void> {
    const lesson = await this.lessonRepository.findOne({
      where: { id: lessonId },
    });

    if (!lesson) {
      throw new NotFoundException('Leçon introuvable');
    }

    if (lesson.instructorId !== instructorId) {
      throw new ForbiddenException(
        'Vous ne pouvez pas supprimer cette leçon',
      );
    }

    await this.lessonRepository.remove(lesson);
  }

  // ========== GESTION DES MODULES ==========

  async createModule(
    lessonId: number,
    instructorId: number,
    createModuleDto: CreateModuleDto,
  ): Promise<LessonModule> {
    const lesson = await this.lessonRepository.findOne({
      where: { id: lessonId },
    });

    if (!lesson) {
      throw new NotFoundException('Leçon introuvable');
    }

    if (lesson.instructorId !== instructorId) {
      throw new ForbiddenException(
        'Vous ne pouvez pas ajouter de module à cette leçon',
      );
    }

    const module = this.moduleRepository.create({
      ...createModuleDto,
      lessonId,
    });

    return await this.moduleRepository.save(module);
  }

  // ========== GESTION DU CONTENU ==========

  async createContent(
    moduleId: number,
    instructorId: number,
    createContentDto: CreateContentDto,
  ): Promise<LessonContent> {
    const module = await this.moduleRepository.findOne({
      where: { id: moduleId },
      relations: ['lesson'],
    });

    if (!module) {
      throw new NotFoundException('Module introuvable');
    }

    if (module.lesson.instructorId !== instructorId) {
      throw new ForbiddenException(
        'Vous ne pouvez pas ajouter de contenu à ce module',
      );
    }

    const content = this.contentRepository.create({
      ...createContentDto,
      moduleId,
    });

    return await this.contentRepository.save(content);
  }

  async getContent(
    contentId: number,
    userId: number,
  ): Promise<LessonContent> {
    const content = await this.contentRepository.findOne({
      where: { id: contentId },
      relations: ['module', 'module.lesson'],
    });

    if (!content) {
      throw new NotFoundException('Contenu introuvable');
    }

    // Vérifier l'accès
    if (!content.isFreePreview && !content.module.lesson.isFree) {
      const enrollment = await this.checkUserAccess(
        userId,
        content.module.lesson.id,
      );
      if (!enrollment) {
        throw new ForbiddenException(
          'Vous devez être inscrit pour accéder à ce contenu',
        );
      }
    }

    return content;
  }

  // ========== INSCRIPTION ET PAIEMENT ==========

  async enrollLesson(
    userId: number,
    enrollLessonDto: EnrollLessonDto,
  ): Promise<LessonEnrollment> {
    const { lessonId, paymentMethod } = enrollLessonDto;

    const lesson = await this.lessonRepository.findOne({
      where: { id: lessonId },
    });

    if (!lesson) {
      throw new NotFoundException('Leçon introuvable');
    }

    // Vérifier si déjà inscrit
    const existingEnrollment = await this.enrollmentRepository.findOne({
      where: { userId, lessonId },
    });

    if (existingEnrollment) {
      throw new BadRequestException('Vous êtes déjà inscrit à cette leçon');
    }

    // Si gratuit, inscription directe
    if (lesson.isFree || lesson.price === 0) {
      const enrollment = this.enrollmentRepository.create({
        userId,
        lessonId,
        pricePaid: 0,
        status: EnrollmentStatus.ACTIVE,
      });

      await this.enrollmentRepository.save(enrollment);

      // Incrémenter le compteur d'inscriptions
      lesson.enrollmentCount += 1;
      await this.lessonRepository.save(lesson);

      return enrollment;
    }

    // Créer un paiement
    const payment = this.paymentRepository.create({
      userId,
      lessonId,
      amount: lesson.price,
      method: paymentMethod,
      status: PaymentStatus.PENDING,
    });

    await this.paymentRepository.save(payment);

    // TODO: Intégrer Stripe/PayPal ici
    // Pour l'instant, on simule un paiement réussi
    payment.status = PaymentStatus.COMPLETED;
    payment.transactionId = `TXN-${Date.now()}`;
    await this.paymentRepository.save(payment);

    // Créer l'inscription
    const enrollment = this.enrollmentRepository.create({
      userId,
      lessonId,
      pricePaid: lesson.price,
      status: EnrollmentStatus.ACTIVE,
    });

    await this.enrollmentRepository.save(enrollment);

    // Incrémenter le compteur d'inscriptions
    lesson.enrollmentCount += 1;
    await this.lessonRepository.save(lesson);

    return enrollment;
  }

  async getMyEnrollments(userId: number): Promise<LessonEnrollment[]> {
    return await this.enrollmentRepository.find({
      where: { userId },
      relations: ['lesson', 'lesson.instructor'],
      order: { enrolledAt: 'DESC' },
    });
  }

  // ========== PROGRESSION ==========

  async updateProgress(
    userId: number,
    updateProgressDto: UpdateProgressDto,
  ): Promise<LessonProgress> {
    const { contentId, isCompleted, timeSpent } = updateProgressDto;

    const content = await this.contentRepository.findOne({
      where: { id: contentId },
      relations: ['module', 'module.lesson'],
    });

    if (!content) {
      throw new NotFoundException('Contenu introuvable');
    }

    // Vérifier l'accès
    const enrollment = await this.checkUserAccess(
      userId,
      content.module.lesson.id,
    );
    if (!enrollment && !content.module.lesson.isFree) {
      throw new ForbiddenException('Vous devez être inscrit à cette leçon');
    }

    let progress = await this.progressRepository.findOne({
      where: { userId, contentId },
    });

    if (!progress) {
      progress = this.progressRepository.create({
        userId,
        contentId,
        isCompleted,
        timeSpent,
      });
    } else {
      progress.isCompleted = isCompleted;
      progress.timeSpent += timeSpent;
    }

    if (isCompleted && !progress.completedAt) {
      progress.completedAt = new Date();
    }

    await this.progressRepository.save(progress);

    // Mettre à jour la progression globale de la leçon
    if (enrollment) {
      await this.updateLessonProgress(userId, content.module.lesson.id);
    }

    return progress;
  }

  private async updateLessonProgress(
    userId: number,
    lessonId: number,
  ): Promise<void> {
    const lesson = await this.lessonRepository.findOne({
      where: { id: lessonId },
      relations: ['modules', 'modules.contents'],
    });

    if (!lesson) return;

    let totalContents = 0;
    let completedContents = 0;

    for (const module of lesson.modules) {
      for (const content of module.contents) {
        totalContents++;
        const progress = await this.progressRepository.findOne({
          where: { userId, contentId: content.id, isCompleted: true },
        });
        if (progress) {
          completedContents++;
        }
      }
    }

    const progressPercentage =
      totalContents > 0 ? Math.round((completedContents / totalContents) * 100) : 0;

    const enrollment = await this.enrollmentRepository.findOne({
      where: { userId, lessonId },
    });

    if (enrollment) {
      enrollment.progress = progressPercentage;
      if (progressPercentage === 100 && !enrollment.completedAt) {
        enrollment.completedAt = new Date();
        enrollment.status = EnrollmentStatus.COMPLETED;
      }
      await this.enrollmentRepository.save(enrollment);
    }
  }

  async getLessonProgress(
    userId: number,
    lessonId: number,
  ): Promise<LessonProgress[]> {
    const lesson = await this.lessonRepository.findOne({
      where: { id: lessonId },
      relations: ['modules', 'modules.contents'],
    });

    if (!lesson) {
      throw new NotFoundException('Leçon introuvable');
    }

    const contentIds = lesson.modules.flatMap((module) =>
      module.contents.map((content) => content.id),
    );

    return await this.progressRepository.find({
      where: { userId, contentId: contentIds as any },
      relations: ['content'],
    });
  }

  // ========== UTILITAIRES ==========

  private async checkUserAccess(
    userId: number,
    lessonId: number,
  ): Promise<LessonEnrollment | null> {
    return await this.enrollmentRepository.findOne({
      where: {
        userId,
        lessonId,
        status: EnrollmentStatus.ACTIVE,
      },
    });
  }
}