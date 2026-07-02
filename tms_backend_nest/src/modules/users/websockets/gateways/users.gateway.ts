import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { UsersWebsocketsService } from '../users.websockets.service';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000'],
    credentials: true,
  },
})
export class UsersGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(UsersGateway.name);

  constructor(
    private readonly usersWebsocketsService: UsersWebsocketsService,
  ) {}

  afterInit(server: Server): void {
    this.logger.log(
      `Gateway initialized with ${server.engine.clientsCount} clients`,
    );
  }

  handleConnection(client: Socket): void {
    this.usersWebsocketsService.handleConnection(client);
  }

  handleDisconnect(client: Socket): void {
    this.usersWebsocketsService.handleDisconnect(client);
  }

  @SubscribeMessage('user:ping')
  handlePing(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: unknown,
  ): void {
    this.usersWebsocketsService.handlePing(client, payload);
  }
}
