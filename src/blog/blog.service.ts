import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlogPost, BlogStatus } from '../entities/blog-post.entity';
import { BlogComment } from '../entities/blog-comment.entity';
import { BlogLike } from '../entities/blog-like.entity';
import { CreatePostDto, UpdatePostDto } from './dto/create-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class BlogService {
  constructor(
    @InjectRepository(BlogPost)
    private postRepository: Repository<BlogPost>,
    @InjectRepository(BlogComment)
    private commentRepository: Repository<BlogComment>,
    @InjectRepository(BlogLike)
    private likeRepository: Repository<BlogLike>,
  ) {}

  // ========== GESTION DES POSTS ==========

  async createPost(
    authorId: number,
    createPostDto: CreatePostDto,
  ): Promise<BlogPost> {
    const slug = this.generateSlug(createPostDto.title);

    const post = this.postRepository.create({
      ...createPostDto,
      authorId,
      slug,
    });

    return await this.postRepository.save(post);
  }

  async getAllPosts(
    page: number = 1,
    limit: number = 10,
    category?: string,
    tag?: string,
  ): Promise<{ posts: BlogPost[]; total: number; pages: number }> {
    const query = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .where('post.status = :status', { status: BlogStatus.PUBLISHED })
      .orderBy('post.publishedAt', 'DESC');

    if (category) {
      query.andWhere('post.category = :category', { category });
    }

    if (tag) {
      query.andWhere('post.tags LIKE :tag', { tag: `%${tag}%` });
    }

    const total = await query.getCount();
    const posts = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      posts,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  async getPostBySlug(slug: string, userId?: number): Promise<BlogPost> {
    const post = await this.postRepository.findOne({
      where: { slug, status: BlogStatus.PUBLISHED },
      relations: ['author', 'comments', 'comments.user'],
    });

    if (!post) {
      throw new NotFoundException('Article introuvable');
    }

    // Incrémenter le compteur de vues
    post.viewCount += 1;
    await this.postRepository.save(post);

    // Vérifier si l'utilisateur a liké
    if (userId) {
      const like = await this.likeRepository.findOne({
        where: { userId, postId: post.id },
      });
      (post as any).isLikedByUser = !!like;
    }

    return post;
  }

  async getMyPosts(authorId: number): Promise<BlogPost[]> {
    return await this.postRepository.find({
      where: { authorId },
      relations: ['comments'],
      order: { createdAt: 'DESC' },
    });
  }

  async updatePost(
    postId: number,
    authorId: number,
    updatePostDto: UpdatePostDto,
  ): Promise<BlogPost> {
    const post = await this.postRepository.findOne({ where: { id: postId } });

    if (!post) {
      throw new NotFoundException('Article introuvable');
    }

    if (post.authorId !== authorId) {
      throw new ForbiddenException('Vous ne pouvez pas modifier cet article');
    }

    // Mettre à jour le slug si le titre change
    if (updatePostDto.title && updatePostDto.title !== post.title) {
      updatePostDto['slug'] = this.generateSlug(updatePostDto.title);
    }

    Object.assign(post, updatePostDto);
    return await this.postRepository.save(post);
  }

  async publishPost(postId: number, authorId: number): Promise<BlogPost> {
    const post = await this.postRepository.findOne({ where: { id: postId } });

    if (!post) {
      throw new NotFoundException('Article introuvable');
    }

    if (post.authorId !== authorId) {
      throw new ForbiddenException('Vous ne pouvez pas publier cet article');
    }

    post.status = BlogStatus.PUBLISHED;
    post.publishedAt = new Date();

    return await this.postRepository.save(post);
  }

  async deletePost(postId: number, authorId: number): Promise<void> {
    const post = await this.postRepository.findOne({ where: { id: postId } });

    if (!post) {
      throw new NotFoundException('Article introuvable');
    }

    if (post.authorId !== authorId) {
      throw new ForbiddenException('Vous ne pouvez pas supprimer cet article');
    }

    await this.postRepository.remove(post);
  }

  // ========== GESTION DES COMMENTAIRES ==========

  async addComment(
    postId: number,
    userId: number,
    createCommentDto: CreateCommentDto,
  ): Promise<BlogComment> {
    const post = await this.postRepository.findOne({ where: { id: postId } });

    if (!post) {
      throw new NotFoundException('Article introuvable');
    }

    if (!post.commentsEnabled) {
      throw new BadRequestException('Les commentaires sont désactivés');
    }

    const comment = this.commentRepository.create({
      ...createCommentDto,
      postId,
      userId,
    });

    await this.commentRepository.save(comment);

    // Incrémenter le compteur de commentaires
    post.commentCount += 1;
    await this.postRepository.save(post);

    return comment;
  }

  async updateComment(
    commentId: number,
    userId: number,
    content: string,
  ): Promise<BlogComment> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Commentaire introuvable');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException(
        'Vous ne pouvez pas modifier ce commentaire',
      );
    }

    comment.content = content;
    comment.isEdited = true;

    return await this.commentRepository.save(comment);
  }

  async deleteComment(commentId: number, userId: number): Promise<void> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
      relations: ['post'],
    });

    if (!comment) {
      throw new NotFoundException('Commentaire introuvable');
    }

    // L'utilisateur peut supprimer son propre commentaire OU l'auteur du post
    if (comment.userId !== userId && comment.post.authorId !== userId) {
      throw new ForbiddenException(
        'Vous ne pouvez pas supprimer ce commentaire',
      );
    }

    await this.commentRepository.remove(comment);

    // Décrémenter le compteur
    const post = await this.postRepository.findOne({
      where: { id: comment.postId },
    });
    if (post) {
      post.commentCount = Math.max(0, post.commentCount - 1);
      await this.postRepository.save(post);
    }
  }

  // ========== GESTION DES LIKES ==========

  async toggleLike(
    postId: number,
    userId: number,
  ): Promise<{ liked: boolean }> {
    const post = await this.postRepository.findOne({ where: { id: postId } });

    if (!post) {
      throw new NotFoundException('Article introuvable');
    }

    const existingLike = await this.likeRepository.findOne({
      where: { postId, userId },
    });

    if (existingLike) {
      // Unlike
      await this.likeRepository.remove(existingLike);
      post.likeCount = Math.max(0, post.likeCount - 1);
      await this.postRepository.save(post);
      return { liked: false };
    } else {
      // Like
      const like = this.likeRepository.create({ postId, userId });
      await this.likeRepository.save(like);
      post.likeCount += 1;
      await this.postRepository.save(post);
      return { liked: true };
    }
  }

  // ========== UTILITAIRES ==========

  private generateSlug(title: string): string {
    return (
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') +
      '-' +
      Date.now()
    );
  }

  async getPopularPosts(limit: number = 5): Promise<BlogPost[]> {
    return await this.postRepository.find({
      where: { status: BlogStatus.PUBLISHED },
      order: { viewCount: 'DESC', likeCount: 'DESC' },
      take: limit,
      relations: ['author'],
    });
  }

  async getPostsByCategory(category: string): Promise<BlogPost[]> {
    return await this.postRepository.find({
      where: { category: category as any, status: BlogStatus.PUBLISHED },
      order: { publishedAt: 'DESC' },
      relations: ['author'],
    });
  }

  async searchPosts(query: string): Promise<BlogPost[]> {
    return await this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .where('post.status = :status', { status: BlogStatus.PUBLISHED })
      .andWhere(
        '(post.title LIKE :query OR post.excerpt LIKE :query OR post.content LIKE :query)',
        { query: `%${query}%` },
      )
      .orderBy('post.publishedAt', 'DESC')
      .getMany();
  }
}
