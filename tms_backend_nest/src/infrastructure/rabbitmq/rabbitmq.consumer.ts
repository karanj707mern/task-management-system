import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import * as amqplib from 'amqplib';

@Injectable()
export class RabbitMQConsumer implements OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQConsumer.name);

  constructor(
    @Inject('RABBITMQ_CHANNEL')
    private readonly channel: amqplib.Channel,
  ) {}

  async consume(queue: string, handler: (message: unknown) => Promise<void>): Promise<void> {
    await this.channel.assertQueue(queue, { durable: true });

    await this.channel.consume(
      queue,
      async (msg) => {
        if (!msg) return;

        try {
          const content = JSON.parse(msg.content.toString());
          await handler(content);
          this.channel.ack(msg);
        } catch (error) {
          this.logger.error(`Error processing message from ${queue}`, (error as Error).stack);
          this.channel.nack(msg, false, false);
        }
      },
      { noAck: false },
    );

    this.logger.log(`Consuming from queue: ${queue}`);
  }

  async onModuleDestroy(): Promise<void> {
    await this.channel.close().catch(() => {});
    this.logger.log('RabbitMQ channel closed');
  }
}
