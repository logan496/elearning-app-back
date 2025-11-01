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
import { BlogService } from './blog.service';
import { CreatePostDto, UpdatePostDto } from './dto/create-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';

@ApiTags('Blog')
@Controller('api/blog')
export class BlogController {
  constructor(private blogService: BlogService) {}

  // ========== ENDPOINTS PUBLICS (Lecture seule) ==========

  @Get('posts')
  @ApiOperation({ summary: 'Obtenir tous les articles publiés' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'tag', required: false })
  async getAllPosts(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('category') category?: string,
    @Query('tag') tag?: string,
  ) {
    return await this.blogService.getAllPosts(page, limit, category, tag);
  }

  @Get('posts/popular')
  @ApiOperation({ summary: 'Obtenir les articles populaires' })
  async getPopularPosts(@Query('limit') limit?: number) {
    return await this.blogService.getPopularPosts(limit);
  }

  @Get('posts/search')
  @ApiOperation({ summary: 'Rechercher des articles' })
  @ApiQuery({ name: 'q', required: true })
  async searchPosts(@Query('q') query: string) {
    return await this.blogService.searchPosts(query);
  }

  @Get('posts/category/:category')
  @ApiOperation({ summary: 'Obtenir les articles par catégorie' })
  @ApiParam({ name: 'category' })
  async getPostsByCategory(@Param('category') category: string) {
    return await this.blogService.getPostsByCategory(category);
  }

  @Get('posts/:slug')
  @ApiOperation({ summary: 'Obtenir un article par slug' })
  @ApiParam({ name: 'slug' })
  async getPostBySlug(
    @Param('slug') slug: string,
    @Query('userId') userId?: number,
  ) {
    return await this.blogService.getPostBySlug(slug, userId);
  }

  // ========== ENDPOINTS AUTHENTIFIÉS ==========

  @UseGuards(JwtAuthGuard)
  @Post('posts')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Créer un article' })
  async createPost(@Req() req, @Body() createPostDto: CreatePostDto) {
    return await this.blogService.createPost(req.user.id, createPostDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my/posts')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtenir mes articles' })
  async getMyPosts(@Req() req) {
    return await this.blogService.getMyPosts(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Put('posts/:id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Mettre à jour un article' })
  @ApiParam({ name: 'id' })
  async updatePost(
    @Param('id') id: number,
    @Req() req,
    @Body() updatePostDto: UpdatePostDto,
  ) {
    return await this.blogService.updatePost(id, req.user.id, updatePostDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('posts/:id/publish')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Publier un article' })
  @ApiParam({ name: 'id' })
  async publishPost(@Param('id') id: number, @Req() req) {
    return await this.blogService.publishPost(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('posts/:id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Supprimer un article' })
  @ApiParam({ name: 'id' })
  async deletePost(@Param('id') id: number, @Req() req) {
    await this.blogService.deletePost(id, req.user.id);
    return { message: 'Article supprimé avec succès' };
  }

  // ========== COMMENTAIRES ==========

  @UseGuards(JwtAuthGuard)
  @Post('posts/:postId/comments')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Ajouter un commentaire' })
  @ApiParam({ name: 'postId' })
  async addComment(
    @Param('postId') postId: number,
    @Req() req,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    return await this.blogService.addComment(
      postId,
      req.user.id,
      createCommentDto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Put('comments/:id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Modifier un commentaire' })
  @ApiParam({ name: 'id' })
  async updateComment(
    @Param('id') id: number,
    @Req() req,
    @Body('content') content: string,
  ) {
    return await this.blogService.updateComment(id, req.user.id, content);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('comments/:id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Supprimer un commentaire' })
  @ApiParam({ name: 'id' })
  async deleteComment(@Param('id') id: number, @Req() req) {
    await this.blogService.deleteComment(id, req.user.id);
    return { message: 'Commentaire supprimé avec succès' };
  }

  // ========== LIKES ==========

  @UseGuards(JwtAuthGuard)
  @Post('posts/:postId/like')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Liker/Unliker un article' })
  @ApiParam({ name: 'postId' })
  async toggleLike(@Param('postId') postId: number, @Req() req) {
    return await this.blogService.toggleLike(postId, req.user.id);
  }
}