import { OnEvent } from '@nestjs/event-emitter';
import { AppLogger } from '../../infrastructure/logger/app-logger.service';
import { CacheKeys } from '../../cache/keys/cache-keys';
import { CacheService } from '../../cache/services/cache.service';
import { EmailService } from '../../infrastructure/mail/mail.service';
import * as payloads from '../payloads/event.payloads';

export class UserEventListener {
  constructor(
    private logger: AppLogger,
    private emailService: EmailService,
    private cacheService: CacheService,
  ) {}

  @OnEvent('user.created')
  handleUserCreated(payload: payloads.UserCreatedPayload) {
    this.logger.log(`User created: ${payload.email}`, 'UserEventListener');
    void this.emailService
      .sendWelcomeEmail(payload.email, payload.name || payload.email.split('@')[0])
      .catch((error) => {
        this.logger.error(
          error instanceof Error ? error.message : 'Failed to queue welcome email',
          'UserEventListener',
        );
      });
  }

  @OnEvent('user.updated')
  handleUserUpdated(payload: payloads.UserUpdatedPayload) {
    this.logger.log(`User updated: ${payload.id}`, 'UserEventListener');
    void this.cacheService.del(CacheKeys.user(payload.id));
    void this.cacheService.del(CacheKeys.permissions(payload.id));
  }
}
