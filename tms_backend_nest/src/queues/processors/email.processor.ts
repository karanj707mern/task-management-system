import { Processor, Process } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { AppLogger } from '../../infrastructure/logger/app-logger.service';
import { MailService } from '../../infrastructure/mail/mail.service';
import * as jobDefs from '../jobs/job-definitions';

/**
 * Email job processor
 */
@Processor('email')
export class EmailProcessor {
  constructor(
    private logger: AppLogger,
    private mailService: MailService,
  ) {}

  @Process('send-email')
  async processSendEmail(job: Job<jobDefs.SendEmailJobData>) {
    this.logger.log(`Processing email job: ${job.id} for ${job.data.to}`);

    try {
      // TODO: Implement actual email sending logic
      // await this.mailService.send(job.data);
      this.logger.log(`Email sent successfully to ${job.data.to}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Error processing email job: ${error.message}`);
      throw error;
    }
  }
}
