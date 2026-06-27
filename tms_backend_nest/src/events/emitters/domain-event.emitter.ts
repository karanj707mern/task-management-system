import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RabbitMQProducer } from '../../infrastructure/rabbitmq/rabbitmq.producer';
import * as payloads from '../payloads/event.payloads';

@Injectable()
export class DomainEventEmitter {
  constructor(
    private eventEmitter: EventEmitter2,
    private rabbitMQProducer: RabbitMQProducer,
  ) {}

  private publishToRabbitMQ(event: string, payload: unknown): void {
    void this.rabbitMQProducer
      .publishEvent(event, { event, payload, timestamp: new Date().toISOString() })
      .catch(() => {});
  }

  emitUserCreated(payload: payloads.UserCreatedPayload) {
    this.eventEmitter.emit('user.created', payload);
    this.publishToRabbitMQ('user.created', payload);
  }

  emitUserUpdated(payload: payloads.UserUpdatedPayload) {
    this.eventEmitter.emit('user.updated', payload);
    this.publishToRabbitMQ('user.updated', payload);
  }

  emitTaskCreated(payload: payloads.TaskCreatedPayload) {
    this.eventEmitter.emit('task.created', payload);
    this.publishToRabbitMQ('task.created', payload);
  }

  emitTaskUpdated(payload: payloads.TaskUpdatedPayload) {
    this.eventEmitter.emit('task.updated', payload);
    this.publishToRabbitMQ('task.updated', payload);
  }

  emitTaskStatusChanged(payload: payloads.TaskStatusChangedPayload) {
    this.eventEmitter.emit('task.status.changed', payload);
    this.publishToRabbitMQ('task.status.changed', payload);
  }

  emitCommentCreated(payload: payloads.CommentCreatedPayload) {
    this.eventEmitter.emit('comment.created', payload);
    this.publishToRabbitMQ('comment.created', payload);
  }

  emitProjectCreated(payload: payloads.ProjectCreatedPayload) {
    this.eventEmitter.emit('project.created', payload);
    this.publishToRabbitMQ('project.created', payload);
  }
}