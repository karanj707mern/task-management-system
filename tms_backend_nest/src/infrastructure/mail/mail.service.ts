import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { AppLogger } from '@/infrastructure/logger/app-logger.service';
import * as jobDefs from '@/queues/jobs/job-definitions';
import { EmailTemplates } from '@/shared/templates/email.templates';

@Injectable()
export class EmailService {
  constructor(
    private readonly logger: AppLogger,
    @InjectQueue('email') private emailQueue: Queue<jobDefs.SendEmailJobData>,
  ) {}

  private async enqueueEmail(data: jobDefs.SendEmailJobData) {
    return this.emailQueue.add('send-email', data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: true,
    });
  }

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    this.logger.log(`Queueing welcome email to ${email}`);
    await this.enqueueEmail({
      to: email,
      subject: 'Welcome to Task Management System',
      template: 'welcome',
      context: {
        name,
        html: EmailTemplates.welcomeEmail(name),
      },
    });
  }

  async sendTaskAssignmentEmail(
    email: string,
    taskTitle: string,
    projectName?: string,
  ): Promise<void> {
    this.logger.log(`Queueing task assignment email to ${email}`);
    await this.enqueueEmail({
      to: email,
      subject: 'Task Assignment',
      template: 'task-assigned',
      context: {
        name: email.split('@')[0],
        taskTitle,
        projectName: projectName || 'Unknown Project',
        html: EmailTemplates.taskAssigned(
          email.split('@')[0],
          taskTitle,
          projectName || 'Unknown Project',
        ),
      },
    });
  }

  async sendTaskStatusChangeEmail(
    email: string,
    taskTitle: string,
    oldStatus: string,
    newStatus: string,
  ): Promise<void> {
    this.logger.log(`Queueing task status change email to ${email}`);
    await this.enqueueEmail({
      to: email,
      subject: 'Task Status Updated',
      template: 'task-status-changed',
      context: {
        name: email.split('@')[0],
        taskTitle,
        oldStatus,
        newStatus,
        html: EmailTemplates.taskStatusChanged(
          email.split('@')[0],
          taskTitle,
          oldStatus,
          newStatus,
        ),
      },
    });
  }

  async sendPasswordResetEmail(
    email: string,
    resetLink: string,
  ): Promise<void> {
    this.logger.log(`Queueing password reset email to ${email}`);
    await this.enqueueEmail({
      to: email,
      subject: 'Password Reset',
      template: 'password-reset',
      context: {
        resetLink,
        html: `Click the following link to reset your password: ${resetLink}`,
      },
    });
  }

  async sendNotificationEmail(
    email: string,
    title: string,
    content: string,
  ): Promise<void> {
    this.logger.log(`Queueing notification email to ${email}`);
    await this.enqueueEmail({
      to: email,
      subject: title,
      template: 'notification',
      context: {
        title,
        content,
        html: content,
      },
    });
  }
}