import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';

@Injectable()
export class FailedWebhooksService {
  private readonly logger = new Logger(FailedWebhooksService.name);

  constructor(private readonly prisma: PrismaService) {}

  async recordFailure(eventType: string, payload: unknown, error: string) {
    this.logger.error(`Webhook processing failed for event "${eventType}": ${error}`);
    await this.prisma.failedWebhook.create({
      data: {
        eventType,
        payload: payload as any,
        error,
        retryCount: 0,
      },
    });
  }

  async incrementRetry(id: string) {
    await this.prisma.failedWebhook.update({
      where: { id },
      data: { retryCount: { increment: 1 } },
    });
  }

  async resolve(id: string) {
    await this.prisma.failedWebhook.update({
      where: { id },
      data: { resolvedAt: new Date() },
    });
  }

  async getUnresolved() {
    return this.prisma.failedWebhook.findMany({
      where: { resolvedAt: null },
      orderBy: { createdAt: 'asc' },
    });
  }
}
