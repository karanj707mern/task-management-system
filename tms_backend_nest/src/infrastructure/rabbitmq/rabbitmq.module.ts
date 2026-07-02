import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppLogger } from '../logger/app-logger.service';
import * as amqplib from 'amqplib';
import { RabbitMQConsumer } from './rabbitmq.consumer';
import { RabbitMQProducer } from './rabbitmq.producer';
import { RabbitMQService } from './rabbitmq.service';

@Global()
@Module({
  providers: [
    {
      provide: 'RABBITMQ_CONNECTION',
      useFactory: async (config: ConfigService) => {
        const logger = new AppLogger(RabbitMQModule.name);
        const url = config.get<string>('RABBITMQ_URL') || 'amqp://localhost:5672';
        const maxRetries = 5;
        const retryDelay = 3000;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            const connection = await amqplib.connect(url, {
              heartbeat: 60,
              timeout: 10000,
            });

            connection.on('error', (err) => {
              logger.error(`[RabbitMQ] Connection error: ${err.message}`);
            });

            connection.on('close', () => {
              logger.warn('[RabbitMQ] Connection closed, attempting reconnection...');
            });

            logger.log('[RabbitMQ] Connected successfully');
            return connection;
          } catch (error) {
            if (attempt === maxRetries) {
              throw new Error(`[RabbitMQ] Failed to connect after ${maxRetries} attempts: ${(error as Error).message}`);
            }
            await new Promise(resolve => setTimeout(resolve, retryDelay));
          }
        }
      },
      inject: [ConfigService],
    },
    {
      provide: 'RABBITMQ_CHANNEL',
      useFactory: async (connection: amqplib.ChannelModel) => {
        const channel = await connection.createChannel();

        await channel.assertExchange('tms.events', 'topic', { durable: true });

        await channel.assertQueue('tms.email', {
          durable: true,
          arguments: {
            'x-message-ttl': 604800000,
            'x-max-length': 10000,
          },
        });

        await channel.assertQueue('tms.notifications', {
          durable: true,
          arguments: {
            'x-message-ttl': 86400000,
            'x-max-length': 50000,
          },
        });

        await channel.assertQueue('tms.activity', {
          durable: true,
          arguments: {
            'x-message-ttl': 2592000000,
          },
        });

        await channel.bindQueue('tms.email', 'tms.events', 'email.*');
        await channel.bindQueue('tms.notifications', 'tms.events', 'notification.*');
        await channel.bindQueue('tms.activity', 'tms.events', 'activity.*');

        return channel;
      },
      inject: ['RABBITMQ_CONNECTION'],
    },
    RabbitMQProducer,
    RabbitMQConsumer,
    RabbitMQService,
  ],
  exports: ['RABBITMQ_CONNECTION', 'RABBITMQ_CHANNEL', RabbitMQProducer, RabbitMQConsumer, RabbitMQService],
})
export class RabbitMQModule {}
