import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

@Injectable()
export class UploadService {
  private readonly uploadPath: string;
  private readonly allowedAudioTypes = [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
  ];
  private readonly allowedVideoTypes = [
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/webm',
  ];
  private readonly allowedImageTypes = [
    'image/jpeg',
    'image/png',
    'image/jpg',
    'image/webp',
  ];
  private readonly maxFileSize = 500 * 1024 * 1024; // 500MB

  constructor(private configService: ConfigService) {
    this.uploadPath = this.configService.get('UPLOAD_PATH') || './uploads';
    this.ensureUploadDirectory();
  }

  private async ensureUploadDirectory() {
    const directories = [
      'podcasts/audio',
      'podcasts/video',
      'podcasts/thumbnails',
    ];

    for (const dir of directories) {
      const fullPath = path.join(this.uploadPath, dir);
      if (!fs.existsSync(fullPath)) {
        await mkdir(fullPath, { recursive: true });
      }
    }
  }

  async uploadPodcastMedia(
    file: Express.Multer.File,
    type: 'audio' | 'video',
  ): Promise<string> {
    // Vérifier le type de fichier
    const allowedTypes =
      type === 'audio' ? this.allowedAudioTypes : this.allowedVideoTypes;
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Type de fichier non supporté. Types acceptés: ${allowedTypes.join(', ')}`,
      );
    }

    // Vérifier la taille
    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `Fichier trop volumineux. Taille maximale: ${this.maxFileSize / (1024 * 1024)}MB`,
      );
    }

    // Générer un nom unique
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const extension = path.extname(file.originalname);
    const filename = `${timestamp}-${randomString}${extension}`;
    const relativePath = `podcasts/${type}/${filename}`;
    const fullPath = path.join(this.uploadPath, relativePath);

    // Sauvegarder le fichier
    await writeFile(fullPath, file.buffer);

    // Retourner l'URL publique
    const baseUrl =
      this.configService.get('APP_URL') || 'http://localhost:3001';
    return `${baseUrl}/uploads/${relativePath}`;
  }

  async uploadThumbnail(file: Express.Multer.File): Promise<string> {
    // Vérifier le type
    if (!this.allowedImageTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Type d'image non supporté. Types acceptés: ${this.allowedImageTypes.join(', ')}`,
      );
    }

    // Vérifier la taille (10MB max pour images)
    if (file.size > 10 * 1024 * 1024) {
      throw new BadRequestException(
        'Image trop volumineuse. Taille maximale: 10MB',
      );
    }

    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const extension = path.extname(file.originalname);
    const filename = `${timestamp}-${randomString}${extension}`;
    const relativePath = `podcasts/thumbnails/${filename}`;
    const fullPath = path.join(this.uploadPath, relativePath);

    await writeFile(fullPath, file.buffer);

    const baseUrl =
      this.configService.get('APP_URL') || 'http://localhost:3001';
    return `${baseUrl}/uploads/${relativePath}`;
  }

  async deleteFile(fileUrl: string): Promise<void> {
    try {
      // Extraire le chemin relatif de l'URL
      const urlPath = new URL(fileUrl).pathname;
      const relativePath = urlPath.replace('/uploads/', '');
      const fullPath = path.join(this.uploadPath, relativePath);

      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  }
}
