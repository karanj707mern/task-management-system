/**
 * Environment variables validation
 */

export const env = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1',
  nodeEnv: process.env.NODE_ENV || 'development',
};

if (typeof window !== 'undefined') {
  if (!env.apiBaseUrl) {
    console.warn('NEXT_PUBLIC_API_BASE_URL is not set');
  }
}
