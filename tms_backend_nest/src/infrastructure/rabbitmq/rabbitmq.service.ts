import { Injectable, Logger } from '@nestjs/common';
import { RabbitMQProducer } from './rabbitmq.producer';

export interface EventPayload {
  eventType: string;
  timestamp: string;
  source: string;
  data: Record<string, unknown>;
  correlationId?: string;
}

@Injectable()
export class RabbitMQService {
  private readonly logger = new Logger(RabbitMQService.name);

  constructor(private readonly producer: RabbitMQProducer) {}

  emitEvent(
    routingKey: string,
    data: Record<string, unknown>,
    correlationId?: string,
  ): void {
    this.logger.log(`Emitting event: ${routingKey}`);
    void this.producer.publishEvent(routingKey, data, correlationId);
  }

  notifyUser(userId: string, notification: { title: string; message: string; type?: string }): void {
    void this.emitEvent('notification.created', {
      userId,
      ...notification,
    });
  }

  sendEmail(email: string, subject: string, body: string): void {
    void this.emitEvent('email.send', {
      to: email,
      subject,
      body,
    });
  }

  logActivity(userId: string, action: string, entityType: string, entityId: string, metadata?: Record<string, unknown>): void {
    void this.emitEvent('activity.log', {
      userId,
      action,
      entityType,
      entityId,
      metadata,
    });
  }
}
