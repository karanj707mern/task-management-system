import { ClassTransformOptions, plainToInstance } from 'class-transformer';

export class BaseSerializer<T> {
  serialize(response: T | T[], options?: ClassTransformOptions): unknown {
    return plainToInstance(
      this.constructor as new (...args: unknown[]) => T,
      response,
      {
        excludeExtraneousValues: true,
        ...options,
      },
    );
  }
}

export class ApiResponseSerializer<T> {
  serialize(data: T, message?: string): Record<string, unknown> {
    return {
      success: true,
      data,
      message: message || 'Success',
      timestamp: new Date().toISOString(),
    };
  }

  serializePaginated(
    data: T[],
    total: number,
    page: number,
    limit: number,
  ): Record<string, unknown> {
    const totalPages = Math.ceil(total / limit);
    return {
      success: true,
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
      timestamp: new Date().toISOString(),
    };
  }

  serializeError(message: string, error?: unknown): Record<string, unknown> {
    return {
      success: false,
      message,
      error: error || null,
      timestamp: new Date().toISOString(),
    };
  }
}
