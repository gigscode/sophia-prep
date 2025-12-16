/**
 * URL Persistence Tests
 * 
 * Tests for URL and parameter persistence functionality
 * to ensure proper behavior across page refreshes and navigation.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  preserveQueryParams,
  mergeQueryParams,
  preserveRouteParams,
  getPreservedRouteParams,
  createUrlStateSnapshot,
  extractQueryParams,
  buildPathWithParams,
  normalizePath
} from './navigation';
import { UrlStateManager } from './url-state-manager';

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

describe('URL Parameter Persistence', () => {
  beforeEach(() => {
    mockSessionStorage.store.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    mockSessionStorage.store.clear();
  });

  describe('Query Parameter Preservation', () => {
    it('should preserve specified query parameters', () => {
      const params = new URLSearchParams('?subject=math&mode=practice&level=advanced');
      const paramsToPreserve = ['subject', 'mode'];
      
      const preserved = preserveQueryParams(params, paramsToPreserve);
      
      expect(preserved).toEqual({
        subject: 'math',
        mode: 'practice'
      });
      expect(preserved).not.toHaveProperty('level');
    });

    it('should handle empty parameters gracefully', () => {
      const params = new URLSearchParams('');
      const paramsToPreserve = ['subject', 'mode'];
      
      const preserved = preserveQueryParams(params, paramsToPreserve);
      
      expect(preserved).toEqual({});
    });

    it('should merge preserved parameters with new ones', () => {
      const newParams = { category: 'secondary' };
      const preservedParams = { subject: 'math', mode: 'practice' };
      
      // Mock preserved state
      mockSessionStorage.store.set('nav_queryParams', JSON.stringify(preservedParams));
      
      const merged = mergeQueryParams(newParams, true);
      
      expect(merged).toEqual({
        subject: 'math',
        mode: 'practice',
        category: 'secondary'
      });
    });

    it('should override preserved parameters with new ones when keys conflict', () => {
      const newParams = { subject: 'english', category: 'secondary' };
      const preservedParams = { subject: 'math', mode: 'practice' };
      
      // Mock preserved state
      mockSessionStorage.store.set('nav_queryParams', JSON.stringify(preservedParams));
      
      const merged = mergeQueryParams(newParams, true);
      
      expect(merged).toEqual({
        subject: 'english', // New value overrides preserved
        mode: 'practice',   // Preserved value remains
        category: 'secondary' // New value added
      });
    });
  });

  describe('Route Parameter Preservation', () => {
    it('should preserve route parameters with timestamp', () => {
      const routeParams = { slug: 'mathematics', id: '123' };
      const routePath = '/subjects/:slug/:id';
      
      preserveRouteParams(routeParams, routePath);
      
      const stored = mockSessionStorage.getItem('nav_routeParams');
      expect(stored).toBeTruthy();
      
      const parsed = JSON.parse(stored!);
      expect(parsed.params).toEqual(routeParams);
      expect(parsed.path).toBe(routePath);
      expect(parsed.timestamp).toBeTypeOf('number');
    });

    it('should retrieve preserved route parameters for matching path', () => {
      const routeParams = { slug: 'mathematics', id: '123' };
      const routePath = '/subjects/:slug/:id';
      
      // Store parameters
      const routeState = {
        params: routeParams,
        path: routePath,
        timestamp: Date.now()
      };
      mockSessionStorage.store.set('nav_routeParams', JSON.stringify(routeState));
      
      const retrieved = getPreservedRouteParams(routePath);
      
      expect(retrieved).toEqual(routeParams);
    });

    it('should return null for expired route parameters', () => {
      const routeParams = { slug: 'mathematics', id: '123' };
      const routePath = '/subjects/:slug/:id';
      
      // Store expired parameters (2 hours ago)
      const routeState = {
        params: routeParams,
        path: routePath,
        timestamp: Date.now() - (2 * 60 * 60 * 1000)
      };
      mockSessionStorage.store.set('nav_routeParams', JSON.stringify(routeState));
      
      const retrieved = getPreservedRouteParams(routePath);
      
      expect(retrieved).toBeNull();
    });

    it('should return null for non-matching route path', () => {
      const routeParams = { slug: 'mathematics', id: '123' };
      const routePath = '/subjects/:slug/:id';
      const differentPath = '/quiz/:mode';
      
      // Store parameters for different path
      const routeState = {
        params: routeParams,
        path: routePath,
        timestamp: Date.now()
      };
      mockSessionStorage.store.set('nav_routeParams', JSON.stringify(routeState));
      
      const retrieved = getPreservedRouteParams(differentPath);
      
      expect(retrieved).toBeNull();
    });
  });

  describe('URL State Snapshots', () => {
    it('should create complete URL state snapshot', () => {
      const location = {
        pathname: '/subjects/mathematics',
        search: '?mode=practice&level=advanced',
        hash: '#section1'
      };
      const params = { slug: 'mathematics' };
      
      const snapshot = createUrlStateSnapshot(location, params);
      
      expect(snapshot).toEqual({
        pathname: '/subjects/mathematics',
        search: '?mode=practice&level=advanced',
        hash: '#section1',
        params: { slug: 'mathematics' },
        queryParams: { mode: 'practice', level: 'advanced' },
        timestamp: expect.any(Number)
      });
    });

    it('should handle empty location gracefully', () => {
      const location = {
        pathname: '/',
        search: '',
        hash: ''
      };
      
      const snapshot = createUrlStateSnapshot(location);
      
      expect(snapshot).toEqual({
        pathname: '/',
        search: '',
        hash: '',
        params: {},
        queryParams: {},
        timestamp: expect.any(Number)
      });
    });
  });

  describe('URL Utility Functions', () => {
    it('should extract query parameters correctly', () => {
      const path = '/subjects/math?mode=practice&level=advanced&count=10';
      
      const params = extractQueryParams(path);
      
      expect(params).toEqual({
        mode: 'practice',
        level: 'advanced',
        count: '10'
      });
    });

    it('should build path with parameters correctly', () => {
      const basePath = '/subjects/math';
      const params = { mode: 'practice', level: 'advanced' };
      
      const path = buildPathWithParams(basePath, params);
      
      expect(path).toBe('/subjects/math?mode=practice&level=advanced');
    });

    it('should normalize paths correctly', () => {
      expect(normalizePath('/subjects//math/')).toBe('/subjects/math');
      expect(normalizePath('subjects/math')).toBe('/subjects/math');
      expect(normalizePath('/')).toBe('/');
      expect(normalizePath('')).toBe('/');
    });
  });
});

describe('UrlStateManager', () => {
  let manager: UrlStateManager;

  beforeEach(() => {
    mockSessionStorage.store.clear();
    manager = new UrlStateManager({
      preserveAllQueryParams: true,
      preserveRouteParams: true,
      maxAge: 60 * 60 * 1000 // 1 hour
    });
  });

  afterEach(() => {
    mockSessionStorage.store.clear();
  });

  describe('Snapshot Management', () => {
    it('should save and load snapshots correctly', () => {
      const location = {
        pathname: '/quiz/unified',
        search: '?subject=math&mode=practice',
        hash: ''
      };
      const routeParams = { mode: 'unified' };
      
      const snapshot = manager.createSnapshot(location, routeParams);
      manager.saveSnapshot(snapshot, 'test');
      
      const loaded = manager.loadSnapshot('test');
      
      expect(loaded).toEqual(snapshot);
    });

    it('should return null for expired snapshots', () => {
      const expiredManager = new UrlStateManager({ maxAge: 1 }); // 1ms
      
      const location = {
        pathname: '/test',
        search: '',
        hash: ''
      };
      
      const snapshot = expiredManager.createSnapshot(location);
      expiredManager.saveSnapshot(snapshot, 'test');
      
      // Wait for expiration
      setTimeout(() => {
        const loaded = expiredManager.loadSnapshot('test');
        expect(loaded).toBeNull();
      }, 10);
    });

    it('should clear snapshots correctly', () => {
      const location = {
        pathname: '/test',
        search: '',
        hash: ''
      };
      
      const snapshot = manager.createSnapshot(location);
      manager.saveSnapshot(snapshot, 'test');
      
      expect(manager.loadSnapshot('test')).toBeTruthy();
      
      manager.clearSnapshot('test');
      
      expect(manager.loadSnapshot('test')).toBeNull();
    });
  });

  describe('State Restoration', () => {
    it('should determine when to restore on page load', () => {
      const currentLocation = {
        pathname: '/subjects/math',
        search: '?mode=practice'
      };
      
      // No snapshot exists
      expect(manager.shouldRestoreOnPageLoad(currentLocation)).toBe(false);
      
      // Create different snapshot
      const differentSnapshot = manager.createSnapshot({
        pathname: '/quiz/unified',
        search: '?subject=english',
        hash: ''
      });
      manager.saveSnapshot(differentSnapshot, 'current');
      
      expect(manager.shouldRestoreOnPageLoad(currentLocation)).toBe(true);
      
      // Create same snapshot
      const sameSnapshot = manager.createSnapshot({
        pathname: '/subjects/math',
        search: '?mode=practice',
        hash: ''
      });
      manager.saveSnapshot(sameSnapshot, 'current');
      
      expect(manager.shouldRestoreOnPageLoad(currentLocation)).toBe(false);
    });

    it('should merge parameters with preserved state', () => {
      const preservedSnapshot = manager.createSnapshot({
        pathname: '/test',
        search: '?subject=math&mode=practice',
        hash: ''
      });
      manager.saveSnapshot(preservedSnapshot, 'test');
      
      const newParams = { level: 'advanced', mode: 'exam' };
      const merged = manager.mergeWithPreservedParams(newParams, 'test');
      
      expect(merged).toEqual({
        subject: 'math',
        mode: 'exam', // New value overrides preserved
        level: 'advanced'
      });
    });
  });

  describe('Configuration Management', () => {
    it('should filter query parameters based on configuration', () => {
      const selectiveManager = new UrlStateManager({
        preserveQueryParams: ['subject', 'mode'],
        preserveAllQueryParams: false
      });
      
      const location = {
        pathname: '/test',
        search: '?subject=math&mode=practice&level=advanced&count=10',
        hash: ''
      };
      
      const snapshot = selectiveManager.createSnapshot(location);
      
      expect(snapshot.queryParams).toEqual({
        subject: 'math',
        mode: 'practice'
      });
    });

    it('should update configuration correctly', () => {
      const initialConfig = manager.getConfig();
      expect(initialConfig.preserveAllQueryParams).toBe(true);
      
      manager.updateConfig({ preserveAllQueryParams: false });
      
      const updatedConfig = manager.getConfig();
      expect(updatedConfig.preserveAllQueryParams).toBe(false);
    });
  });
});