import {
  ClassConstructor,
  ClassTransformOptions,
  plainToInstance,
} from 'class-transformer';

export class BaseSerializer<T> {
  constructor(private readonly cls: ClassConstructor<T>) {}

  serialize(response: T | T[], options?: ClassTransformOptions): T | T[] {
    return plainToInstance(this.cls, response, {
      excludeExtraneousValues: true,
      ...options,
    });
  }
}

export class ApiResponseSerializer<T> {
  serialize(data: T, message?: string): Record<string, any> {
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
  ): Record<string, any> {
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

  serializeError(message: string, error?: any): Record<string, unknown> {
    return {
      success: false,
      message,
      error: error ?? null,
      timestamp: new Date().toISOString(),
    };
  }
}
