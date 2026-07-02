import { Injectable, Logger } from '@nestjs/common';
import { Socket } from 'socket.io';

@Injectable()
export class UsersWebsocketsService {
  private readonly logger = new Logger(UsersWebsocketsService.name);

  handleConnection(client: Socket): void {
    this.logger.log(`Client connected: ${client.id}`);

    client.emit('user:connected', {
      message: 'Connected successfully',
    });
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  handleMessage(client: Socket, payload: unknown): void {
    this.logger.log(`Message from ${client.id}: ${JSON.stringify(payload)}`);

    client.emit('user:response', {
      success: true,
      data: payload,
    });
  }

  handlePing(client: Socket, payload: unknown): void {
    this.logger.log(`Ping from ${client.id}: ${JSON.stringify(payload)}`);

    client.emit('user:pong', {
      message: 'pong',
    });
  }
}
