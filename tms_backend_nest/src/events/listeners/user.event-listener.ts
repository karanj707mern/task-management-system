import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AppLogger } from '../../infrastructure/logger/app-logger.service';
import * as payloads from '../payloads/event.payloads';

/**
 * User event listeners
 */
@Injectable()
export class UserEventListener {
  constructor(private logger: AppLogger) {}

  @OnEvent('user.created')
  handleUserCreated(payload: payloads.UserCreatedPayload) {
    this.logger.log(`User created: ${payload.email}`, 'UserEventListener');
    // TODO: Send welcome email, update metrics, etc.
  }

  @OnEvent('user.updated')
  handleUserUpdated(payload: payloads.UserUpdatedPayload) {
    this.logger.log(`User updated: ${payload.id}`, 'UserEventListener');
    // TODO: Invalidate user cache, update search index, etc.
  }
}
