import { Module } from '@nestjs/common';

import { ConfigModule } from '@nestjs/config';

import appConfig from './config/app.config';
import authConfig from './config/auth.config';
import databaseConfig from './config/database.config';
import redisConfig from './config/redis.config';
import { envValidationSchema } from './config/env.validation';

import { PrismaModule } from './infrastructure/prisma/prisma.module';

import { HealthModule } from './health/health.module';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { TasksModule } from './modules/tasks/tasks.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,

      load: [appConfig, authConfig, databaseConfig, redisConfig],

      validationSchema: envValidationSchema,
    }),

    PrismaModule,

    HealthModule,

    AuthModule,

    UsersModule,
    ProjectsModule,
    TasksModule,
  ],
})
export class AppModule {}
