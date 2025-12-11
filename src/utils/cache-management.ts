/**
 * Comprehensive cache management utilities for silent app updates
 * 
 * This module provides utilities for:
 * - Service worker cache management
 * - Browser storage clearing
 * - Cache validation
 * - Forced page reloads with cache bypassing
 */

/**
 * Configuration for cache management operations
 */
export interface CacheConfig {
    clearServiceWorkerCaches: boolean;
    clearBrowserCaches: boolean;
    clearApplicationStorage: boolean;
    updateServiceWorker: boolean;
    forceReload: boolean;
    validateClearing: boolean;
    maxRetries: number;
    retryDelayMs: number;
}

/**
 * Default cache management configuration
 */
export const DEFAULT_CACHE_CONFIG: CacheConfig = {
    clearServiceWorkerCaches: true,
    clearBrowserCaches: true,
    clearApplicationStorage: true,
    updateServiceWorker: true,
    forceReload: true,
    validateClearing: false, // Performance consideration
    maxRetries: 3,
    retryDelayMs: 1000
};

/**
 * Result of cache clearing operations
 */
export interface CacheOperationResult {
    success: boolean;
    operations: {
        serviceWorkerCaches: boolean;
        browserCaches: boolean;
        applicationStorage: boolean;
        serviceWorkerUpdate: boolean;
    };
    errors: string[];
    validationPassed?: boolean;
}

/**
 * Storage keys that should be preserved during cache clearing
 */
const PRESERVED_STORAGE_KEYS = [
    'app-version-info',
    'user-preferences',
    'auth-token',
    'user-session'
];

/**
 * Comprehensive cache clearing utility
 */
export class CacheManager {
    private config: CacheConfig;

    constructor(config: Partial<CacheConfig> = {}) {
        this.config = { ...DEFAULT_CACHE_CONFIG, ...config };
    }

    /**
     * Execute all cache clearing operations with comprehensive error handling and fallbacks
     */
    public async clearAllCaches(): Promise<CacheOperationResult> {
        const result: CacheOperationResult = {
            success: true,
            operations: {
                serviceWorkerCaches: false,
                browserCaches: false,
                applicationStorage: false,
                serviceWorkerUpdate: false
            },
            errors: []
        };

        let criticalFailures = 0;
        const maxCriticalFailures = 2; // Allow some failures before considering it critical

        // Execute operations based on configuration with enhanced error handling
        if (this.config.clearServiceWorkerCaches) {
            try {
                await this.clearServiceWorkerCaches();
                result.operations.serviceWorkerCaches = true;
            } catch (error) {
                const errorMsg = `Service Worker cache clearing failed: ${error}`;
                result.errors.push(errorMsg);
                console.warn(errorMsg);
                
                // Try fallback approach
                try {
                    await this.fallbackServiceWorkerCacheClearing();
                    result.operations.serviceWorkerCaches = true;
                    result.errors.push('Service Worker cache clearing succeeded with fallback method');
                } catch (fallbackError) {
                    criticalFailures++;
                    result.errors.push(`Service Worker cache fallback also failed: ${fallbackError}`);
                }
            }
        }

        if (this.config.clearBrowserCaches) {
            try {
                await this.clearBrowserCaches();
                result.operations.browserCaches = true;
            } catch (error) {
                const errorMsg = `Browser cache clearing failed: ${error}`;
                result.errors.push(errorMsg);
                console.warn(errorMsg);
                
                // Try individual fallback operations
                try {
                    await this.fallbackBrowserCacheClearing();
                    result.operations.browserCaches = true;
                    result.errors.push('Browser cache clearing succeeded with fallback methods');
                } catch (fallbackError) {
                    criticalFailures++;
                    result.errors.push(`Browser cache fallback also failed: ${fallbackError}`);
                }
            }
        }

        if (this.config.clearApplicationStorage) {
            try {
                await this.clearApplicationStorage();
                result.operations.applicationStorage = true;
            } catch (error) {
                const errorMsg = `Application storage clearing failed: ${error}`;
                result.errors.push(errorMsg);
                console.warn(errorMsg);
                
                // Application storage is less critical, continue
                result.operations.applicationStorage = false;
            }
        }

        if (this.config.updateServiceWorker) {
            try {
                await this.updateServiceWorker();
                result.operations.serviceWorkerUpdate = true;
            } catch (error) {
                const errorMsg = `Service Worker update failed: ${error}`;
                result.errors.push(errorMsg);
                console.warn(errorMsg);
                
                // Try fallback service worker handling
                try {
                    await this.fallbackServiceWorkerUpdate();
                    result.operations.serviceWorkerUpdate = true;
                    result.errors.push('Service Worker update succeeded with fallback method');
                } catch (fallbackError) {
                    // Service worker update failure is not critical for cache clearing
                    result.errors.push(`Service Worker update fallback also failed: ${fallbackError}`);
                }
            }
        }

        // Determine overall success based on critical operations
        result.success = criticalFailures < maxCriticalFailures;
        
        if (!result.success) {
            console.error('Cache clearing had critical failures:', result.errors);
        } else if (result.errors.length > 0) {
            console.warn('Cache clearing completed with some issues:', result.errors);
        }

        // Validate cache clearing if requested
        if (this.config.validateClearing) {
            try {
                result.validationPassed = await this.validateCacheClearing();
            } catch (error) {
                result.errors.push(`Cache validation failed: ${error}`);
            }
        }

        return result;
    }

