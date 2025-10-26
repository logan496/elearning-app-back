// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe());
  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('EduLearn API')
    .setDescription('API pour la plateforme EduLearn')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Exposer la documentation
  SwaggerModule.setup('api/docs', app, document);

  // CORRECTION : Sauvegarder le JSON OpenAPI uniquement en développement
  if (process.env.NODE_ENV === 'development') {
    try {
      fs.writeFileSync(
        './swagger-spec.json',
        JSON.stringify(document, null, 2),
      );
      console.log('💾 JSON file saved: ./swagger-spec.json');
    } catch (error) {
      console.log('⚠️ Cannot write swagger file, skipping...', error);
    }
  }

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 Server: http://localhost:${port}`);
  console.log(`📚 Swagger UI: http://localhost:${port}/api/docs`);
  console.log(`📄 OpenAPI JSON: http://localhost:${port}/api/docs-json`);
}
bootstrap();
