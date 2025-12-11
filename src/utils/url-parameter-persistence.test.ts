/**
 * URL Parameter Persistence Tests
 * 
 * Comprehensive tests for URL parameter persistence functionality
 * including validation, preservation, and restoration.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  UrlParameterPersistence, 
  createAppParameterPersistence,
  appParameterPersistence,
  defaultParameterValidators
} from './url-parameter-persistence';

// Mock sessionStorage
const mockSessionStorage = {
  store: new Map<string, string>(),
  getItem: vi.fn((key: string) => mockSessionStorage.store.get(key) || null),
  setItem: vi.fn((key: string, value: string) => mockSessionStorage.store.set(key, value)),
  removeItem: vi.fn((key: string) => mockSessionStorage.store.delete(key)),
  clear: vi.fn(() => mockSessionStorage.store.clear()),
  key: vi.fn((index: number) => Array.from(mockSessionStorage.store.keys())[index] || null),
  get length() { return mockSessionStorage.store.size; }
};

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage
});

// Mock navigate function
const mockNavigate = vi.fn();

describe('UrlParameterPersistence', () => {
  let persistence: UrlParameterPersistence;

  beforeEach(() => {
    mockSessionStorage.store.clear();
    vi.clearAllMocks();
    
    persistence = new UrlParameterPersistence({
      preserveAllQueryParams: true,
      preserveRouteParams: true,
      queryParamValidators: defaultParameterValidators.query,
      routeParamValidators: defaultParameterValidators.route,
      maxAge: 60 * 60 * 1000 // 1 hour
    });
  });

  afterEach(() => {
    mockSessionStorage.store.clear();
  });

  describe('Parameter Preservation', () => {
    it('should preserve valid query and route parameters', () => {
      const location = {
        pathname: '/subjects/mathematics',
        search: '?mode=practice&level=advanced',
        hash: ''
      };
      const routeParams = { slug: 'mathematics' };
      
      const result = persistence.preserveParameters(location, routeParams, '/subjects/:slug');
      
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.preservedParams).toEqual({
        query: { mode: 'practice', level: 'advanced' },
        route: { slug: 'mathematics' }
      });
    });

    it('should reject invalid query parameters', () => {
      const location = {
        pathname: '/quiz/unified',
        search: '?mode=invalid&timeLimit=500', // invalid mode and time limit too high
        hash: ''
      };
      
      const result = persistence.preserveParameters(location, {}, '/quiz/:mode');
      
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(error => error.includes('mode'))).toBe(true);
    });

    it('should reject invalid route parameters', () => {
      const location = {
        pathname: '/subjects/math@matics', // invalid slug with special character
        search: '',
        hash: ''
      };
      const routeParams = { slug: 'math@matics' };
      
      const result = persistence.preserveParameters(location, routeParams, '/subjects/:slug');
      
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(error => error.includes('slug'))).toBe(true);
    });

    it('should sanitize parameters while preserving valid ones', () => {
      const location = {
        pathname: '/subjects/mathematics',
        search: '?mode=practice&search=<script>alert("xss")</script>',
        hash: ''
      };
      const routeParams = { slug: 'mathematics' };
      
      const result = persistence.preserveParameters(location, routeParams, '/subjects/:slug');
      
      expect(result.success).toBe(true);
      expect(result.preservedParams?.query.mode).toBe('practice');
      expect(result.preservedParams?.query.search).toBe('scriptalert(xss)/script'); // sanitized
    });
  });

  describe('Parameter Restoration', () => {
    it('should restore preserved parameters successfully', () => {
      // First preserve some parameters
      const location = {
        pathname: '/subjects/mathematics',
        search: '?mode=practice&level=advanced',
        hash: ''
      };
      const routeParams = { slug: 'mathematics' };
      
      persistence.preserveParameters(location, routeParams, '/subjects/:slug');
      
      // Then restore them
      const currentLocation = {
        pathname: '/subjects/english', // different location
        search: ''
      };
      
      const result = persistence.restoreParameters(mockNavigate, currentLocation);
      
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(mockNavigate).toHaveBeenCalled();
    });

    it('should not restore if current location matches preserved state', () => {
      // Preserve parameters
      const location = {
        pathname: '/subjects/mathematics',
        search: '?mode=practice',
        hash: ''
      };
      
      persistence.preserveParameters(location, { slug: 'mathematics' }, '/subjects/:slug');
      
      // Try to restore to same location
      const result = persistence.restoreParameters(mockNavigate, {
        pathname: '/subjects/mathematics',
        search: '?mode=practice'
      });
      
      expect(result.success).toBe(false);
      expect(result.errors.some(error => error.includes('already match'))).toBe(true);
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should handle missing preserved parameters gracefully', () => {
      const currentLocation = {
        pathname: '/subjects/mathematics',
        search: ''
      };
      
      const result = persistence.restoreParameters(mockNavigate, currentLocation);
      
      expect(result.success).toBe(false);
      expect(result.errors.some(error => error.includes('No preserved parameters'))).toBe(true);
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('Navigation with Preservation', () => {
    it('should navigate while preserving query parameters', () => {
      // Set up current state with parameters to preserve
      const location = {
        pathname: '/subjects/mathematics',
        search: '?mode=practice&level=advanced',
        hash: ''
      };
      
      persistence.preserveParameters(location, { slug: 'mathematics' });
      
      // Navigate to new path with preservation
      const result = persistence.navigateWithPreservation('/quiz/unified', mockNavigate, {
        preserveQuery: true,
        newParams: { subject: 'math' }
      });
      
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle navigation errors gracefully', () => {
      // Mock navigate to throw an error
      const errorNavigate = vi.fn(() => {
        throw new Error('Navigation failed');
      });
      
      const result = persistence.navigateWithPreservation('/test', errorNavigate);
      
      expect(result.success).toBe(false);
      expect(result.errors.some(error => error.includes('Navigation'))).toBe(true);
    });
  });

  describe('Parameter Validation', () => {
    it('should validate current parameters correctly', () => {
      const location = {
        pathname: '/subjects/mathematics',
        search: '?mode=practice&timeLimit=30',
        hash: ''
      };
      const routeParams = { slug: 'mathematics' };
      
      const result = persistence.validateCurrentParameters(location, routeParams);
      
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect validation errors in current parameters', () => {
      const location = {
        pathname: '/subjects/math@matics',
        search: '?mode=invalid&timeLimit=500',
        hash: ''
      };
      const routeParams = { slug: 'math@matics' };
      
      const result = persistence.validateCurrentParameters(location, routeParams);
      
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Configuration Management', () => {
    it('should return current configuration', () => {
      const config = persistence.getConfiguration();
      
      expect(config.preserveAllQueryParams).toBe(true);
      expect(config.preserveRouteParams).toBe(true);
      expect(config.maxAge).toBe(60 * 60 * 1000);
    });

    it('should update configuration correctly', () => {
      persistence.updateConfiguration({
        preserveAllQueryParams: false,
        maxAge: 30 * 60 * 1000 // 30 minutes
      });
      
      const config = persistence.getConfiguration();
      
      expect(config.preserveAllQueryParams).toBe(false);
      expect(config.maxAge).toBe(30 * 60 * 1000);
    });
  });

  describe('State Management', () => {
    it('should clear all preserved parameters', () => {
      // Preserve some parameters first
      const location = {
        pathname: '/test',
        search: '?param=value',
        hash: ''
      };
      
      persistence.preserveParameters(location, {});
      
      // Verify something was stored
      expect(mockSessionStorage.store.size).toBeGreaterThan(0);
      
      // Clear all parameters
      persistence.clearAllParameters();
      
      // Verify storage was cleared
      expect(mockSessionStorage.store.size).toBe(0);
    });
  });
});

describe('Default Parameter Validators', () => {
  describe('Query Parameter Validators', () => {
    it('should validate subject slugs correctly', () => {
      expect(defaultParameterValidators.query.subject('mathematics')).toBe(true);
      expect(defaultParameterValidators.query.subject('english-language')).toBe(true);
      expect(defaultParameterValidators.query.subject('math@matics')).toBe(false);
      expect(defaultParameterValidators.query.subject('')).toBe(false);
    });

    it('should validate quiz modes correctly', () => {
      expect(defaultParameterValidators.query.mode('practice')).toBe(true);
      expect(defaultParameterValidators.query.mode('exam')).toBe(true);
      expect(defaultParameterValidators.query.mode('invalid')).toBe(false);
    });

    it('should validate time limits correctly', () => {
      expect(defaultParameterValidators.query.timeLimit('30')).toBe(true);
      expect(defaultParameterValidators.query.timeLimit('300')).toBe(true);
      expect(defaultParameterValidators.query.timeLimit('500')).toBe(false); // too high
      expect(defaultParameterValidators.query.timeLimit('0')).toBe(false); // zero not allowed
    });

    it('should validate question counts correctly', () => {
      expect(defaultParameterValidators.query.questionCount('10')).toBe(true);
      expect(defaultParameterValidators.query.questionCount('100')).toBe(true);
      expect(defaultParameterValidators.query.questionCount('150')).toBe(false); // too high
      expect(defaultParameterValidators.query.questionCount('abc')).toBe(false); // non-numeric
    });
  });

  describe('Route Parameter Validators', () => {
    it('should validate route slugs correctly', () => {
      expect(defaultParameterValidators.route.slug('mathematics')).toBe(true);
      expect(defaultParameterValidators.route.slug('physics-101')).toBe(true);
      expect(defaultParameterValidators.route.slug('math@matics')).toBe(false);
    });

    it('should validate numeric IDs correctly', () => {
      expect(defaultParameterValidators.route.id('123')).toBe(true);
      expect(defaultParameterValidators.route.id('1')).toBe(true);
      expect(defaultParameterValidators.route.id('0')).toBe(false); // zero not allowed
      expect(defaultParameterValidators.route.id('abc')).toBe(false); // non-numeric
    });
  });
});

describe('App Parameter Persistence Factory', () => {
  it('should create configured persistence instance', () => {
    const customPersistence = createAppParameterPersistence({
      preserveAllQueryParams: false,
      preserveSpecificQueryParams: ['subject', 'mode'],
      maxAge: 30 * 60 * 1000
    });
    
    const config = customPersistence.getConfiguration();
    
    expect(config.preserveAllQueryParams).toBe(false);
    expect(config.preserveSpecificQueryParams).toEqual(['subject', 'mode']);
    expect(config.maxAge).toBe(30 * 60 * 1000);
  });

  it('should use default app persistence instance', () => {
    expect(appParameterPersistence).toBeInstanceOf(UrlParameterPersistence);
    
    const config = appParameterPersistence.getConfiguration();
    expect(config.storagePrefix).toBe('soprep');
    expect(config.fallbackPath).toBe('/');
  });
});