import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AppLogger } from '../../infrastructure/logger/app-logger.service';
import * as payloads from '../payloads/event.payloads';

/**
 * Task event listeners
 */
@Injectable()
export class TaskEventListener {
  constructor(private logger: AppLogger) {}

  @OnEvent('task.created')
  handleTaskCreated(payload: payloads.TaskCreatedPayload) {
    this.logger.log(`Task created: ${payload.title}`, 'TaskEventListener');
    // TODO: Send notification if assigned, update activity log, etc.
  }

  @OnEvent('task.updated')
  handleTaskUpdated(payload: payloads.TaskUpdatedPayload) {
    this.logger.log(`Task updated: ${payload.id}`, 'TaskEventListener');
    // TODO: Update activity log, invalidate cache, notify team, etc.
  }

  @OnEvent('task.status.changed')
  handleTaskStatusChanged(payload: payloads.TaskStatusChangedPayload) {
    this.logger.log(
      `Task status changed: ${payload.id} - ${payload.oldStatus} → ${payload.newStatus}`,
      'TaskEventListener',
    );
    // TODO: Send notifications, update metrics, trigger workflows, etc.
  }
}
