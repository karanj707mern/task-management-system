import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as payloads from '../payloads/event.payloads';

/**
 * Domain event emitter
 */
@Injectable()
export class DomainEventEmitter {
  constructor(private eventEmitter: EventEmitter2) {}

  emitUserCreated(payload: payloads.UserCreatedPayload) {
    this.eventEmitter.emit('user.created', payload);
  }

  emitUserUpdated(payload: payloads.UserUpdatedPayload) {
    this.eventEmitter.emit('user.updated', payload);
  }

  emitTaskCreated(payload: payloads.TaskCreatedPayload) {
    this.eventEmitter.emit('task.created', payload);
  }

  emitTaskUpdated(payload: payloads.TaskUpdatedPayload) {
    this.eventEmitter.emit('task.updated', payload);
  }

  emitTaskStatusChanged(payload: payloads.TaskStatusChangedPayload) {
    this.eventEmitter.emit('task.status.changed', payload);
  }

  emitCommentCreated(payload: payloads.CommentCreatedPayload) {
    this.eventEmitter.emit('comment.created', payload);
  }

  emitProjectCreated(payload: payloads.ProjectCreatedPayload) {
    this.eventEmitter.emit('project.created', payload);
  }
}
