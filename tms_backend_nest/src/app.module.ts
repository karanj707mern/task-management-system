import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import appConfig from './config/app.config';
import authConfig from './config/auth.config';
import databaseConfig from './config/database.config';
import redisConfig from './config/redis.config';
import mailConfig from './config/mail.config';
import rabbitmqConfig from './config/rabbitmq.config';
import { envValidationSchema } from './config/env.validation';
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { FileUploadModule } from './infrastructure/file-upload/file-upload.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { CommentsModule } from './modules/comments/comments.module';
import { TeamsModule } from './modules/teams/teams.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ActivityModule } from './modules/activity/activity.module';
import { EpicsModule } from './modules/epics/epics.module';
import { SprintsModule } from './modules/sprints/sprints.module';
import { BranchesModule } from './modules/branches/branches.module';
import { CommitsModule } from './modules/commits/commits.module';
import { CodeReviewsModule } from './modules/code-reviews/code-reviews.module';
import { PrModule } from './modules/pull-requests/pr.module';
import { AttachmentsModule } from './modules/attachments/attachments.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { SearchModule } from './modules/search/search.module';
import { RequestAccessModule } from './modules/request-access/request-access.module';
import { GitHubIntegrationModule } from './modules/integrations/github/github.module';
import { EventsModule } from './events/events.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, authConfig, databaseConfig, redisConfig, mailConfig, rabbitmqConfig],
      validationSchema: envValidationSchema,
    }),
    PrismaModule,
    FileUploadModule,
    HealthModule,
    AuthModule,
    UsersModule,
    ProjectsModule,
    TasksModule,
    CommentsModule,
    TeamsModule,
    NotificationsModule,
    ActivityModule,
    EpicsModule,
    SprintsModule,
    BranchesModule,
    CommitsModule,
    CodeReviewsModule,
    PrModule,
    AttachmentsModule,
    DashboardModule,
    SearchModule,
    RequestAccessModule,
    GitHubIntegrationModule,
    EventsModule,
  ],
})
export class AppModule {}
