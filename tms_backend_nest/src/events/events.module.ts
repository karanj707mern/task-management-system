import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { LoggerModule } from '../infrastructure/logger/logger.module';
import { RabbitMQModule } from '../infrastructure/rabbitmq/rabbitmq.module';
import { EmailModule } from '../infrastructure/mail/mail.module';
import { TaskEventListener } from './listeners/task.event-listener';
import { UserEventListener } from './listeners/user.event-listener';
import { DomainEventEmitter } from './emitters/domain-event.emitter';

@Module({
  imports: [EventEmitterModule.forRoot({ wildcard: false }), LoggerModule, RabbitMQModule, EmailModule],
  providers: [TaskEventListener, UserEventListener, DomainEventEmitter],
  exports: [DomainEventEmitter],
})
export class EventsModule {}