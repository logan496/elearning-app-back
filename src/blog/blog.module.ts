import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { BlogController } from './blog.controller';
import { BlogService } from './blog.service';
import { BlogPost } from '../entities/blog-post.entity';
import { BlogComment } from '../entities/blog-comment.entity';
import { BlogLike } from '../entities/blog-like.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([BlogPost, BlogComment, BlogLike]),
    JwtModule,
    ConfigModule,
  ],
  controllers: [BlogController],
  providers: [BlogService],
  exports: [BlogService],
})
export class BlogModule {}