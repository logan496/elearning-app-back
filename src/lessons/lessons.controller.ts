import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { LessonsService } from './lessons.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { CreateModuleDto } from './dto/create-module.dto';
import { CreateContentDto } from './dto/create-content.dto';
import { EnrollLessonDto } from './dto/enroll-lesson.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { LessonResponseDto } from './dto/lesson-response.dto';

@ApiTags('Lessons')
@Controller('api/lessons')
export class LessonsController {
  constructor(private lessonsService: LessonsService) {}

  // ========== ENDPOINTS PUBLICS ==========

  @Get()
  @ApiOperation({ summary: 'Obtenir toutes les leçons publiées' })
  @ApiResponse({
    status: 200,
    description: 'Liste des leçons',
    type: [LessonResponseDto],
  })
  async getAllLessons(@Query('userId') userId?: number) {
    return await this.lessonsService.getAllLessons(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir une leçon par ID' })
  @ApiParam({ name: 'id', description: 'ID de la leçon' })
  @ApiResponse({
    status: 200,
    description: 'Détails de la leçon',
    type: LessonResponseDto,
  })
  async getLessonById(
    @Param('id') id: number,
    @Query('userId') userId?: number,
  ) {
    return await this.lessonsService.getLessonById(id, userId);
  }

  // ========== ENDPOINTS AUTHENTIFIÉS ==========

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Créer une nouvelle leçon (instructeur)' })
  @ApiResponse({ status: 201, description: 'Leçon créée' })
  async createLesson(@Req() req, @Body() createLessonDto: CreateLessonDto) {
    return await this.lessonsService.createLesson(req.user.id, createLessonDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my/created')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtenir mes leçons créées' })
  @ApiResponse({ status: 200, description: 'Liste des leçons créées' })
  async getMyLessons(@Req() req) {
    return await this.lessonsService.getMyLessons(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Mettre à jour une leçon' })
  @ApiParam({ name: 'id', description: 'ID de la leçon' })
  @ApiResponse({ status: 200, description: 'Leçon mise à jour' })
  async updateLesson(
    @Param('id') id: number,
    @Req() req,
    @Body() updateLessonDto: UpdateLessonDto,
  ) {
    return await this.lessonsService.updateLesson(
      id,
      req.user.id,
      updateLessonDto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/publish')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Publier une leçon' })
  @ApiParam({ name: 'id', description: 'ID de la leçon' })
  @ApiResponse({ status: 200, description: 'Leçon publiée' })
  async publishLesson(@Param('id') id: number, @Req() req) {
    return await this.lessonsService.publishLesson(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Supprimer une leçon' })
  @ApiParam({ name: 'id', description: 'ID de la leçon' })
  @ApiResponse({ status: 200, description: 'Leçon supprimée' })
  async deleteLesson(@Param('id') id: number, @Req() req) {
    await this.lessonsService.deleteLesson(id, req.user.id);
    return { message: 'Leçon supprimée avec succès' };
  }

  // ========== MODULES ==========

  @UseGuards(JwtAuthGuard)
  @Post(':lessonId/modules')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Ajouter un module à une leçon' })
  @ApiParam({ name: 'lessonId', description: 'ID de la leçon' })
  @ApiResponse({ status: 201, description: 'Module créé' })
  async createModule(
    @Param('lessonId') lessonId: number,
    @Req() req,
    @Body() createModuleDto: CreateModuleDto,
  ) {
    return await this.lessonsService.createModule(
      lessonId,
      req.user.id,
      createModuleDto,
    );
  }

  // ========== CONTENU ==========

  @UseGuards(JwtAuthGuard)
  @Post('modules/:moduleId/contents')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Ajouter du contenu à un module' })
  @ApiParam({ name: 'moduleId', description: 'ID du module' })
  @ApiResponse({ status: 201, description: 'Contenu créé' })
  async createContent(
    @Param('moduleId') moduleId: number,
    @Req() req,
    @Body() createContentDto: CreateContentDto,
  ) {
    return await this.lessonsService.createContent(
      moduleId,
      req.user.id,
      createContentDto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('contents/:contentId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtenir un contenu spécifique' })
  @ApiParam({ name: 'contentId', description: 'ID du contenu' })
  @ApiResponse({ status: 200, description: 'Contenu' })
  async getContent(@Param('contentId') contentId: number, @Req() req) {
    return await this.lessonsService.getContent(contentId, req.user.id);
  }

  // ========== INSCRIPTION ==========

  @UseGuards(JwtAuthGuard)
  @Post('enroll')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: "S'inscrire à une leçon" })
  @ApiResponse({ status: 201, description: 'Inscription réussie' })
  async enrollLesson(@Req() req, @Body() enrollLessonDto: EnrollLessonDto) {
    return await this.lessonsService.enrollLesson(req.user.id, enrollLessonDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my/enrollments')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtenir mes inscriptions' })
  @ApiResponse({ status: 200, description: 'Liste des inscriptions' })
  async getMyEnrollments(@Req() req) {
    return await this.lessonsService.getMyEnrollments(req.user.id);
  }

  // ========== PROGRESSION ==========

  @UseGuards(JwtAuthGuard)
  @Post('progress')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Mettre à jour la progression' })
  @ApiResponse({ status: 200, description: 'Progression mise à jour' })
  async updateProgress(
    @Req() req,
    @Body() updateProgressDto: UpdateProgressDto,
  ) {
    return await this.lessonsService.updateProgress(
      req.user.id,
      updateProgressDto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get(':lessonId/progress')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtenir la progression dans une leçon' })
  @ApiParam({ name: 'lessonId', description: 'ID de la leçon' })
  @ApiResponse({ status: 200, description: 'Progression' })
  async getLessonProgress(@Param('lessonId') lessonId: number, @Req() req) {
    return await this.lessonsService.getLessonProgress(req.user.id, lessonId);
  }
}
