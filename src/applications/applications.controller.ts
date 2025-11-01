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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ApplicationsService } from './applications.service';
import {
  CreateJobPostingDto,
  UpdateJobPostingDto,
} from './dto/create-job-posting.dto';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';

@ApiTags('Job Applications')
@Controller('api/jobs')
export class ApplicationsController {
  constructor(private applicationsService: ApplicationsService) {}

  // ========== ENDPOINTS PUBLICS (Lecture seule) ==========

  @Get()
  @ApiOperation({ summary: 'Obtenir toutes les offres ouvertes' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'jobType', required: false })
  @ApiQuery({ name: 'location', required: false })
  @ApiQuery({ name: 'isRemote', required: false })
  async getAllJobPostings(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('jobType') jobType?: string,
    @Query('location') location?: string,
    @Query('isRemote') isRemote?: boolean,
  ) {
    return await this.applicationsService.getAllJobPostings(
      page,
      limit,
      jobType,
      location,
      isRemote,
    );
  }

  @Get('search')
  @ApiOperation({ summary: 'Rechercher des offres' })
  @ApiQuery({ name: 'q', required: true })
  async searchJobs(@Query('q') query: string) {
    return await this.applicationsService.searchJobs(query);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Obtenir une offre par slug' })
  @ApiParam({ name: 'slug' })
  async getJobBySlug(
    @Param('slug') slug: string,
    @Query('userId') userId?: number,
  ) {
    return await this.applicationsService.getJobBySlug(slug, userId);
  }

  // ========== GESTION DES OFFRES (Authentifié) ==========

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: "Créer une offre d'emploi" })
  async createJobPosting(
    @Req() req,
    @Body() createJobDto: CreateJobPostingDto,
  ) {
    return await this.applicationsService.createJobPosting(
      req.user.id,
      createJobDto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('my/postings')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtenir mes offres postées' })
  async getMyJobPostings(@Req() req) {
    return await this.applicationsService.getMyJobPostings(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Mettre à jour une offre' })
  @ApiParam({ name: 'id' })
  async updateJobPosting(
    @Param('id') id: number,
    @Req() req,
    @Body() updateJobDto: UpdateJobPostingDto,
  ) {
    return await this.applicationsService.updateJobPosting(
      id,
      req.user.id,
      updateJobDto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/publish')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Publier une offre' })
  @ApiParam({ name: 'id' })
  async publishJobPosting(@Param('id') id: number, @Req() req) {
    return await this.applicationsService.publishJobPosting(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/close')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Fermer une offre' })
  @ApiParam({ name: 'id' })
  async closeJobPosting(@Param('id') id: number, @Req() req) {
    return await this.applicationsService.closeJobPosting(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Supprimer une offre' })
  @ApiParam({ name: 'id' })
  async deleteJobPosting(@Param('id') id: number, @Req() req) {
    await this.applicationsService.deleteJobPosting(id, req.user.id);
    return { message: 'Offre supprimée avec succès' };
  }

  // ========== GESTION DES CANDIDATURES ==========

  @UseGuards(JwtAuthGuard)
  @Post(':jobId/apply')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Postuler à une offre' })
  @ApiParam({ name: 'jobId' })
  async applyToJob(
    @Param('jobId') jobId: number,
    @Req() req,
    @Body() createApplicationDto: CreateApplicationDto,
  ) {
    return await this.applicationsService.applyToJob(
      req.user.id,
      jobId,
      createApplicationDto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('my/applications')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtenir mes candidatures' })
  async getMyApplications(@Req() req) {
    return await this.applicationsService.getMyApplications(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':jobId/applications')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: "Obtenir les candidatures d'une offre (recruteur)" })
  @ApiParam({ name: 'jobId' })
  async getJobApplications(@Param('jobId') jobId: number, @Req() req) {
    return await this.applicationsService.getJobApplications(
      jobId,
      req.user.id,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Put('applications/:id/status')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: "Mettre à jour le statut d'une candidature (recruteur)",
  })
  @ApiParam({ name: 'id' })
  async updateApplicationStatus(
    @Param('id') id: number,
    @Req() req,
    @Body() updateStatusDto: UpdateApplicationStatusDto,
  ) {
    return await this.applicationsService.updateApplicationStatus(
      id,
      req.user.id,
      updateStatusDto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('applications/:id/withdraw')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Retirer sa candidature' })
  @ApiParam({ name: 'id' })
  async withdrawApplication(@Param('id') id: number, @Req() req) {
    return await this.applicationsService.withdrawApplication(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':jobId/statistics')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: "Obtenir les statistiques d'une offre (recruteur)" })
  @ApiParam({ name: 'jobId' })
  async getJobStatistics(@Param('jobId') jobId: number, @Req() req) {
    return await this.applicationsService.getJobStatistics(jobId, req.user.id);
  }
}
