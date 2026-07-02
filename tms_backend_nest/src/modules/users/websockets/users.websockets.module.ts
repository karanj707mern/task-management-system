import { Module } from '@nestjs/common';

import { UsersGateway } from './gateways/users.gateway';
import { UsersWebsocketsService } from './users.websockets.service';

@Module({
  providers: [UsersGateway, UsersWebsocketsService],
  exports: [UsersWebsocketsService],
})
export class UsersWebsocketsModule {}
