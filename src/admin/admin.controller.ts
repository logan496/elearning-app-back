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
import { AdminGuard } from '../guards/admin.guard';
import { AdminService } from './admin.service';
import {
  UpdateUserRoleDto,
  UpdatePublisherStatusDto,
} from './dto/update-user-role.dto';
import { ApproveApplicationDto } from './dto/approve-application.dto';

@ApiTags('Admin')
@Controller('api/admin')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth('JWT-auth')
export class AdminController {
  constructor(private adminService: AdminService) {}

  // ========== STATISTIQUES ==========

  @Get('dashboard')
  @ApiOperation({ summary: 'Obtenir les statistiques du dashboard' })
  async getDashboardStats() {
    return await this.adminService.getDashboardStats();
  }

  // ========== GESTION DES UTILISATEURS ==========

  @Get('users')
  @ApiOperation({ summary: 'Obtenir tous les utilisateurs' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getAllUsers(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return await this.adminService.getAllUsers(page, limit);
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Obtenir un utilisateur par ID' })
  @ApiParam({ name: 'id' })
  async getUserById(@Param('id') id: number) {
    return await this.adminService.getUserById(id);
  }

  @Put('users/:id/admin')
  @ApiOperation({ summary: 'Promouvoir/Rétrograder un utilisateur admin' })
  @ApiParam({ name: 'id' })
  async makeUserAdmin(
    @Param('id') id: number,
    @Req() req,
    @Body() updateRoleDto: UpdateUserRoleDto,
  ) {
    return await this.adminService.makeUserAdmin(
      req.user.id,
      id,
      updateRoleDto,
    );
  }

  @Put('users/:id/publisher')
  @ApiOperation({ summary: 'Activer/Désactiver le statut publisher' })
  @ApiParam({ name: 'id' })
  async updatePublisherStatus(
    @Param('id') id: number,
    @Body() updateStatusDto: UpdatePublisherStatusDto,
  ) {
    return await this.adminService.updatePublisherStatus(id, updateStatusDto);
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Supprimer un utilisateur' })
  @ApiParam({ name: 'id' })
  async deleteUser(@Param('id') id: number) {
    await this.adminService.deleteUser(id);
    return { message: 'Utilisateur supprimé avec succès' };
  }

  // ========== GESTION DES CANDIDATURES ==========

  @Get('applications')
  @ApiOperation({ summary: 'Obtenir toutes les candidatures' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false })
  async getAllApplications(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    return await this.adminService.getAllApplications(page, limit, status);
  }

  @Put('applications/:id/approve')
  @ApiOperation({ summary: 'Approuver/Modifier le statut d\'une candidature' })
  @ApiParam({ name: 'id' })
  async approveApplication(
    @Param('id') id: number,
    @Req() req,
    @Body() approveDto: ApproveApplicationDto,
  ) {
    return await this.adminService.approveApplication(
      id,
      req.user.id,
      approveDto,
    );
  }

  // ========== GESTION DES LEÇONS ==========

  @Get('lessons')
  @ApiOperation({ summary: 'Obtenir toutes les leçons' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getAllLessons(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return await this.adminService.getAllLessons(page, limit);
  }

  @Delete('lessons/:id')
  @ApiOperation({ summary: 'Supprimer une leçon' })
  @ApiParam({ name: 'id' })
  async deleteLesson(@Param('id') id: number) {
    await this.adminService.deleteLesson(id);
    return { message: 'Leçon supprimée avec succès' };
  }

  // ========== GESTION DES ARTICLES ==========

  @Get('blog-posts')
  @ApiOperation({ summary: 'Obtenir tous les articles de blog' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getAllBlogPosts(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return await this.adminService.getAllBlogPosts(page, limit);
  }

  @Delete('blog-posts/:id')
  @ApiOperation({ summary: 'Supprimer un article de blog' })
  @ApiParam({ name: 'id' })
  async deleteBlogPost(@Param('id') id: number) {
    await this.adminService.deleteBlogPost(id);
    return { message: 'Article supprimé avec succès' };
  }
}