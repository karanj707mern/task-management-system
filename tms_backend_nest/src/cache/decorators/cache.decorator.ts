import { SetMetadata } from '@nestjs/common';

/**
 * Decorator to mark method for caching
 * @param ttl Time to live in milliseconds
 */
export const Cacheable = (ttl: number = 60000) => SetMetadata('cache_ttl', ttl);

/**
 * Decorator to mark method that invalidates cache
 */
export const CacheInvalidate = (...keys: string[]) =>
  SetMetadata('cache_invalidate_keys', keys);

/**
 * Decorator to specify cache key for a method
 */
export const CacheKey = (key: string) => SetMetadata('cache_key', key);
