import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const port = process.env.PORT || 3000;

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // CORS configuration
  app.enableCors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Serve static files from public directory
  app.useStaticAssets(join(__dirname, '..', 'public'), {
    index: 'index.html',
  });

  // API prefix
  app.setGlobalPrefix('api');

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Tourist Safety Monitoring API')
    .setDescription('Smart Tourist Safety Monitoring System API with real-time location tracking, emergency services, and Google Maps integration')
    .setVersion('1.0')
    .addTag('Health', 'Health check endpoints')
    .addTag('Tourist', 'Tourist management endpoints')
    .addTag('Location', 'Location tracking and mapping endpoints')
    .addTag('Emergency', 'Emergency services and alerts endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(port);
  console.log(`🚀 Tourist Safety Backend running on port ${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
  console.log(`🌐 Frontend: http://localhost:${port}`);
}

bootstrap().catch(err => {
  console.error('❌ Error starting the application:', err);
  process.exit(1);
});