    /**
     * Enhanced fallback method for service worker cache clearing with comprehensive error recovery
     */
    private async fallbackServiceWorkerCacheClearing(): Promise<void> {
        if (!('caches' in window)) {
            throw new Error('Cache API not supported in fallback');
        }

        try {
            // Enhanced cache clearing with multiple strategies
            const cacheNames = await caches.keys();
            console.log(`Attempting fallback cache clearing for ${cacheNames.length} caches:`, cacheNames);
            
            if (cacheNames.length === 0) {
                console.log('No caches found to clear in fallback mode');
                return;
            }

            // Strategy 1: Try parallel deletion with individual error handling
            const parallelResults = await Promise.allSettled(
                cacheNames.map(async (cacheName) => {
                    try {
                        const deleted = await caches.delete(cacheName);
                        if (deleted) {
                            console.log(`Successfully deleted cache in fallback: ${cacheName}`);
                        } else {
                            console.warn(`Cache deletion returned false for: ${cacheName}`);
                        }
                        return { cacheName, deleted, error: null };
                    } catch (error) {
                        console.warn(`Error deleting cache ${cacheName} in parallel fallback:`, error);
                        return { cacheName, deleted: false, error };
                    }
                })
            );

            const parallelSuccessCount = parallelResults.filter(r => 
                r.status === 'fulfilled' && r.value.deleted
            ).length;

            // Strategy 2: If parallel approach had failures, try sequential deletion
            if (parallelSuccessCount < cacheNames.length) {
                console.log(`Parallel deletion only cleared ${parallelSuccessCount}/${cacheNames.length} caches, trying sequential approach`);
                
                const failedCaches = parallelResults
                    .filter(r => r.status === 'fulfilled' && !r.value.deleted)
                    .map(r => (r as any).value.cacheName);

                let sequentialSuccessCount = 0;
                for (const cacheName of failedCaches) {
                    try {
                        // Add delay between sequential attempts to avoid overwhelming the system
                        await new Promise(resolve => setTimeout(resolve, 100));
                        
                        const deleted = await caches.delete(cacheName);
                        if (deleted) {
                            sequentialSuccessCount++;
                            console.log(`Sequential deletion succeeded for: ${cacheName}`);
                        } else {
                            console.warn(`Sequential deletion also failed for: ${cacheName}`);
                        }
                    } catch (error) {
                        console.warn(`Sequential deletion error for ${cacheName}:`, error);
                    }
                }

                const totalSuccessCount = parallelSuccessCount + sequentialSuccessCount;
                console.log(`Fallback cache clearing final result: ${totalSuccessCount}/${cacheNames.length} caches cleared`);
                
                // Strategy 3: If still having issues, try cache.keys() and manual cleanup
                if (totalSuccessCount < cacheNames.length * 0.5) { // Less than 50% success
                    console.log('Attempting manual cache cleanup as final fallback');
                    await this.manualCacheCleanup(cacheNames);
                }
                
                // Accept partial success - don't fail completely if we cleared some caches
                if (totalSuccessCount === 0) {
                    throw new Error('No caches could be cleared in any fallback mode');
                }
            } else {
                console.log(`Fallback cache clearing successful: ${parallelSuccessCount}/${cacheNames.length} caches cleared`);
            }
        } catch (error) {
            // Final fallback - try to at least clear the main app cache
            try {
                console.log('Attempting emergency cache clearing for critical caches');
                await this.emergencyCacheClearing();
            } catch (emergencyError) {
                console.error('Emergency cache clearing also failed:', emergencyError);
            }
            
            throw new Error(`Fallback service worker cache clearing failed: ${error}`);
        }
    }

