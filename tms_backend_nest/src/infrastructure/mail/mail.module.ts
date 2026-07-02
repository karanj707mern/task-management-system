import { join } from 'path';
import { MailerModule, MailerService } from '@nestjs-modules/mailer';
import { BullModule, type Processor, type WorkerHost } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/adapters/handlebars.adapter';
import type { Job } from 'bullmq';
import { AppLogger } from '../../infrastructure/logger/app-logger.service';
import { LoggerModule } from '../../infrastructure/logger/logger.module';
import * as jobDefs from '../../queues/jobs/job-definitions';
import { EmailService } from './mail.service';

class EmailProcessor {
  constructor(
    private logger: AppLogger,
    private mailerService: MailerService,
  ) {}

  async process(
    job: Job<jobDefs.SendEmailJobData>,
  ): Promise<{ success: boolean }> {
    this.logger.log(`Processing email job: ${job.id} for ${job.data.to}`);

    const emailOptions: Record<string, unknown> = {
      to: job.data.to,
      subject: job.data.subject,
    };

    if (job.data.template) {
      emailOptions.template = job.data.template;
      emailOptions.context = job.data.context;
    } else if (job.data.context?.html) {
      emailOptions.html = job.data.context.html as string;
    }

    try {
      await this.mailerService.sendMail(emailOptions);
      this.logger.log(`Email sent successfully to ${job.data.to}`);
      return { success: true };
    } catch (error) {
      this.logger.error(
        `Error processing email job: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw error;
    }
  }
}

@Global()
@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    BullModule.registerQueue({
      name: 'email',
    }),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        transport: {
          host: config.getOrThrow('mail.host'),
          port: config.getOrThrow('mail.port'),
          auth: {
            user: config.getOrThrow('mail.user'),
            pass: config.getOrThrow('mail.password'),
          },
        },
        defaults: {
          from: config.getOrThrow('mail.from'),
        },
        template: {
          dir: process.env.NODE_ENV === 'production'
            ? join(process.cwd(), 'templates', 'emails')
            : join(process.cwd(), 'templates', 'emails'),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
    }),
  ],
  providers: [EmailService, EmailProcessor],
  exports: [EmailService, MailerModule],
})
export class EmailModule {}