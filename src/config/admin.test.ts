import { describe, it, expect } from 'vitest';
import { normalizeEmail, adminConfig } from './admin';

describe('Admin Configuration Module', () => {
  describe('normalizeEmail', () => {
    it('should convert email to lowercase', () => {
      expect(normalizeEmail('TEST@EXAMPLE.COM')).toBe('test@example.com');
      expect(normalizeEmail('Test@Example.Com')).toBe('test@example.com');
    });

    it('should trim whitespace', () => {
      expect(normalizeEmail('  test@example.com  ')).toBe('test@example.com');
      expect(normalizeEmail('\ttest@example.com\n')).toBe('test@example.com');
    });

    it('should handle both lowercase and trim together', () => {
      expect(normalizeEmail('  TEST@EXAMPLE.COM  ')).toBe('test@example.com');
    });
  });

  describe('adminConfig', () => {
    it('should recognize default admin email', () => {
      expect(adminConfig.isAdmin('reubensunday1220@gmail.com')).toBe(true);
    });

    it('should be case-insensitive', () => {
      expect(adminConfig.isAdmin('REUBENSUNDAY1220@GMAIL.COM')).toBe(true);
      expect(adminConfig.isAdmin('ReubenSunday1220@Gmail.Com')).toBe(true);
    });

    it('should handle whitespace in email', () => {
      expect(adminConfig.isAdmin('  reubensunday1220@gmail.com  ')).toBe(true);
    });

    it('should return false for non-admin emails', () => {
      expect(adminConfig.isAdmin('user@example.com')).toBe(false);
      expect(adminConfig.isAdmin('notadmin@gmail.com')).toBe(false);
    });
  });
});