    /**
     * Manual cache cleanup for stubborn caches
     */
    private async manualCacheCleanup(cacheNames: string[]): Promise<void> {
        for (const cacheName of cacheNames) {
            try {
                const cache = await caches.open(cacheName);
                const requests = await cache.keys();
                
                // Try to delete individual entries
                const deletePromises = requests.map(request => 
                    cache.delete(request).catch(error => {
                        console.warn(`Failed to delete cache entry for ${request.url}:`, error);
                        return false;
                    })
                );
                
                await Promise.allSettled(deletePromises);
                console.log(`Manual cleanup attempted for cache: ${cacheName} (${requests.length} entries)`);
            } catch (error) {
                console.warn(`Manual cleanup failed for cache ${cacheName}:`, error);
            }
        }
    }

    /**
     * Emergency cache clearing for critical application caches
     */
    private async emergencyCacheClearing(): Promise<void> {
        const criticalCachePatterns = [
            'workbox-precache',
            'runtime-cache',
            'app-cache',
            'static-resources'
        ];

        const allCaches = await caches.keys();
        const criticalCaches = allCaches.filter(cacheName => 
            criticalCachePatterns.some(pattern => cacheName.includes(pattern))
        );

        if (criticalCaches.length === 0) {
            console.log('No critical caches found for emergency clearing');
            return;
        }

        console.log(`Attempting emergency clearing of ${criticalCaches.length} critical caches`);
        
        for (const cacheName of criticalCaches) {
            try {
                await caches.delete(cacheName);
                console.log(`Emergency cleared critical cache: ${cacheName}`);
            } catch (error) {
                console.warn(`Emergency clearing failed for ${cacheName}:`, error);
            }
        }
    }

    /**
     * Fallback method for browser cache clearing
     */
    private async fallbackBrowserCacheClearing(): Promise<void> {
        const operations = [
            { name: 'sessionStorage', fn: () => this.fallbackClearSessionStorage() },
            { name: 'localStorage', fn: () => this.fallbackClearLocalStorage() },
            { name: 'indexedDB', fn: () => this.fallbackClearIndexedDB() }
        ];

        let successCount = 0;
        const errors: string[] = [];

        for (const operation of operations) {
            try {
                await operation.fn();
                successCount++;
            } catch (error) {
                errors.push(`${operation.name}: ${error}`);
                console.warn(`Fallback ${operation.name} clearing failed:`, error);
            }
        }

        if (successCount === 0) {
            throw new Error(`All fallback browser cache operations failed: ${errors.join(', ')}`);
        }

        console.log(`Fallback browser cache clearing: ${successCount}/${operations.length} operations succeeded`);
    }

    /**
     * Fallback session storage clearing
     */
    private async fallbackClearSessionStorage(): Promise<void> {
        if (!('sessionStorage' in window)) return;

        try {
            // Try to clear non-essential items first
            const keysToTry = [];
            for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);
                if (key && !PRESERVED_STORAGE_KEYS.includes(key)) {
                    keysToTry.push(key);
                }
            }

