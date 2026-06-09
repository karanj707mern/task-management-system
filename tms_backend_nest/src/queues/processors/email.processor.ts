import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { AppLogger } from '../../infrastructure/logger/app-logger.service';
import { MailService } from '../../infrastructure/mail/mail.service';
import * as jobDefs from '../jobs/job-definitions';

@Processor('email')
export class EmailProcessor extends WorkerHost {
  constructor(
    private logger: AppLogger,
    private mailService: MailService,
  ) {
    super();
  }

  async process(
    job: Job<jobDefs.SendEmailJobData>,
  ): Promise<{ success: boolean }> {
    this.logger.log(`Processing email job: ${job.id} for ${job.data.to}`);

    try {
      await this.mailService.sendMail({
        to: job.data.to,
        subject: job.data.subject,
        template: job.data.template,
        context: job.data.context,
      });

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
