import { Injectable, Logger } from '@nestjs/common';
import pino from 'pino';

const pinoLogger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport:
    process.env.NODE_ENV !== 'production'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
  redact: {
    paths: ['password', 'secret', 'token', 'authorization', 'cookie'],
    censor: '[REDACTED]',
  },
});

@Injectable()
export class AppLogger extends Logger {
  private formatContext(context?: string): string {
    return context || 'Application';
  }

  log(message: string, context?: string): void {
    pinoLogger.info({ context: this.formatContext(context) }, message);
  }

  error(message: string, trace?: string, context?: string): void {
    pinoLogger.error(
      { context: this.formatContext(context), trace },
      message,
    );
  }

  warn(message: string, context?: string): void {
    pinoLogger.warn({ context: this.formatContext(context) }, message);
  }

  debug(message: string, context?: string): void {
    pinoLogger.debug({ context: this.formatContext(context) }, message);
  }

  verbose(message: string, context?: string): void {
    pinoLogger.trace({ context: this.formatContext(context) }, message);
  }

  fatal(message: string, context?: string): void {
    pinoLogger.fatal({ context: this.formatContext(context) }, message);
  }
}
