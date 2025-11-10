import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Podcast, PodcastStatus } from '../entities/podcast.entity';
import { User } from '../entities/user.entity';
import { CreatePodcastDto, UpdatePodcastDto } from './dto/create-podcast.dto';
import { SocialShareService } from '../social/social-share.service';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class PodcastService {
  constructor(
    @InjectRepository(Podcast)
    private podcastRepository: Repository<Podcast>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private socialShareService: SocialShareService,
    private uploadService: UploadService,
  ) {}

  async createPodcast(
    publisherId: number,
    createPodcastDto: CreatePodcastDto,
    mediaFile: Express.Multer.File,
    thumbnailFile?: Express.Multer.File,
  ): Promise<Podcast> {
    // Vérifier que l'utilisateur est un publisher
    const user = await this.userRepository.findOne({
      where: { id: publisherId },
    });

    if (!user || !user.isPublisher) {
      throw new ForbiddenException(
        'Vous devez être un publisher pour créer un podcast',
      );
    }

    // Upload du fichier média
    const mediaUrl = await this.uploadService.uploadPodcastMedia(
      mediaFile,
      createPodcastDto.type,
    );

    // Upload de la miniature si fournie
    let thumbnailUrl: string | undefined;
    if (thumbnailFile) {
      thumbnailUrl = await this.uploadService.uploadThumbnail(thumbnailFile);
    }

    const podcast = this.podcastRepository.create({
      ...createPodcastDto,
      mediaUrl,
      thumbnailUrl:
        thumbnailUrl || createPodcastDto.type === 'video'
          ? mediaUrl
          : undefined,
      publisherId,
    });

    return await this.podcastRepository.save(podcast);
  }

  async getAllPodcasts(
    page: number = 1,
    limit: number = 20,
    type?: string,
    category?: string,
  ): Promise<{ podcasts: Podcast[]; total: number; pages: number }> {
    const query = this.podcastRepository
      .createQueryBuilder('podcast')
      .leftJoinAndSelect('podcast.publisher', 'publisher')
      .where('podcast.status = :status', { status: PodcastStatus.PUBLISHED })
      .orderBy('podcast.publishedAt', 'DESC');

    if (type) {
      query.andWhere('podcast.type = :type', { type });
    }

    if (category) {
      query.andWhere('podcast.category = :category', { category });
    }

    const total = await query.getCount();
    const podcasts = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      podcasts,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  async getPodcastById(id: number): Promise<Podcast> {
    const podcast = await this.podcastRepository.findOne({
      where: { id },
      relations: ['publisher'],
    });

    if (!podcast) {
      throw new NotFoundException('Podcast introuvable');
    }

    // Incrémenter le compteur d'écoutes
    podcast.listenCount += 1;
    await this.podcastRepository.save(podcast);

    return podcast;
  }

  async getMyPodcasts(publisherId: number): Promise<Podcast[]> {
    return await this.podcastRepository.find({
      where: { publisherId },
      order: { createdAt: 'DESC' },
    });
  }

  async updatePodcast(
    id: number,
    publisherId: number,
    updatePodcastDto: UpdatePodcastDto,
    mediaFile?: Express.Multer.File,
    thumbnailFile?: Express.Multer.File,
  ): Promise<Podcast> {
    const podcast = await this.podcastRepository.findOne({ where: { id } });

    if (!podcast) {
      throw new NotFoundException('Podcast introuvable');
    }

    if (podcast.publisherId !== publisherId) {
      throw new ForbiddenException('Vous ne pouvez pas modifier ce podcast');
    }

    // Upload nouveau média si fourni
    if (mediaFile) {
      // Supprimer l'ancien fichier
      await this.uploadService.deleteFile(podcast.mediaUrl);

      const mediaUrl = await this.uploadService.uploadPodcastMedia(
        mediaFile,
        updatePodcastDto.type || podcast.type,
      );
      podcast.mediaUrl = mediaUrl;
    }

    // Upload nouvelle miniature si fournie
    if (thumbnailFile) {
      if (podcast.thumbnailUrl) {
        await this.uploadService.deleteFile(podcast.thumbnailUrl);
      }

      const thumbnailUrl =
        await this.uploadService.uploadThumbnail(thumbnailFile);
      podcast.thumbnailUrl = thumbnailUrl;
    }

    Object.assign(podcast, updatePodcastDto);
    return await this.podcastRepository.save(podcast);
  }

  async publishPodcast(id: number, publisherId: number): Promise<Podcast> {
    const podcast = await this.podcastRepository.findOne({
      where: { id },
      relations: ['publisher'],
    });

    if (!podcast) {
      throw new NotFoundException('Podcast introuvable');
    }

    if (podcast.publisherId !== publisherId) {
      throw new ForbiddenException('Vous ne pouvez pas publier ce podcast');
    }

    podcast.status = PodcastStatus.PUBLISHED;
    podcast.publishedAt = new Date();

    await this.podcastRepository.save(podcast);

    // ✅ Partager automatiquement sur les réseaux sociaux si activé
    if (podcast.autoShareOnPublish) {
      try {
        const shareResults = await this.socialShareService.shareOnAllPlatforms(
          publisherId,
          podcast,
        );

        podcast.socialShareData = shareResults;
        await this.podcastRepository.save(podcast);

        console.log(
          '✅ Podcast partagé sur les réseaux sociaux:',
          shareResults,
        );
      } catch (error) {
        console.error('❌ Erreur lors du partage social:', error);
      }
    }

    return podcast;
  }

  async deletePodcast(id: number, publisherId: number): Promise<void> {
    const podcast = await this.podcastRepository.findOne({ where: { id } });

    if (!podcast) {
      throw new NotFoundException('Podcast introuvable');
    }

    if (podcast.publisherId !== publisherId) {
      throw new ForbiddenException('Vous ne pouvez pas supprimer ce podcast');
    }

    // Supprimer les fichiers
    await this.uploadService.deleteFile(podcast.mediaUrl);
    if (podcast.thumbnailUrl) {
      await this.uploadService.deleteFile(podcast.thumbnailUrl);
    }

    await this.podcastRepository.remove(podcast);
  }

  async searchPodcasts(query: string): Promise<Podcast[]> {
    return await this.podcastRepository
      .createQueryBuilder('podcast')
      .leftJoinAndSelect('podcast.publisher', 'publisher')
      .where('podcast.status = :status', { status: PodcastStatus.PUBLISHED })
      .andWhere(
        '(podcast.title LIKE :query OR podcast.description LIKE :query OR podcast.tags LIKE :query)',
        { query: `%${query}%` },
      )
      .orderBy('podcast.publishedAt', 'DESC')
      .getMany();
  }

  async toggleLike(podcastId: number): Promise<Podcast> {
    const podcast = await this.podcastRepository.findOne({
      where: { id: podcastId },
    });

    if (!podcast) {
      throw new NotFoundException('Podcast introuvable');
    }

    podcast.likeCount += 1;
    return await this.podcastRepository.save(podcast);
  }
}
