import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Utiliser le type de Multer directement
export type UploadedFile = Express.Multer.File;

@Injectable()
export class FileUploadService {
  private readonly uploadDir = path.join(process.cwd(), 'uploads');

  // Limites de taille en bytes
  private readonly MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50 MB
  private readonly MAX_AUDIO_SIZE = 20 * 1024 * 1024; // 20 MB
  private readonly MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB

  constructor() {
    this.ensureUploadDirExists();
  }

  private async ensureUploadDirExists() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
      await fs.mkdir(path.join(this.uploadDir, 'podcasts'), {
        recursive: true,
      });
      await fs.mkdir(path.join(this.uploadDir, 'thumbnails'), {
        recursive: true,
      });
    } catch (error) {
      console.error('Error creating upload directories:', error);
    }
  }

  /**
   * Valider et uploader un fichier média (audio/vidéo)
   */
  async uploadMediaFile(
    file: UploadedFile | undefined,
    type: 'audio' | 'video',
  ): Promise<string> {
    // Vérifier que le fichier existe
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni');
    }

    // Vérifier le type MIME
    const allowedMimeTypes =
      type === 'video'
        ? ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']
        : [
            'audio/mpeg',
            'audio/mp3',
            'audio/wav',
            'audio/ogg',
            'audio/aac',
            'audio/x-m4a',
          ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Format de fichier non supporté. Formats acceptés: ${allowedMimeTypes.join(', ')}`,
      );
    }

    // Vérifier la taille
    const maxSize =
      type === 'video' ? this.MAX_VIDEO_SIZE : this.MAX_AUDIO_SIZE;
    if (file.size > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024);
      throw new BadRequestException(
        `Le fichier est trop volumineux. Taille maximale: ${maxSizeMB}MB`,
      );
    }

    // Générer un nom de fichier unique
    const fileExtension = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExtension}`;
    const filePath = path.join(this.uploadDir, 'podcasts', fileName);

    try {
      // Sauvegarder le fichier
      await fs.writeFile(filePath, file.buffer);

      // Retourner l'URL relative
      return `/uploads/podcasts/${fileName}`;
    } catch (error) {
      console.error('Error uploading media file:', error);
      throw new InternalServerErrorException(
        "Erreur lors de l'upload du fichier",
      );
    }
  }

  /**
   * Valider et uploader une image (thumbnail)
   */
  async uploadThumbnail(file: UploadedFile | undefined): Promise<string> {
    if (!file) {
      throw new BadRequestException('Aucune image fournie');
    }

    // Vérifier le type MIME
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Format d'image non supporté. Formats acceptés: JPEG, PNG, WebP, GIF`,
      );
    }

    // Vérifier la taille
    if (file.size > this.MAX_IMAGE_SIZE) {
      throw new BadRequestException(
        `L'image est trop volumineuse. Taille maximale: 5MB`,
      );
    }

    // Générer un nom de fichier unique
    const fileExtension = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExtension}`;
    const filePath = path.join(this.uploadDir, 'thumbnails', fileName);

    try {
      // Sauvegarder le fichier
      await fs.writeFile(filePath, file.buffer);

      // Retourner l'URL relative
      return `/uploads/thumbnails/${fileName}`;
    } catch (error) {
      console.error('Error uploading thumbnail:', error);
      throw new InternalServerErrorException(
        "Erreur lors de l'upload de l'image",
      );
    }
  }

  /**
   * Supprimer un fichier
   */
  async deleteFile(fileUrl: string): Promise<void> {
    if (!fileUrl) return;

    try {
      const filePath = path.join(process.cwd(), fileUrl);
      await fs.unlink(filePath);
    } catch (error) {
      console.error('Error deleting file:', error);
      // Ne pas throw d'erreur si le fichier n'existe pas
    }
  }

  /**
   * Obtenir les informations sur un fichier
   */
  getFileInfo(file: UploadedFile) {
    return {
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      sizeFormatted: this.formatBytes(file.size),
    };
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}
