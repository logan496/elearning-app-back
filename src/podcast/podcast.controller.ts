import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  BadRequestException,
  UseInterceptors,
  UploadedFiles,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PodcastService } from './podcast.service';
import { CreatePodcastDto, UpdatePodcastDto } from './dto/create-podcast.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';

@ApiTags('Podcasts')
@Controller('api/podcasts')
export class PodcastController {
  constructor(private podcastService: PodcastService) {}

  @Get()
  @ApiOperation({ summary: 'Obtenir tous les podcasts publiés' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'type', required: false, description: 'audio ou video' })
  @ApiQuery({ name: 'category', required: false })
  async getAllPodcasts(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('type') type?: string,
    @Query('category') category?: string,
  ) {
    return await this.podcastService.getAllPodcasts(
      page,
      limit,
      type,
      category,
    );
  }

  @Get('search')
  @ApiOperation({ summary: 'Rechercher des podcasts' })
  @ApiQuery({ name: 'q', required: true })
  async searchPodcasts(@Query('q') query: string) {
    return await this.podcastService.searchPodcasts(query);
  }

  @Get('my-podcasts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtenir mes podcasts' })
  async getMyPodcasts(@Req() req) {
    return await this.podcastService.getMyPodcasts(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir un podcast par ID' })
  @ApiParam({ name: 'id' })
  async getPodcastById(@Param('id', ParseIntPipe) id: number) {
    return await this.podcastService.getPodcastById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Créer un podcast avec upload de fichiers' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['title', 'description', 'type', 'duration', 'mediaFile'],
      properties: {
        title: { type: 'string', example: 'Episode 1' },
        description: { type: 'string', example: 'Description...' },
        type: { type: 'string', enum: ['audio', 'video'], example: 'audio' },
        duration: { type: 'number', example: 1800 },
        category: { type: 'string', example: 'Technology' },
        tags: {
          type: 'string',
          example: 'tech,startup',
          description: 'Séparés par des virgules',
        },
        autoShareOnPublish: { type: 'boolean', example: true },
        mediaFile: {
          type: 'string',
          format: 'binary',
          description: 'Fichier audio (max 20MB) ou vidéo (max 50MB)',
        },
        thumbnailFile: {
          type: 'string',
          format: 'binary',
          description: 'Image miniature (optionnel, max 5MB)',
        },
      },
    },
  })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'mediaFile', maxCount: 1 },
      { name: 'thumbnailFile', maxCount: 1 },
    ]),
  )
  async createPodcast(
    @Req() req,
    @Body() createPodcastDto: CreatePodcastDto,
    @UploadedFiles()
    files: {
      mediaFile?: Express.Multer.File[];
      thumbnailFile?: Express.Multer.File[];
    },
  ) {
    if (!files.mediaFile || files.mediaFile.length === 0) {
      throw new BadRequestException('Le fichier média est requis');
    }

    return await this.podcastService.createPodcast(
      req.user.id,
      createPodcastDto,
      files.mediaFile[0],
      files.thumbnailFile?.[0],
    );
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Mettre à jour un podcast' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        type: { type: 'string', enum: ['audio', 'video'] },
        duration: { type: 'number' },
        category: { type: 'string' },
        tags: { type: 'string', description: 'Séparés par des virgules' },
        autoShareOnPublish: { type: 'boolean' },
        mediaFile: { type: 'string', format: 'binary' },
        thumbnailFile: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'mediaFile', maxCount: 1 },
      { name: 'thumbnailFile', maxCount: 1 },
    ]),
  )
  async updatePodcast(
    @Param('id', ParseIntPipe) id: number,
    @Req() req,
    @Body() updatePodcastDto: UpdatePodcastDto,
    @UploadedFiles()
    files: {
      mediaFile?: Express.Multer.File[];
      thumbnailFile?: Express.Multer.File[];
    },
  ) {
    return await this.podcastService.updatePodcast(
      id,
      req.user.id,
      updatePodcastDto,
      files.mediaFile?.[0],
      files.thumbnailFile?.[0],
    );
  }

  @Post(':id/publish')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Publier un podcast' })
  @ApiParam({ name: 'id' })
  async publishPodcast(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return await this.podcastService.publishPodcast(id, req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Supprimer un podcast' })
  @ApiParam({ name: 'id' })
  async deletePodcast(@Param('id', ParseIntPipe) id: number, @Req() req) {
    await this.podcastService.deletePodcast(id, req.user.id);
    return { message: 'Podcast supprimé avec succès' };
  }

  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Liker/Unliker un podcast' })
  @ApiParam({ name: 'id' })
  async toggleLike(@Param('id', ParseIntPipe) id: number) {
    return await this.podcastService.toggleLike(id);
  }
}
