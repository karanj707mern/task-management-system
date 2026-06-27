import { Inject, Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as amqplib from 'amqplib';

export interface RabbitMQMessage {
  routingKey: string;
  exchange: string;
  data: unknown;
  options?: amqplib.Options.Publish;
}

@Injectable()
export class RabbitMQProducer implements OnModuleInit {
  private readonly logger = new Logger(RabbitMQProducer.name);
  private exchange = 'tms.events';

  constructor(
    @Inject('RABBITMQ_CHANNEL')
    private readonly channel: amqplib.Channel,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.channel.assertExchange(this.exchange, 'topic', { durable: true });
      this.logger.log('RabbitMQ exchange asserted successfully');
    } catch (error) {
      this.logger.error('Failed to assert exchange', (error as Error).message);
    }
  }

  async publishMessage(message: RabbitMQMessage): Promise<boolean> {
    try {
      const result = this.channel.publish(
        message.exchange,
        message.routingKey,
        Buffer.from(JSON.stringify(message.data)),
        { 
          persistent: true,
          ...message.options,
          contentType: 'application/json',
          timestamp: Date.now(),
        },
      );
      
      this.logger.debug(`Published to ${message.exchange}:${message.routingKey}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to publish message: ${(error as Error).message}`);
      return false;
    }
  }

  async publishEvent(
    eventType: string,
    data: unknown,
    correlationId?: string,
  ): Promise<boolean> {
    return this.publishMessage({
      exchange: this.exchange,
      routingKey: eventType,
      data: {
        ...(typeof data === 'object' && data !== null ? data as Record<string, unknown> : { data }),
        correlationId,
        timestamp: new Date().toISOString(),
      },
    });
  }
}