            keysToTry.forEach(key => {
                try {
                    sessionStorage.removeItem(key);
                } catch (error) {
                    console.warn(`Failed to remove sessionStorage key ${key}:`, error);
                }
            });
        } catch (error) {
            throw new Error(`Fallback session storage clearing failed: ${error}`);
        }
    }

    /**
     * Fallback local storage clearing
     */
    private async fallbackClearLocalStorage(): Promise<void> {
        if (!('localStorage' in window)) return;

        try {
            const keysToRemove: string[] = [];
            
            // Collect keys to remove
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && !PRESERVED_STORAGE_KEYS.includes(key)) {
                    keysToRemove.push(key);
                }
            }

            // Remove keys individually with error handling
            let removedCount = 0;
            keysToRemove.forEach(key => {
                try {
                    localStorage.removeItem(key);
                    removedCount++;
                } catch (error) {
                    console.warn(`Failed to remove localStorage key ${key}:`, error);
                }
            });

            console.log(`Fallback localStorage clearing: ${removedCount}/${keysToRemove.length} items removed`);
        } catch (error) {
            throw new Error(`Fallback local storage clearing failed: ${error}`);
        }
    }

    /**
     * Fallback IndexedDB clearing
     */
    private async fallbackClearIndexedDB(): Promise<void> {
        if (!('indexedDB' in window)) return;

        try {
            // Simple approach - just try to clear what we can
            console.log('Attempting fallback IndexedDB clearing (limited functionality)');
            // In fallback mode, we can't do much with IndexedDB without knowing database names
            // This is mainly a placeholder for future enhancement
        } catch (error) {
            console.warn('Fallback IndexedDB clearing failed:', error);
            // Don't throw - IndexedDB clearing is not critical
        }
    }

    /**
     * Enhanced fallback service worker update with comprehensive error recovery
     */
    private async fallbackServiceWorkerUpdate(): Promise<void> {
        if (!('serviceWorker' in navigator)) {
            throw new Error('Service Worker not supported in fallback');
        }

        try {
            // Strategy 1: Try to get registration with multiple approaches
            let registration: ServiceWorkerRegistration | undefined;
            
            try {
                registration = await navigator.serviceWorker.getRegistration();
            } catch (registrationError) {
                console.warn('Primary registration lookup failed, trying alternative approaches:', registrationError);
                
                // Try getting registration with specific scope
                try {
                    registration = await navigator.serviceWorker.getRegistration('/');
                } catch (scopeError) {
                    console.warn('Scoped registration lookup also failed:', scopeError);
                    
                    // Try getting all registrations and pick the first one
                    try {
                        const registrations = await navigator.serviceWorker.getRegistrations();
                        if (registrations.length > 0) {
                            registration = registrations[0];
                            console.log(`Found registration via getRegistrations: ${registration.scope}`);
                        }
                    } catch (allRegistrationsError) {
                        console.warn('All registration lookup methods failed:', allRegistrationsError);
                    }
                }
            }

            if (!registration) {
                console.warn('No service worker registration found in any fallback method');
                return;
            }

            // Strategy 2: Enhanced update with multiple retry approaches
            const updateStrategies = [
                {
                    name: 'standard update',
                    fn: () => registration!.update()
                },
                {
                    name: 'forced update with unregister/register',
                    fn: async () => {
                        const scope = registration!.scope;
                        const scriptURL = registration!.active?.scriptURL;
                        
                        if (scriptURL) {
                            await registration!.unregister();
                            await navigator.serviceWorker.register(scriptURL, { scope });
                        } else {
                            throw new Error('No script URL available for re-registration');
                        }
                    }
                },
                {
                    name: 'soft update with postMessage',
                    fn: async () => {
                        if (registration!.active) {
                            registration!.active.postMessage({ type: 'FORCE_UPDATE' });
                        }
                        await registration!.update();
                    }
                }
            ];

            let updateSucceeded = false;
            let lastUpdateError: Error | null = null;

            for (const strategy of updateStrategies) {
                try {
                    console.log(`Attempting service worker update using: ${strategy.name}`);
                    await strategy.fn();
                    updateSucceeded = true;
                    console.log(`Fallback service worker update succeeded using: ${strategy.name}`);
                    break;
                } catch (strategyError) {
                    lastUpdateError = strategyError instanceof Error ? strategyError : new Error(String(strategyError));
                    console.warn(`Service worker update strategy '${strategy.name}' failed:`, strategyError);
                    
                    // Add delay between strategies to avoid overwhelming the system
                    if (strategy !== updateStrategies[updateStrategies.length - 1]) {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                }
            }

            if (!updateSucceeded) {
                throw new Error(`All service worker update strategies failed. Last error: ${lastUpdateError?.message}`);
            }

            // Strategy 3: Enhanced activation handling with timeout and fallbacks
            try {
                await this.enhancedServiceWorkerActivation(registration);
            } catch (activationError) {
                console.warn('Service worker activation had issues, but update succeeded:', activationError);
                // Don't throw - the update itself succeeded
            }

        } catch (error) {
            // Final fallback - try to at least clear service worker caches
            try {
                console.log('Service worker update failed, attempting cache-only recovery');
                await this.serviceWorkerCacheRecovery();
            } catch (recoveryError) {
                console.warn('Service worker cache recovery also failed:', recoveryError);
            }
            
            throw new Error(`Fallback service worker update failed: ${error}`);
        }
    }

    /**
     * Enhanced service worker activation with comprehensive error handling
     */
    private async enhancedServiceWorkerActivation(registration: ServiceWorkerRegistration): Promise<void> {
        return new Promise<void>((resolve) => {
            const timeout = setTimeout(() => {
                cleanup();
                console.log('Service worker activation timeout - continuing anyway');
                resolve(); // Don't reject - activation timeout is not critical
            }, 12000); // Increased timeout

            const cleanup = () => {
                clearTimeout(timeout);
                try {
                    navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
                    if (registration.waiting) {
                        registration.waiting.removeEventListener('statechange', handleStateChange);
                    }
                    if (registration.installing) {
                        registration.installing.removeEventListener('statechange', handleStateChange);
                    }
                } catch (cleanupError) {
                    console.warn('Error during activation cleanup:', cleanupError);
                }
            };

            const handleControllerChange = () => {
                cleanup();
                console.log('Service worker controller changed - activation successful');
                resolve();
            };

            const handleStateChange = (event: Event) => {
                const sw = event.target as ServiceWorker;
                console.log(`Service worker state changed to: ${sw.state}`);
                
                if (sw.state === 'activated') {
                    cleanup();
                    console.log('Service worker activated successfully');
                    resolve();
                } else if (sw.state === 'redundant') {
                    cleanup();
                    console.warn('Service worker became redundant during activation');
                    resolve();
                }
            };

            try {
                navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
                
                // Handle both waiting and installing service workers
                if (registration.waiting) {
                    registration.waiting.addEventListener('statechange', handleStateChange);
                    
                    // Try multiple activation methods
                    const activationMethods = [
                        () => registration.waiting?.postMessage({ type: 'SKIP_WAITING' }),
                        () => registration.waiting?.postMessage('skipWaiting'),
                        () => registration.waiting?.postMessage({ command: 'skipWaiting' })
                    ];

                    for (const method of activationMethods) {
                        try {
                            method();
                            break; // If one succeeds, stop trying others
                        } catch (methodError) {
                            console.warn('Activation method failed:', methodError);
                        }
                    }
                } else if (registration.installing) {
                    registration.installing.addEventListener('statechange', handleStateChange);
                } else {
                    cleanup();
                    resolve();
                }
            } catch (error) {
                cleanup();
                console.warn('Service worker activation setup failed:', error);
                resolve(); // Don't reject - continue with degraded functionality
            }
        });
    }

    /**
     * Service worker cache recovery when update fails
     */
    private async serviceWorkerCacheRecovery(): Promise<void> {
        try {
            // Try to clear service worker related caches as a recovery mechanism
            const allCaches = await caches.keys();
            const swCaches = allCaches.filter(name => 
                name.includes('workbox') || 
                name.includes('sw-') || 
                name.includes('service-worker')
            );

            if (swCaches.length > 0) {
                console.log(`Attempting recovery by clearing ${swCaches.length} service worker caches`);
                
                const deletePromises = swCaches.map(cacheName => 
                    caches.delete(cacheName).catch(error => {
                        console.warn(`Failed to delete SW cache ${cacheName}:`, error);
                        return false;
                    })
                );

                await Promise.allSettled(deletePromises);
                console.log('Service worker cache recovery completed');
            }
        } catch (error) {
            console.warn('Service worker cache recovery failed:', error);
        }
    }

    /**
     * Clear all service worker caches
     */
    public async clearServiceWorkerCaches(): Promise<void> {
        if (!('caches' in window)) {
            throw new Error('Cache API not supported');
        }

        return this.retryOperation(async () => {
            const cacheNames = await caches.keys();
            console.log('Clearing service worker caches:', cacheNames);
            
            const deletePromises = cacheNames.map(async (cacheName) => {
                const deleted = await caches.delete(cacheName);
                if (!deleted) {
                    throw new Error(`Failed to delete cache: ${cacheName}`);
                }
                return deleted;
            });

            await Promise.all(deletePromises);
            console.log('All service worker caches cleared successfully');
        }, 'Service Worker cache clearing');
    }

    /**
     * Clear browser caches and storage
     */
    public async clearBrowserCaches(): Promise<void> {
        return this.retryOperation(async () => {
            const operations = [
                () => this.clearSessionStorage(),
                () => this.clearIndexedDB(),
                () => this.clearLocalStorageSelectively()
            ];

            await Promise.all(operations.map(op => op().catch(error => {
                console.warn('Browser cache operation failed:', error);
                // Don't throw - some operations may fail in certain browsers
            })));

            console.log('Browser caches cleared successfully');
        }, 'Browser cache clearing');
    }

    /**
     * Clear session storage (preserving important data)
     */
    private async clearSessionStorage(): Promise<void> {
        if (!('sessionStorage' in window)) return;

        try {
            // Preserve important session data
            const preservedData: Record<string, string> = {};
            PRESERVED_STORAGE_KEYS.forEach(key => {
                const value = sessionStorage.getItem(key);
                if (value) {
                    preservedData[key] = value;
                }
            });

            sessionStorage.clear();

            // Restore preserved data
            Object.entries(preservedData).forEach(([key, value]) => {
                sessionStorage.setItem(key, value);
            });

            console.log('Session storage cleared and preserved data restored');
        } catch (error) {
            throw new Error(`Session storage clearing failed: ${error}`);
        }
    }

    /**
     * Clear local storage selectively (preserving important data)
     */
    private async clearLocalStorageSelectively(): Promise<void> {
        if (!('localStorage' in window)) return;

        try {
            const keysToRemove: string[] = [];
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && !PRESERVED_STORAGE_KEYS.includes(key)) {
                    keysToRemove.push(key);
                }
            }

            keysToRemove.forEach(key => {
                localStorage.removeItem(key);
            });

            console.log(`Local storage cleared: ${keysToRemove.length} items removed`);
        } catch (error) {
            throw new Error(`Local storage clearing failed: ${error}`);
        }
    }

    /**
     * Clear IndexedDB databases
     */
    private async clearIndexedDB(): Promise<void> {
        if (!('indexedDB' in window)) return;

        try {
            // Get list of databases if supported
            if ('databases' in indexedDB) {
                const databases = await indexedDB.databases();
                const deletePromises = databases.map(db => {
                    if (db.name) {
                        return this.deleteIndexedDatabase(db.name);
                    }
                    return Promise.resolve();
                });

                await Promise.all(deletePromises);
                console.log('IndexedDB databases cleared');
            }
        } catch (error) {
            console.warn('IndexedDB clearing failed:', error);
            // Don't throw - this is not critical
        }
    }

    /**
     * Delete a specific IndexedDB database
     */
    private deleteIndexedDatabase(name: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const deleteReq = indexedDB.deleteDatabase(name);
            deleteReq.onsuccess = () => resolve();
            deleteReq.onerror = () => reject(deleteReq.error);
            deleteReq.onblocked = () => {
                console.warn(`IndexedDB deletion blocked for: ${name}`);
                // Resolve anyway - we tried our best
                resolve();
            };
        });
    }

    /**
     * Clear application-specific storage and caches
     */
    public async clearApplicationStorage(): Promise<void> {
        try {
            // Clear any global application caches
            if (typeof window !== 'undefined') {
                // Clear route preload cache if it exists
                if ((window as any).routeCache) {
                    (window as any).routeCache.clear();
                }

                // Clear any other application-specific caches
                if ((window as any).appCache) {
                    (window as any).appCache.clear();
                }

                // Clear component cache if it exists
                if ((window as any).componentCache) {
                    (window as any).componentCache.clear();
                }
            }

            console.log('Application storage cleared');
        } catch (error) {
            throw new Error(`Application storage clearing failed: ${error}`);
        }
    }

    /**
     * Update and activate new service worker with comprehensive error handling
     */
    public async updateServiceWorker(): Promise<void> {
        if (!('serviceWorker' in navigator)) {
            console.warn('Service Worker not supported');
            return;
        }

        return this.retryOperation(async () => {
            let registration: ServiceWorkerRegistration | undefined;
            
            try {
                registration = await navigator.serviceWorker.getRegistration();
            } catch (error) {
                throw new Error(`Failed to get service worker registration: ${error}`);
            }

            if (!registration) {
                console.warn('No service worker registration found');
                return;
            }

            // Check if service worker is in a valid state
            if (registration.unregistering) {
                throw new Error('Service worker is currently unregistering');
            }

            try {
                // Force update the service worker with timeout
                const updatePromise = registration.update();
                const timeoutPromise = new Promise<never>((_, reject) => {
                    setTimeout(() => reject(new Error('Service worker update timeout')), 10000);
                });
                
                await Promise.race([updatePromise, timeoutPromise]);
                console.log('Service worker update initiated successfully');
            } catch (error) {
                throw new Error(`Service worker update failed: ${error}`);
            }
            
            // Handle waiting service worker activation
            if (registration.waiting) {
                try {
                    await this.activateWaitingServiceWorker(registration);
                } catch (error) {
                    console.warn('Failed to activate waiting service worker:', error);
                    // Don't throw - the update itself succeeded
                }
            } else if (registration.installing) {
                try {
                    await this.waitForServiceWorkerInstallation(registration);
                } catch (error) {
                    console.warn('Failed to wait for service worker installation:', error);
                    // Don't throw - the update itself succeeded
                }
            }

            console.log('Service worker updated successfully');
        }, 'Service Worker update');
    }

    /**
     * Activate waiting service worker with error handling
     */
    private async activateWaitingServiceWorker(registration: ServiceWorkerRegistration): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
                cleanup();
                resolve(); // Don't reject - activation timeout is not critical
            }, 8000);

            const cleanup = () => {
                clearTimeout(timeout);
                navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
                if (registration.waiting) {
                    registration.waiting.removeEventListener('statechange', handleStateChange);
                }
            };

            const handleControllerChange = () => {
                cleanup();
                console.log('Service worker controller changed - activation successful');
                resolve();
            };

            const handleStateChange = () => {
                if (registration.waiting?.state === 'activated') {
                    cleanup();
                    console.log('Service worker activated successfully');
                    resolve();
                }
            };

            try {
                navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
                
                if (registration.waiting) {
                    registration.waiting.addEventListener('statechange', handleStateChange);
                    
                    // Try to skip waiting
                    try {
                        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                    } catch (error) {
                        console.warn('Failed to send SKIP_WAITING message:', error);
                        // Try alternative activation method
                        try {
                            registration.waiting.postMessage('skipWaiting');
                        } catch (altError) {
                            console.warn('Alternative activation message also failed:', altError);
                        }
                    }
                } else {
                    cleanup();
                    resolve();
                }
            } catch (error) {
                cleanup();
                reject(new Error(`Service worker activation setup failed: ${error}`));
            }
        });
    }

    /**
     * Wait for service worker installation to complete
     */
    private async waitForServiceWorkerInstallation(registration: ServiceWorkerRegistration): Promise<void> {
        return new Promise<void>((resolve) => {
            const timeout = setTimeout(() => {
                cleanup();
                resolve(); // Don't reject - installation timeout is not critical
            }, 10000);

            const cleanup = () => {
                clearTimeout(timeout);
                if (registration.installing) {
                    registration.installing.removeEventListener('statechange', handleStateChange);
                }
            };

            const handleStateChange = () => {
                const sw = registration.installing;
                if (sw?.state === 'installed' || sw?.state === 'activated') {
                    cleanup();
                    console.log('Service worker installation completed');
                    resolve();
                } else if (sw?.state === 'redundant') {
                    cleanup();
                    console.warn('Service worker became redundant during installation');
                    resolve();
                }
            };

            try {
                if (registration.installing) {
                    registration.installing.addEventListener('statechange', handleStateChange);
                } else {
                    cleanup();
                    resolve();
                }
            } catch (error) {
                cleanup();
                console.warn('Failed to set up service worker installation listener:', error);
                resolve();
            }
        });
    }

    /**
     * Force reload from server bypassing all caches with comprehensive error handling
     */
    public forceReloadFromServer(): void {
        const reloadMethods = [
            {
                name: 'location.reload(true)',
                fn: () => {
                    if (typeof (location as any).reload === 'function') {
                        // @ts-ignore - reload(true) is deprecated but still functional in some browsers
                        (location as any).reload(true);
                        return true;
                    }
                    return false;
                }
            },
            {
                name: 'cache-busting navigation',
                fn: () => {
                    const url = new URL(window.location.href);
                    url.searchParams.set('_cache_bust', Date.now().toString());
                    url.searchParams.set('_force_reload', '1');
                    url.searchParams.set('_method', 'cache_bust');
                    window.location.href = url.toString();
                    return true;
                }
            },
            {
                name: 'location.replace with cache-busting',
                fn: () => {
                    const url = new URL(window.location.href);
                    url.searchParams.set('_cache_bust', Date.now().toString());
                    url.searchParams.set('_method', 'replace');
                    window.location.replace(url.toString());
                    return true;
                }
            },
            {
                name: 'window.location.assign with cache-busting',
                fn: () => {
                    const url = new URL(window.location.href);
                    url.searchParams.set('_cache_bust', Date.now().toString());
                    url.searchParams.set('_method', 'assign');
                    window.location.assign(url.toString());
                    return true;
                }
            },
            {
                name: 'standard location.reload',
                fn: () => {
                    window.location.reload();
                    return true;
                }
            }
        ];

        for (const method of reloadMethods) {
            try {
                console.log(`Attempting force reload using: ${method.name}`);
                const success = method.fn();
                if (success) {
                    console.log(`Force reload initiated successfully using: ${method.name}`);
                    return;
                }
            } catch (error) {
                console.warn(`Force reload method '${method.name}' failed:`, error);
                continue;
            }
        }

        // If all methods fail, try one final approach
        try {
            console.error('All force reload methods failed, attempting final fallback');
            // Direct window.location assignment as last resort
            window.location.href = window.location.href + (window.location.href.includes('?') ? '&' : '?') + '_emergency_reload=' + Date.now();
        } catch (finalError) {
            console.error('Emergency reload also failed:', finalError);
            // At this point, we've exhausted all options
            alert('Unable to reload the page automatically. Please refresh manually (Ctrl+F5 or Cmd+Shift+R)');
        }
    }

    /**
     * Validate that caches were actually cleared
     */
    public async validateCacheClearing(): Promise<boolean> {
        try {
            let allClear = true;
            const issues: string[] = [];

            // Check service worker caches
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                if (cacheNames.length > 0) {
                    allClear = false;
                    issues.push(`Service worker caches still exist: ${cacheNames.join(', ')}`);
                }
            }

            // Check for excessive localStorage usage
            if ('localStorage' in window) {
                const nonPreservedKeys = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && !PRESERVED_STORAGE_KEYS.includes(key)) {
                        nonPreservedKeys.push(key);
                    }
                }
                if (nonPreservedKeys.length > 10) { // Arbitrary threshold
                    issues.push(`Many localStorage keys still exist: ${nonPreservedKeys.length} items`);
                }
            }

            if (allClear) {
                console.log('Cache clearing validation passed');
            } else {
                console.warn('Cache clearing validation issues:', issues);
            }
            
            return allClear;
        } catch (error) {
            console.error('Cache clearing validation failed:', error);
            return false;
        }
    }

    /**
     * Retry an operation with exponential backoff
     */
    private async retryOperation<T>(
        operation: () => Promise<T>,
        operationName: string
    ): Promise<T> {
        let lastError: Error | null = null;
        
        for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                console.warn(`${operationName} attempt ${attempt}/${this.config.maxRetries} failed:`, error);
                
                if (attempt < this.config.maxRetries) {
                    const delay = this.config.retryDelayMs * Math.pow(2, attempt - 1);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        
        throw lastError || new Error(`${operationName} failed after ${this.config.maxRetries} attempts`);
    }
}

/**
 * Convenience function to clear all caches with default configuration
 */
export async function clearAllCaches(config?: Partial<CacheConfig>): Promise<CacheOperationResult> {
    const manager = new CacheManager(config);
    return manager.clearAllCaches();
}

/**
 * Convenience function to force reload from server
 */
export function forceReloadFromServer(): void {
    const manager = new CacheManager();
    manager.forceReloadFromServer();
}

/**
 * Convenience function to validate cache clearing
 */
export async function validateCacheClearing(): Promise<boolean> {
    const manager = new CacheManager();
    return manager.validateCacheClearing();
}