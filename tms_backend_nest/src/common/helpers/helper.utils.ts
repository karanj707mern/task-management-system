/**
 * Utility helper functions
 */

/**
 * Generate a UUID v4
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Format pagination parameters
 */
export function formatPaginationParams(page: number, limit: number) {
  const validPage = Math.max(1, page);
  const validLimit = Math.min(100, Math.max(1, limit));
  const skip = (validPage - 1) * validLimit;

  return { page: validPage, limit: validLimit, skip };
}

/**
 * Generate slug from string
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Mask email address for privacy
 */
export function maskEmail(email: string): string {
  const [localPart, domain] = email.split('@');
  const visibleChars = Math.max(1, Math.floor(localPart.length / 3));
  const masked =
    localPart.slice(0, visibleChars) +
    '*'.repeat(localPart.length - visibleChars);
  return `${masked}@${domain}`;
}
