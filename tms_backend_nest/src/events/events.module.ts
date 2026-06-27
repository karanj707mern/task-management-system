import { Module } from '@nestjs/common';
import { LoggerModule } from '../infrastructure/logger/logger.module';
import { EmailModule } from '../infrastructure/mail/mail.module';
import { TaskEventListener } from './listeners/task.event-listener';
import { UserEventListener } from './listeners/user.event-listener';
import { DomainEventEmitter } from './emitters/domain-event.emitter';

@Module({
  imports: [LoggerModule, EmailModule],
  providers: [TaskEventListener, UserEventListener, DomainEventEmitter],
  exports: [DomainEventEmitter],
})
export class EventsModule {}