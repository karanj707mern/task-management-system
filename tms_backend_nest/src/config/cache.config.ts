export default () => ({
  cache: {
    ttl: parseInt(process.env.CACHE_TTL ?? '600', 10),
    prefix: process.env.CACHE_PREFIX || 'tms_cache',
  },
});