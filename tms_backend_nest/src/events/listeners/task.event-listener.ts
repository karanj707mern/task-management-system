import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AppLogger } from '../../infrastructure/logger/app-logger.service';
import { EmailService } from '../../infrastructure/mail/mail.service';
import * as payloads from '../payloads/event.payloads';

@Injectable()
export class TaskEventListener {
  constructor(
    private logger: AppLogger,
    private emailService: EmailService,
  ) {}

  @OnEvent('task.created')
  handleTaskCreated(payload: payloads.TaskCreatedPayload) {
    this.logger.log(`Task created: ${payload.title}`, 'TaskEventListener');
    if (payload.assigneeEmail) {
      void this.emailService
        .sendTaskAssignmentEmail(
          payload.assigneeEmail,
          payload.title,
          payload.projectName,
        )
        .catch((error) => {
          this.logger.error(
            `Failed to send task assignment email: ${error instanceof Error ? error.message : String(error)}`,
            'TaskEventListener',
          );
        });
    }
  }

  @OnEvent('task.updated')
  handleTaskUpdated(payload: payloads.TaskUpdatedPayload) {
    this.logger.log(`Task updated: ${payload.id}`, 'TaskEventListener');
  }

  @OnEvent('task.status.changed')
  handleTaskStatusChanged(payload: payloads.TaskStatusChangedPayload) {
    this.logger.log(
      `Task status changed: ${payload.title} - ${payload.oldStatus} → ${payload.newStatus}`,
      'TaskEventListener',
    );
    if (payload.assigneeEmail) {
      void this.emailService
        .sendTaskStatusChangeEmail(
          payload.assigneeEmail,
          payload.title,
          payload.oldStatus,
          payload.newStatus,
        )
        .catch((error) => {
          this.logger.error(
            `Failed to send task status change email: ${error instanceof Error ? error.message : String(error)}`,
            'TaskEventListener',
          );
        });
    }
  }
}