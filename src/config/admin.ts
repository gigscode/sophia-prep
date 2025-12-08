/**
 * Admin Configuration Module
 * 
 * Centralizes admin email management with case-insensitive checking
 * and environment variable support.
 */

/**
 * Normalizes an email address for consistent comparison
 * - Converts to lowercase
 * - Trims leading and trailing whitespace
 * 
 * @param email - The email address to normalize
 * @returns The normalized email address
 */
export const normalizeEmail = (email: string): string => {
  return email.toLowerCase().trim();
};

/**
 * Admin configuration interface
 */
export interface AdminConfig {
  emails: Set<string>;
  isAdmin: (email: string) => boolean;
}

/**
 * Load admin emails from environment variables or use defaults
 * 
 * Environment variable format: VITE_ADMIN_EMAILS="email1@example.com,email2@example.com"
 */
const loadAdminEmails = (): Set<string> => {
  const envEmails = import.meta.env.VITE_ADMIN_EMAILS;

  // Default admin emails (normalized)
  const defaultAdmins = [
    'reubensunday1220@gmail.com',
    'sophiareignsacademy@gmail.com',
    'gigsdev007@gmail.com',
  ];

  // If environment variable is set, parse it
  if (envEmails && typeof envEmails === 'string') {
    const emails = envEmails
      .split(',')
      .map(email => normalizeEmail(email.trim()))
      .filter(email => email.length > 0);

    return new Set(emails);
  }

  // Return normalized default admins
  return new Set(defaultAdmins.map(normalizeEmail));
};

/**
 * Centralized admin configuration
 * 
 * Provides case-insensitive admin status checking
 */
export const adminConfig: AdminConfig = {
  emails: loadAdminEmails(),

  /**
   * Check if an email belongs to an admin user
   * 
   * @param email - The email address to check
   * @returns true if the email is an admin, false otherwise
   */
  isAdmin: (email: string): boolean => {
    const normalized = normalizeEmail(email);
    return adminConfig.emails.has(normalized);
  },
};
