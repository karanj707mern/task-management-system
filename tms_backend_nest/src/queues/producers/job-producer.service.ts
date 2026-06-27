import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import * as jobDefs from '../jobs/job-definitions';

@Injectable()
export class JobProducerService {
  constructor(
    @InjectQueue('email') private emailQueue: Queue,
    @InjectQueue('notification') private notificationQueue: Queue,
    @InjectQueue('report') private reportQueue: Queue,
  ) {}

  async enqueueEmailJob(data: jobDefs.SendEmailJobData) {
    return this.emailQueue.add('send-email', data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: true,
    });
  }

  async enqueueTaskNotificationJob(
    data: jobDefs.ProcessTaskNotificationJobData,
  ) {
    return this.notificationQueue.add('task-notification', data, {
      attempts: 3,
      removeOnComplete: true,
    });
  }

  async enqueueGenerateReportJob(data: jobDefs.GenerateReportJobData) {
    return this.reportQueue.add('generate-report', data, {
      attempts: 2,
      removeOnComplete: true,
    });
  }
}
