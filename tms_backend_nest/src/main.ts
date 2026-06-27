import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { AppLogger } from './infrastructure/logger/app-logger.service';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { NestExpressApplication } from '@nestjs/platform-express';

import { ResponseInterceptor } from './common/interceptors/response.interceptor';

const uploadsDir = join(process.cwd(), 'uploads', 'avatars');
if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true });
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

  app.use(helmet());
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
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

  const port = process.env.PORT ?? 5000;
  await app.listen(port);
  logger.log(`Application is Performing on: http://localhost:${port}`);
}
void bootstrap();
