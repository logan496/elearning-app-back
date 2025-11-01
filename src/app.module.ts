// src/app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from './auth/auth.modules';
import { ChatModule } from './chat/chat.module';
import { PodcastModule } from './podcast/podcast.module';
import { UsersModule } from './users/users.module';
import { LessonsModule } from './lessons/lessons.module';
import { BlogModule } from './blog/blog.module';
import { ApplicationsModule } from './applications/applications.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get('NODE_ENV') === 'development',
        logging: configService.get('NODE_ENV') === 'development',

        // CORRECTION DE LA CONFIGURATION SSL
        ssl: true, // ← Ajouter cette ligne
        extra: {
          ssl: {
            rejectUnauthorized: false, // ← Déplacer cette ligne dans 'extra'
          },
        },
      }),
    }),
    // TypeOrmModule.forRootAsync({
    //   imports: [ConfigModule],
    //   inject: [ConfigService],
    //   useFactory: (configService: ConfigService) => {
    //     const isProduction = configService.get('NODE_ENV') === 'production';
    //
    //     return {
    //       type: 'postgres',
    //       host: configService.get('DB_HOST'),
    //       port: configService.get('DB_PORT'),
    //       username: configService.get('DB_USERNAME'),
    //       password: configService.get('DB_PASSWORD'),
    //       database: configService.get('DB_NAME'),
    //       entities: [__dirname + '/**/*.entity{.ts,.js}'],
    //       synchronize: !isProduction,
    //       logging: !isProduction,
    //       ssl: isProduction,
    //       ...(isProduction && {
    //         extra: {
    //           ssl: {
    //             rejectUnauthorized: false,
    //           },
    //         },
    //       }),
    //     };
    //   },
    // }),
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');

        if (!secret) {
          throw new Error('JWT_SECRET is not defined in environment variables');
        }

        return {
          secret,
          signOptions: {
            expiresIn: configService.get('JWT_EXPIRES_IN') ?? '30d',
          },
        };
      },
    }),
    AuthModule,
    ChatModule,
    PodcastModule,
    UsersModule,
    LessonsModule,
    BlogModule,
    ApplicationsModule,
    AdminModule,
  ],
})
export class AppModule {}
