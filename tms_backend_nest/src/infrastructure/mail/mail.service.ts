import { Injectable } from '@nestjs/common';
import { AppLogger } from '../logger/app-logger.service';
import { MailerService } from '@nestjs-modules/mailer';

/**
 * Email service for sending emails
 * Currently logs to console - integrate with SMTP provider
 */
@Injectable()
export class MailService {
  constructor(
    private readonly logger: AppLogger,
    private readonly mailerService: MailerService,
  ) {}

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Welcome to Task Management System',
      text: `Hello ${name}, welcome to our Task Management System!`,
    });
    this.logger.log(`Sending welcome email to ${email}`);
  }

  async sendTaskAssignmentEmail(
    email: string,
    taskTitle: string,
  ): Promise<void> {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Task Assignment',
      text: `You have been assigned a new task: ${taskTitle}`,
    });
    this.logger.log(`Sending task assignment email to ${email}`);
  }
  async sendPasswordResetEmail(
    email: string,
    resetLink: string,
  ): Promise<void> {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Password Reset',
      text: `Click the following link to reset your password: ${resetLink}`,
    });
    this.logger.log(`Sending password reset email to ${email}`);
  }

  async sendNotificationEmail(
    email: string,
    title: string,
    content: string,
  ): Promise<void> {
    await this.mailerService.sendMail({
      to: email,
      subject: title,
      text: content,
    });
    this.logger.log(`Sending notification email to ${email}`);
  }
}
