import { SetMetadata } from '@nestjs/common';

export const Cacheable = (ttl: number = 60000) => SetMetadata('cache_ttl', ttl);

export const CacheInvalidate = (...keys: string[]) =>
  SetMetadata('cache_invalidate_keys', keys);

export const CacheKey = (key: string) => SetMetadata('cache_key', key);
