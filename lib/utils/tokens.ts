import { randomBytes } from 'crypto';

/**
 * Generates a cryptographically secure, URL-safe token.
 * @param {number} length The desired length of the token in bytes.
 * @returns {string} A hex-encoded token.
 */
export function generateSecureToken(length: number = 32): string {
  return randomBytes(length).toString('hex');
}
