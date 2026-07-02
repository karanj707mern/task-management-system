import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { existsSync, mkdirSync } from 'fs';
import { json, urlencoded } from 'express';
import helmet from 'helmet';
import { join } from 'path';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { AppLogger } from './infrastructure/logger/app-logger.service';

import { ResponseInterceptor } from './common/interceptors/response.interceptor';

const uploadsDir = join(process.cwd(), 'uploads', 'avatars');
if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true });
}
const documentsDir = join(process.cwd(), 'uploads', 'documents');
if (!existsSync(documentsDir)) {
  mkdirSync(documentsDir, { recursive: true });
}

function requestLoggerMiddleware(req: any, res: any, next: any) {
  const startTime = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    new AppLogger('Request').log(
      `${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`,
    );
  });
  next();
}

async function bootstrap() {
  const logger = new AppLogger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const allowedOrigins = (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  });
  app.use(requestLoggerMiddleware);

  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
    setHeaders: (res) => {
      res.setHeader('Cache-Control', 'public, max-age=86400');
    },
  });

  app.useGlobalInterceptors(new ResponseInterceptor());

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  logger.log(`Application is Performing on: http://localhost:${port}`);
}
void bootstrap();
