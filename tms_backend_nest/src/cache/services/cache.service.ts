import { Injectable, Inject, InjectionToken } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

/**
 * Cache service wrapper for Redis-based caching
 */
@Injectable()
export class CacheService {
  constructor(
    @Inject(CACHE_MANAGER as unknown as InjectionToken)
    private cacheManager: Cache,
  ) {}

  async get<T>(key: string): Promise<T | undefined> {
    const value = await this.cacheManager.get<T>(key);
    return value as T | undefined;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    await this.cacheManager.set(key, value, ttl);
  }

  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  async reset(): Promise<void> {
    await this.cacheManager.reset();
  }

  async has(key: string): Promise<boolean> {
    const value = await this.cacheManager.get<unknown>(key);
    return value !== undefined;
  }
}
