/**
 * Tests for cache management utilities
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CacheManager, DEFAULT_CACHE_CONFIG } from './cache-management';

// Create a simple test environment
beforeEach(() => {
    vi.clearAllMocks();
});

describe('CacheManager', () => {
    it('should initialize with default configuration', () => {
        const manager = new CacheManager();
        expect(manager).toBeDefined();
    });

    it('should initialize with custom configuration', () => {
        const customConfig = {
            clearServiceWorkerCaches: false,
            maxRetries: 5
        };
        const manager = new CacheManager(customConfig);
        expect(manager).toBeDefined();
    });

    it('should handle missing cache API gracefully', async () => {
        const manager = new CacheManager();
        
        // Test without mocking - should handle missing APIs gracefully
        await expect(manager.clearServiceWorkerCaches()).rejects.toThrow('Cache API not supported');
    });

    it('should handle missing browser APIs gracefully', async () => {
        const manager = new CacheManager();
        
        // Test browser cache clearing without full browser environment
        await expect(manager.clearBrowserCaches()).resolves.not.toThrow();
    });

    it('should handle application storage clearing', async () => {
        const manager = new CacheManager();
        
        // Test application storage clearing
        await expect(manager.clearApplicationStorage()).resolves.not.toThrow();
    });

    it('should handle cache validation without cache API', async () => {
        const manager = new CacheManager();
        
        // Should return true when no cache API is available
        const result = await manager.validateCacheClearing();
        expect(typeof result).toBe('boolean');
    });

    it('should handle force reload', () => {
        const manager = new CacheManager();
        
        // Mock location.reload
        const mockReload = vi.fn();
        Object.defineProperty(global, 'location', {
            value: { reload: mockReload },
            writable: true
        });
        
        expect(() => manager.forceReloadFromServer()).not.toThrow();
    });

    it('should execute cache clearing operations with proper error handling', async () => {
        const manager = new CacheManager();
        
        const result = await manager.clearAllCaches();
        
        // Should return a result object
        expect(result).toBeDefined();
        expect(typeof result.success).toBe('boolean');
        expect(Array.isArray(result.errors)).toBe(true);
        expect(typeof result.operations).toBe('object');
    });
});

describe('Convenience functions', () => {
    it('should provide clearAllCaches convenience function', async () => {
        const { clearAllCaches } = await import('./cache-management');
        const result = await clearAllCaches();
        
        expect(result).toBeDefined();
        expect(typeof result.success).toBe('boolean');
    });

    it('should provide clearAllCaches with custom config', async () => {
        const { clearAllCaches } = await import('./cache-management');
        const customConfig = {
            clearServiceWorkerCaches: false
        };
        
        const result = await clearAllCaches(customConfig);
        
        expect(result).toBeDefined();
        expect(result.operations.serviceWorkerCaches).toBe(false);
    });

    it('should provide forceReloadFromServer convenience function', async () => {
        const { forceReloadFromServer } = await import('./cache-management');
        
        // Mock location.reload
        const mockReload = vi.fn();
        Object.defineProperty(global, 'location', {
            value: { reload: mockReload },
            writable: true
        });
        
        expect(() => forceReloadFromServer()).not.toThrow();
    });

    it('should provide validateCacheClearing convenience function', async () => {
        const { validateCacheClearing } = await import('./cache-management');
        const result = await validateCacheClearing();
        
        expect(typeof result).toBe('boolean');
    });
});

describe('Configuration', () => {
    it('should have correct default configuration', () => {
        expect(DEFAULT_CACHE_CONFIG.clearServiceWorkerCaches).toBe(true);
        expect(DEFAULT_CACHE_CONFIG.clearBrowserCaches).toBe(true);
        expect(DEFAULT_CACHE_CONFIG.clearApplicationStorage).toBe(true);
        expect(DEFAULT_CACHE_CONFIG.updateServiceWorker).toBe(true);
        expect(DEFAULT_CACHE_CONFIG.forceReload).toBe(true);
        expect(DEFAULT_CACHE_CONFIG.validateClearing).toBe(false);
        expect(DEFAULT_CACHE_CONFIG.maxRetries).toBe(3);
        expect(DEFAULT_CACHE_CONFIG.retryDelayMs).toBe(1000);
    });
});