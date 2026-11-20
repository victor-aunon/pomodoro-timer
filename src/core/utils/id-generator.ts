/**
 * Core unique identifier generator utility.
 */

/**
 * Generates a collision-resistant unique identifier.
 * Uses Web Crypto randomUUID when available with fallback for constrained environments.
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 11);
  return `${timestamp}-${randomPart}`;
}
