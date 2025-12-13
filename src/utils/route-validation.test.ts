/**
 * Route Validation Tests
 * 
 * Tests for route parameter validation utilities
 */

import { describe, it, expect } from 'vitest';
import { 
  validateSlug, 
  validateNumericId, 
  validateQuizMode, 
  validateClassCategory,
  validateQuizParams,
  sanitizeRouteParam,
  validateAndSanitizeUrl,
  validateRouteParams
} from './route-validation';

describe('Route Validation', () => {
  describe('validateSlug', () => {
    it('should validate correct slugs', () => {
      expect(validateSlug('mathematics')).toBe(true);
      expect(validateSlug('english-language')).toBe(true);
      expect(validateSlug('physics-101')).toBe(true);
      expect(validateSlug('Mathematics')).toBe(true); // uppercase allowed
      expect(validateSlug('a')).toBe(true);
    });

    it('should reject invalid slugs', () => {
      expect(validateSlug('')).toBe(false);
      expect(validateSlug('math@matics')).toBe(false); // special chars
      expect(validateSlug('-mathematics')).toBe(false); // starts with hyphen
      expect(validateSlug('mathematics-')).toBe(false); // ends with hyphen
      expect(validateSlug('a'.repeat(101))).toBe(false); // too long
    });
  });

  describe('validateNumericId', () => {
    it('should validate correct numeric IDs', () => {
      expect(validateNumericId('1')).toBe(true);
      expect(validateNumericId('123')).toBe(true);
      expect(validateNumericId('999999')).toBe(true);
    });

    it('should reject invalid numeric IDs', () => {
      expect(validateNumericId('')).toBe(false);
      expect(validateNumericId('0')).toBe(false); // zero not allowed
      expect(validateNumericId('-1')).toBe(false); // negative
      expect(validateNumericId('1.5')).toBe(false); // decimal
      expect(validateNumericId('abc')).toBe(false); // non-numeric
    });
  });

  describe('validateQuizMode', () => {
    it('should validate correct quiz modes', () => {
      expect(validateQuizMode('practice')).toBe(true);
      expect(validateQuizMode('exam')).toBe(true);
      expect(validateQuizMode('timed')).toBe(true);
      expect(validateQuizMode('untimed')).toBe(true);
      expect(validateQuizMode('PRACTICE')).toBe(true); // case insensitive
    });

    it('should reject invalid quiz modes', () => {
      expect(validateQuizMode('')).toBe(false);
      expect(validateQuizMode('invalid')).toBe(false);
      expect(validateQuizMode('test')).toBe(false);
    });
  });

  describe('validateClassCategory', () => {
    it('should validate correct class categories', () => {
      expect(validateClassCategory('primary')).toBe(true);
      expect(validateClassCategory('secondary')).toBe(true);
      expect(validateClassCategory('jamb')).toBe(true);

      expect(validateClassCategory('PRIMARY')).toBe(true); // case insensitive
    });

    it('should reject invalid class categories', () => {
      expect(validateClassCategory('')).toBe(false);
      expect(validateClassCategory('invalid')).toBe(false);
      expect(validateClassCategory('university')).toBe(false);
    });
  });

  describe('validateQuizParams', () => {
    it('should validate correct quiz parameters', () => {
      const params = new URLSearchParams('subject=mathematics&mode=practice&timeLimit=30');
      const result = validateQuizParams(params);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid quiz parameters', () => {
      const params = new URLSearchParams('subject=Math@matics&mode=invalid&timeLimit=500');
      const result = validateQuizParams(params);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('sanitizeRouteParam', () => {
    it('should sanitize dangerous characters', () => {
      expect(sanitizeRouteParam('<script>alert("xss")</script>')).toBe('scriptalert(xss)/script');
      expect(sanitizeRouteParam('../../../etc/passwd')).toBe('///etc/passwd');
      expect(sanitizeRouteParam('normal-param')).toBe('normal-param');
    });

    it('should handle empty or invalid inputs', () => {
      expect(sanitizeRouteParam('')).toBe('');
      expect(sanitizeRouteParam('   ')).toBe('');
    });
  });

  describe('validateAndSanitizeUrl', () => {
    it('should validate and sanitize correct URLs', () => {
      const result = validateAndSanitizeUrl('/subjects/mathematics?mode=practice');
      expect(result.isValid).toBe(true);
      expect(result.sanitizedUrl).toBe('/subjects/mathematics?mode=practice');
    });

    it('should handle malformed URLs', () => {
      const result = validateAndSanitizeUrl('javascript:alert("xss")');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateRouteParams', () => {
    it('should validate parameters based on configuration', () => {
      const params = { slug: 'mathematics', id: '123' };
      const config = [
        { name: 'slug', validator: validateSlug, required: true },
        { name: 'id', validator: validateNumericId, required: false }
      ];

      const result = validateRouteParams(params, config);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required parameters', () => {
      const params = { id: '123' };
      const config = [
        { name: 'slug', validator: validateSlug, required: true }
      ];

      const result = validateRouteParams(params, config);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});