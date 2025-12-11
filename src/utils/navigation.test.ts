import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  isValidPath,
  extractQueryParams,
  buildPathWithParams,
  normalizePath,
  pathMatches,
  getRouteSegments,
  pathRequiresAuth,
  preserveUrlState,
  getPreservedUrlState,
  clearPreservedUrlState,
} from './navigation';

// Mock sessionStorage
const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  key: vi.fn(),
  length: 0,
};

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
});

describe('Navigation Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isValidPath', () => {
    it('should validate correct paths', () => {
      expect(isValidPath('/')).toBe(true);
      expect(isValidPath('/home')).toBe(true);
      expect(isValidPath('/users/123')).toBe(true);
      expect(isValidPath('/search?q=test')).toBe(true);
    });

    it('should reject invalid paths', () => {
      expect(isValidPath('home')).toBe(false); // No leading slash
      expect(isValidPath('/test<script>')).toBe(false); // Dangerous chars
      expect(isValidPath('/test"quote')).toBe(false); // Dangerous chars
    });
  });

  describe('extractQueryParams', () => {
    it('should extract query parameters', () => {
      const params = extractQueryParams('/search?q=test&page=1');
      expect(params).toEqual({ q: 'test', page: '1' });
    });

    it('should handle paths without query params', () => {
      const params = extractQueryParams('/home');
      expect(params).toEqual({});
    });

    it('should handle invalid paths gracefully', () => {
      const params = extractQueryParams('invalid');
      expect(params).toEqual({});
    });
  });

  describe('buildPathWithParams', () => {
    it('should build path with query parameters', () => {
      const path = buildPathWithParams('/search', { q: 'test', page: '1' });
      expect(path).toBe('/search?q=test&page=1');
    });

    it('should handle empty parameters', () => {
      const path = buildPathWithParams('/home', {});
      expect(path).toBe('/home');
    });

    it('should filter out empty values', () => {
      const path = buildPathWithParams('/search', { q: 'test', empty: '', null: null });
      expect(path).toBe('/search?q=test');
    });
  });

  describe('normalizePath', () => {
    it('should normalize paths correctly', () => {
      expect(normalizePath('/home')).toBe('/home');
      expect(normalizePath('home')).toBe('/home');
      expect(normalizePath('/home/')).toBe('/home');
      expect(normalizePath('//home//test//')).toBe('/home/test');
      expect(normalizePath('')).toBe('/');
    });
  });

  describe('pathMatches', () => {
    it('should match exact paths', () => {
      expect(pathMatches('/home', '/home')).toBe(true);
      expect(pathMatches('/home', '/about')).toBe(false);
    });

    it('should match wildcard patterns', () => {
      expect(pathMatches('/users/123', '/users/*')).toBe(true);
      expect(pathMatches('/admin/settings', '/admin/*')).toBe(true);
      expect(pathMatches('/home', '/users/*')).toBe(false);
    });
  });

  describe('getRouteSegments', () => {
    it('should extract route segments', () => {
      expect(getRouteSegments('/users/123/profile')).toEqual(['users', '123', 'profile']);
      expect(getRouteSegments('/home')).toEqual(['home']);
      expect(getRouteSegments('/')).toEqual([]);
    });

    it('should handle query parameters and hash', () => {
      expect(getRouteSegments('/users/123?tab=profile#section')).toEqual(['users', '123']);
    });
  });

  describe('pathRequiresAuth', () => {
    it('should identify auth-required paths', () => {
      expect(pathRequiresAuth('/profile')).toBe(true);
      expect(pathRequiresAuth('/admin/users')).toBe(true);
      expect(pathRequiresAuth('/dashboard')).toBe(true);
      expect(pathRequiresAuth('/home')).toBe(false);
      expect(pathRequiresAuth('/about')).toBe(false);
    });
  });

  describe('URL state preservation', () => {
    it('should preserve and retrieve URL state', () => {
      const testData = { path: '/test', timestamp: Date.now() };
      
      preserveUrlState('test', testData);
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        'nav_test',
        JSON.stringify(testData)
      );

      mockSessionStorage.getItem.mockReturnValue(JSON.stringify(testData));
      const retrieved = getPreservedUrlState('test');
      expect(retrieved).toEqual(testData);
    });

    it('should handle storage errors gracefully', () => {
      mockSessionStorage.setItem.mockImplementation(() => {
        throw new Error('Storage full');
      });

      // Should not throw
      expect(() => preserveUrlState('test', 'data')).not.toThrow();
    });

    it('should clear URL state', () => {
      clearPreservedUrlState('test');
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('nav_test');
    });

    it('should clear all navigation state when no key provided', () => {
      // Mock sessionStorage keys
      const mockKeys = ['nav_test1', 'nav_test2', 'other_key'];
      Object.defineProperty(mockSessionStorage, 'length', { value: mockKeys.length });
      mockSessionStorage.key = vi.fn().mockImplementation((index) => mockKeys[index]);

      clearPreservedUrlState();

      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('nav_test1');
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('nav_test2');
      expect(mockSessionStorage.removeItem).not.toHaveBeenCalledWith('other_key');
    });
  });
});