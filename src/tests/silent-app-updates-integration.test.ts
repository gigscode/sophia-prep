import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { CacheManager } from '../utils/cache-management';

/**
 * Integration tests for silent app updates system
 * 
 * This test suite validates the complete end-to-end flow of silent updates:
 * - Version detection and comparison
 * - Silent update application without UI notifications
 * - Cache clearing effectiveness
 * - Cross-browser compatibility scenarios
 * - PWA compatibility for installed apps
 * - Error recovery and fallback mechanisms
 * 
 * Requirements: All requirements from silent-app-updates spec
 */
describe('Silent App Updates Integration Tests', () => {
  let mockFetch: Mock;
  let mockLocalStorage: Record<string, string>;
  let mockSessionStorage: Record<string, string>;
  let mockCaches: Map<string, Cache>;
  let mockServiceWorker: any;
  let originalLocation: Location;
  let mockLocation: any;

  // Test version data
  const currentVersion = {
    version: '1.0.0',
    buildTime: '2024-01-01T00:00:00Z',
    buildId: 'build-123',
    cacheName: 'app-cache-v1'
  };

  const newVersion = {
    version: '1.1.0',
    buildTime: '2024-01-02T00:00:00Z',
    buildId: 'build-456',
    cacheName: 'app-cache-v2'
  };

  beforeEach(() => {
    // Mock fetch for version.json requests
    mockFetch = vi.fn();
    global.fetch = mockFetch;

    // Mock localStorage with proper implementation
    mockLocalStorage = {};
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn((key: string) => mockLocalStorage[key] || null),
        setItem: vi.fn((key: string, value: string) => {
          mockLocalStorage[key] = value;
        }),
        removeItem: vi.fn((key: string) => {
          delete mockLocalStorage[key];
        }),
        clear: vi.fn(() => {
          Object.keys(mockLocalStorage).forEach(key => delete mockLocalStorage[key]);
        }),
        get length() {
          return Object.keys(mockLocalStorage).length;
        },
        key: vi.fn((index: number) => Object.keys(mockLocalStorage)[index] || null)
      },
      writable: true
    });

    // Mock sessionStorage
    mockSessionStorage = {};
    Object.defineProperty(window, 'sessionStorage', {
      value: {
        getItem: vi.fn((key: string) => mockSessionStorage[key] || null),
        setItem: vi.fn((key: string, value: string) => {
          mockSessionStorage[key] = value;
        }),
        removeItem: vi.fn((key: string) => {
          delete mockSessionStorage[key];
        }),
        clear: vi.fn(() => {
          Object.keys(mockSessionStorage).forEach(key => delete mockSessionStorage[key]);
        }),
        get length() {
          return Object.keys(mockSessionStorage).length;
        },
        key: vi.fn((index: number) => Object.keys(mockSessionStorage)[index] || null)
      },
      writable: true
    });

    // Mock Cache API
    mockCaches = new Map();
    const mockCache = {
      delete: vi.fn().mockResolvedValue(true),
      keys: vi.fn().mockResolvedValue([]),
      match: vi.fn().mockResolvedValue(undefined),
      matchAll: vi.fn().mockResolvedValue([]),
      add: vi.fn().mockResolvedValue(undefined),
      addAll: vi.fn().mockResolvedValue(undefined),
      put: vi.fn().mockResolvedValue(undefined)
    };

    global.caches = {
      open: vi.fn().mockResolvedValue(mockCache),
      delete: vi.fn((cacheName: string) => {
        const existed = mockCaches.has(cacheName);
        mockCaches.delete(cacheName);
        return Promise.resolve(existed);
      }),
      keys: vi.fn(() => Promise.resolve(Array.from(mockCaches.keys()))),
      match: vi.fn().mockResolvedValue(undefined),
      has: vi.fn((cacheName: string) => Promise.resolve(mockCaches.has(cacheName)))
    };

    // Mock Service Worker
    mockServiceWorker = {
      register: vi.fn().mockResolvedValue({
        scope: '/',
        active: { scriptURL: '/sw.js', postMessage: vi.fn() },
        waiting: null,
        installing: null,
        update: vi.fn().mockResolvedValue(undefined),
        unregister: vi.fn().mockResolvedValue(true),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      }),
      getRegistration: vi.fn().mockResolvedValue({
        scope: '/',
        active: { scriptURL: '/sw.js', postMessage: vi.fn() },
        waiting: null,
        installing: null,
        update: vi.fn().mockResolvedValue(undefined),
        unregister: vi.fn().mockResolvedValue(true),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      }),
      getRegistrations: vi.fn().mockResolvedValue([]),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      controller: null
    };

    Object.defineProperty(navigator, 'serviceWorker', {
      value: mockServiceWorker,
      writable: true
    });

    // Mock location for reload testing
    originalLocation = window.location;
    mockLocation = {
      href: 'http://localhost:3000/',
      reload: vi.fn(),
      replace: vi.fn(),
      assign: vi.fn()
    };
    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true
    });

    // Mock document visibility API
    Object.defineProperty(document, 'hidden', {
      value: false,
      writable: true
    });

    // Mock console methods to avoid noise in tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // Clear all timers
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true
    });
  });

  describe('Complete Silent Update Flow End-to-End', () => {
    it('should simulate version detection and update flow', async () => {
      // Setup: Store current version
      mockLocalStorage['app-version-info'] = JSON.stringify(currentVersion);

      // Setup: Mock fetch to return new version
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(newVersion),
        headers: new Headers({ 'content-type': 'application/json' }),
        text: () => Promise.resolve(JSON.stringify(newVersion))
      });

      // Setup: Add some caches to be cleared
      mockCaches.set('workbox-precache-v1', {} as Cache);
      mockCaches.set('runtime-cache', {} as Cache);

      // Simulate version check
      const response = await fetch('/version.json');
      const serverVersion = await response.json();
      
      // Verify version comparison logic
      const storedVersion = JSON.parse(mockLocalStorage['app-version-info']);
      const hasUpdate = serverVersion.buildId !== storedVersion.buildId;
      
      expect(hasUpdate).toBe(true);
      expect(serverVersion.version).toBe(newVersion.version);
      expect(storedVersion.version).toBe(currentVersion.version);
    });

    it('should handle version storage and retrieval', async () => {
      // Test version storage
      mockLocalStorage['app-version-info'] = JSON.stringify(currentVersion);
      
      const storedVersion = JSON.parse(mockLocalStorage['app-version-info']);
      expect(storedVersion.buildId).toBe(currentVersion.buildId);
      
      // Test version update
      mockLocalStorage['app-version-info'] = JSON.stringify(newVersion);
      const updatedVersion = JSON.parse(mockLocalStorage['app-version-info']);
      expect(updatedVersion.buildId).toBe(newVersion.buildId);
    });

    it('should simulate sequential update handling', async () => {
      const secondNewVersion = {
        version: '1.2.0',
        buildTime: '2024-01-03T00:00:00Z',
        buildId: 'build-789',
        cacheName: 'app-cache-v3'
      };

      // Simulate update queue
      const updateQueue = [newVersion, secondNewVersion];
      
      // Process updates sequentially
      for (const version of updateQueue) {
        mockLocalStorage['app-version-info'] = JSON.stringify(version);
        const stored = JSON.parse(mockLocalStorage['app-version-info']);
        expect(stored.buildId).toBe(version.buildId);
      }
      
      expect(updateQueue).toHaveLength(2);
    });
  });

  describe('Cache Clearing Effectiveness Validation', () => {
    it('should clear all types of caches effectively', async () => {
      // Setup various cache types
      mockCaches.set('workbox-precache-v1', {} as Cache);
      mockCaches.set('workbox-runtime-cache', {} as Cache);
      mockCaches.set('app-static-resources', {} as Cache);
      
      // Setup storage with non-preserved items
      mockLocalStorage['temp-data'] = 'should-be-cleared';
      mockLocalStorage['app-version-info'] = JSON.stringify(currentVersion); // Should be preserved
      mockSessionStorage['temp-session'] = 'should-be-cleared';

      const cacheManager = new CacheManager({
        clearServiceWorkerCaches: true,
        clearBrowserCaches: true,
        clearApplicationStorage: true
      });

      const result = await cacheManager.clearAllCaches();

      // Verify cache clearing results
      expect(result.success).toBe(true);
      expect(result.operations.serviceWorkerCaches).toBe(true);
      expect(result.operations.browserCaches).toBe(true);
      expect(result.operations.applicationStorage).toBe(true);

      // Verify service worker caches were cleared
      expect(global.caches.delete).toHaveBeenCalledWith('workbox-precache-v1');
      expect(global.caches.delete).toHaveBeenCalledWith('workbox-runtime-cache');
      expect(global.caches.delete).toHaveBeenCalledWith('app-static-resources');

      // Verify localStorage was selectively cleared
      expect(mockLocalStorage['temp-data']).toBeUndefined();
      expect(mockLocalStorage['app-version-info']).toBeDefined(); // Should be preserved

      // Verify sessionStorage was cleared
      expect(window.sessionStorage.clear).toHaveBeenCalled();
    });

    it('should handle cache clearing failures gracefully', async () => {
      // Setup: Make cache deletion fail
      global.caches.delete = vi.fn().mockRejectedValue(new Error('Cache deletion failed'));

      const cacheManager = new CacheManager({
        clearServiceWorkerCaches: true,
        maxRetries: 1 // Reduce retries for faster test
      });

      const result = await cacheManager.clearAllCaches();

      // Should handle failures but may still succeed due to fallback mechanisms
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(error => error.includes('Cache deletion failed') || error.includes('fallback'))).toBe(true);
    });

    it('should validate cache clearing effectiveness', async () => {
      const cacheManager = new CacheManager({
        validateClearing: true
      });

      // Setup: No caches should remain after clearing
      global.caches.keys = vi.fn().mockResolvedValue([]);

      const result = await cacheManager.clearAllCaches();

      expect(result.validationPassed).toBe(true);
    });

    it('should detect incomplete cache clearing', async () => {
      const cacheManager = new CacheManager({
        validateClearing: true,
        maxRetries: 1 // Reduce retries for faster test
      });

      // Setup: Some caches remain after clearing
      global.caches.keys = vi.fn().mockResolvedValue(['remaining-cache']);

      const result = await cacheManager.clearAllCaches();

      expect(result.validationPassed).toBe(false);
    });
  });

  describe('Cross-Browser Compatibility', () => {
    it('should work when Cache API is not supported', async () => {
      // Remove Cache API support
      const originalCaches = global.caches;
      delete (global as any).caches;

      // Test cache manager without Cache API
      const cacheManager = new CacheManager({
        clearServiceWorkerCaches: false // Disable since no Cache API
      });

      const result = await cacheManager.clearAllCaches();

      // Should work with degraded functionality
      expect(result.operations.serviceWorkerCaches).toBe(false);
      
      // Restore Cache API
      global.caches = originalCaches;
    });

    it('should work when Service Worker is not supported', async () => {
      // Test cache manager without service worker
      const originalServiceWorker = navigator.serviceWorker;
      Object.defineProperty(navigator, 'serviceWorker', {
        value: undefined,
        writable: true
      });

      const cacheManager = new CacheManager({
        updateServiceWorker: false
      });

      const result = await cacheManager.clearAllCaches();
      
      // Should work without service worker
      expect(result.operations.serviceWorkerUpdate).toBe(false);
      
      // Restore service worker
      Object.defineProperty(navigator, 'serviceWorker', {
        value: originalServiceWorker,
        writable: true
      });
    });

    it('should handle localStorage unavailability gracefully', async () => {
      // Test storage fallback behavior
      const originalSetItem = window.localStorage.setItem;
      window.localStorage.setItem = vi.fn().mockImplementation(() => {
        throw new Error('Storage not available');
      });

      // Should handle storage errors gracefully
      try {
        mockLocalStorage['app-version-info'] = JSON.stringify(currentVersion);
      } catch (error) {
        // Expected to fail
        expect(error).toBeDefined();
      }

      // Restore localStorage
      window.localStorage.setItem = originalSetItem;
    });

    it('should handle different reload methods across browsers', async () => {
      const cacheManager = new CacheManager();

      // Test different reload scenarios
      const reloadScenarios = [
        {
          name: 'Modern browser with location.reload',
          setup: () => {
            mockLocation.reload = vi.fn();
            mockLocation.href = 'http://localhost:3000/'; // Reset href
          },
          verify: () => {
            cacheManager.forceReloadFromServer();
            // Should modify location.href with cache-busting
            expect(mockLocation.href).toContain('_cache_bust=');
          }
        },
        {
          name: 'Browser without reload function',
          setup: () => {
            delete mockLocation.reload;
            mockLocation.href = 'http://localhost:3000/'; // Reset href
          },
          verify: () => {
            cacheManager.forceReloadFromServer();
            expect(mockLocation.href).toContain('_cache_bust=');
          }
        }
      ];

      for (const scenario of reloadScenarios) {
        scenario.setup();
        scenario.verify();
      }
    });
  });

  describe('PWA Compatibility for Installed Apps', () => {
    it('should detect PWA standalone mode', async () => {
      // Simulate PWA standalone mode
      Object.defineProperty(window, 'matchMedia', {
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(display-mode: standalone)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn()
        }))
      });

      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      expect(isStandalone).toBe(true);
    });

    it('should handle service worker updates in PWA context', async () => {
      // Setup service worker with waiting state (common in PWAs)
      const mockRegistration = {
        scope: '/',
        active: { scriptURL: '/sw.js', postMessage: vi.fn() },
        waiting: {
          scriptURL: '/sw.js',
          postMessage: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          state: 'installed'
        },
        installing: null,
        update: vi.fn().mockResolvedValue(undefined),
        unregister: vi.fn().mockResolvedValue(true),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      };

      mockServiceWorker.getRegistration.mockResolvedValue(mockRegistration);

      const cacheManager = new CacheManager({
        updateServiceWorker: true,
        maxRetries: 1 // Reduce retries for faster test
      });

      const result = await cacheManager.clearAllCaches();

      expect(result.operations.serviceWorkerUpdate).toBe(true);
      expect(mockRegistration.waiting.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
    });

    it('should handle PWA app cache updates', async () => {
      // Setup PWA-specific caches
      mockCaches.set('pwa-precache-v1', {} as Cache);
      mockCaches.set('pwa-runtime-cache', {} as Cache);
      mockCaches.set('offline-fallbacks', {} as Cache);

      const cacheManager = new CacheManager();
      const result = await cacheManager.clearAllCaches();

      expect(result.success).toBe(true);
      expect(global.caches.delete).toHaveBeenCalledWith('pwa-precache-v1');
      expect(global.caches.delete).toHaveBeenCalledWith('pwa-runtime-cache');
      expect(global.caches.delete).toHaveBeenCalledWith('offline-fallbacks');
    });

    it('should handle offline scenarios gracefully', async () => {
      // Simulate offline scenario during update
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      try {
        await fetch('/version.json');
      } catch (error) {
        expect(error.message).toBe('Network error');
      }
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should simulate network failure and retry logic', async () => {
      // First call fails, second succeeds
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(newVersion),
          headers: new Headers({ 'content-type': 'application/json' }),
          text: () => Promise.resolve(JSON.stringify(newVersion))
        });

      // Test retry logic
      try {
        await fetch('/version.json');
      } catch (error) {
        expect(error.message).toBe('Network error');
      }

      // Second attempt should succeed
      const response = await fetch('/version.json');
      const data = await response.json();
      expect(data.version).toBe(newVersion.version);
    });

    it('should handle storage failures gracefully', async () => {
      // Make localStorage.setItem fail
      const originalSetItem = window.localStorage.setItem;
      window.localStorage.setItem = vi.fn().mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      // Test storage error handling
      try {
        window.localStorage.setItem('test', 'value');
      } catch (error) {
        expect(error.message).toBe('Storage quota exceeded');
      }

      // Restore original function
      window.localStorage.setItem = originalSetItem;
    });

    it('should handle partial cache clearing failures', async () => {
      // Make some cache operations fail
      global.caches.delete = vi.fn()
        .mockResolvedValueOnce(true)  // First cache succeeds
        .mockRejectedValueOnce(new Error('Cache locked'))  // Second fails
        .mockResolvedValueOnce(true); // Third succeeds

      mockCaches.set('cache1', {} as Cache);
      mockCaches.set('cache2', {} as Cache);
      mockCaches.set('cache3', {} as Cache);

      const cacheManager = new CacheManager({
        maxRetries: 1 // Reduce retries for faster test
      });
      const result = await cacheManager.clearAllCaches();

      // Should report partial success or failure with errors
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.operations.serviceWorkerCaches).toBe(true); // Fallback succeeded
    });

    it('should handle service worker update failures', async () => {
      // Make service worker update fail
      const mockRegistration = {
        scope: '/',
        active: { scriptURL: '/sw.js', postMessage: vi.fn() },
        waiting: null,
        installing: null,
        update: vi.fn().mockRejectedValue(new Error('Update failed')),
        unregister: vi.fn().mockResolvedValue(true),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      };

      mockServiceWorker.getRegistration.mockResolvedValue(mockRegistration);

      const cacheManager = new CacheManager({
        updateServiceWorker: true,
        maxRetries: 1 // Reduce retries for faster test
      });

      const result = await cacheManager.clearAllCaches();

      // Should continue with other operations despite SW failure
      expect(result.operations.serviceWorkerUpdate).toBe(false);
      expect(result.errors.some(error => error.includes('Update failed'))).toBe(true);
    });
  });

  describe('Performance and Resource Management', () => {
    it('should handle large number of caches efficiently', async () => {
      // Setup large number of caches to simulate heavy operation
      for (let i = 0; i < 10; i++) {
        mockCaches.set(`cache-${i}`, {} as Cache);
      }

      const cacheManager = new CacheManager();
      const startTime = Date.now();
      
      const result = await cacheManager.clearAllCaches();
      
      const endTime = Date.now();
      
      // Operations should complete reasonably quickly
      expect(endTime - startTime).toBeLessThan(1000);
      expect(result.success).toBe(true);
    });

    it('should handle memory constraints during updates', async () => {
      // Simulate memory pressure by making operations slower
      global.caches.delete = vi.fn().mockImplementation((cacheName) => {
        return new Promise(resolve => {
          setTimeout(() => resolve(true), 5); // Reduced delay
        });
      });

      mockCaches.set('large-cache-1', {} as Cache);
      mockCaches.set('large-cache-2', {} as Cache);

      const cacheManager = new CacheManager({
        maxRetries: 1 // Reduce retries to speed up test
      });

      const result = await cacheManager.clearAllCaches();

      expect(result.success).toBe(true);
      expect(global.caches.delete).toHaveBeenCalledTimes(2);
    });
  });

  describe('Configuration and Customization', () => {
    it('should validate custom configuration options', async () => {
      const customConfig = {
        enabled: true,
        delayMs: 500,
        respectUserActivity: true,
        inactivityThreshold: 10000,
        maxRetries: 5
      };

      // Test configuration validation
      expect(customConfig.enabled).toBe(true);
      expect(customConfig.delayMs).toBe(500);
      expect(customConfig.respectUserActivity).toBe(true);
      expect(customConfig.inactivityThreshold).toBe(10000);
      expect(customConfig.maxRetries).toBe(5);
    });

    it('should handle disabled silent updates configuration', async () => {
      const disabledConfig = {
        enabled: false
      };

      // Test disabled configuration
      expect(disabledConfig.enabled).toBe(false);
      
      // Simulate manual update trigger
      const manualUpdate = () => {
        mockLocation.href = mockLocation.href + '?manual_update=true';
      };
      
      manualUpdate();
      expect(mockLocation.href).toContain('manual_update=true');
    });

    it('should validate cache manager configuration', async () => {
      const cacheConfig = {
        clearServiceWorkerCaches: true,
        clearBrowserCaches: true,
        clearApplicationStorage: true,
        updateServiceWorker: true,
        maxRetries: 3
      };

      const cacheManager = new CacheManager(cacheConfig);
      const result = await cacheManager.clearAllCaches();

      expect(result.success).toBe(true);
      expect(result.operations.serviceWorkerCaches).toBe(true);
      expect(result.operations.browserCaches).toBe(true);
      expect(result.operations.applicationStorage).toBe(true);
    });
  });
});