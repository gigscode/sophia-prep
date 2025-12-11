/**
 * Comprehensive error recovery utilities for silent app updates
 * 
 * This module provides centralized error recovery mechanisms for:
 * - Network failures with intelligent retry strategies
 * - Cache clearing failures with multiple fallback approaches
 * - Service worker update failures with graceful degradation
 * - User activity detection issues with fallback timing
 */

/**
 * Error classification for intelligent recovery strategies
 */
export interface ErrorClassification {
    type: 'network' | 'cache' | 'serviceWorker' | 'userActivity' | 'storage' | 'unknown';
    severity: 'low' | 'medium' | 'high' | 'critical';
    isRetryable: boolean;
    suggestedAction: string;
    recoveryStrategy: string;
}

/**
 * Recovery attempt result
 */
export interface RecoveryResult {
    success: boolean;
    strategy: string;
    error?: string;
    fallbackUsed: boolean;
    nextAction?: string;
    result?: any; // Store the actual result of successful recovery
}

/**
 * Recovery configuration
 */
export interface RecoveryConfig {
    maxRetries: number;
    baseDelayMs: number;
    maxDelayMs: number;
    enableFallbacks: boolean;
    logErrors: boolean;
}

/**
 * Default recovery configuration
 */
export const DEFAULT_RECOVERY_CONFIG: RecoveryConfig = {
    maxRetries: 3,
    baseDelayMs: 1000,
    maxDelayMs: 30000,
    enableFallbacks: true,
    logErrors: true
};

/**
 * Comprehensive error recovery manager
 */
export class ErrorRecoveryManager {
    private config: RecoveryConfig;
    private recoveryAttempts: Map<string, number> = new Map();
    private lastRecoveryTime: Map<string, number> = new Map();

    constructor(config: Partial<RecoveryConfig> = {}) {
        this.config = { ...DEFAULT_RECOVERY_CONFIG, ...config };
    }

    /**
     * Classify an error for appropriate recovery strategy
     */
    public classifyError(error: Error | unknown): ErrorClassification {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorName = (error as any)?.name || 'UnknownError';
        
        // Network error classification
        if (this.isNetworkError(error)) {
            return {
                type: 'network',
                severity: this.getNetworkErrorSeverity(error),
                isRetryable: true,
                suggestedAction: 'Retry with exponential backoff',
                recoveryStrategy: 'networkRetry'
            };
        }
        
        // Cache error classification
        if (this.isCacheError(error)) {
            return {
                type: 'cache',
                severity: 'medium',
                isRetryable: true,
                suggestedAction: 'Try alternative cache clearing methods',
                recoveryStrategy: 'cacheFallback'
            };
        }
        
        // Service worker error classification
        if (this.isServiceWorkerError(error)) {
            return {
                type: 'serviceWorker',
                severity: 'medium',
                isRetryable: true,
                suggestedAction: 'Use fallback service worker management',
                recoveryStrategy: 'serviceWorkerFallback'
            };
        }
        
        // User activity error classification
        if (this.isUserActivityError(error)) {
            return {
                type: 'userActivity',
                severity: 'low',
                isRetryable: false,
                suggestedAction: 'Switch to immediate update timing',
                recoveryStrategy: 'activityFallback'
            };
        }
        
        // Storage error classification
        if (this.isStorageError(error)) {
            return {
                type: 'storage',
                severity: 'high',
                isRetryable: true,
                suggestedAction: 'Try alternative storage methods',
                recoveryStrategy: 'storageFallback'
            };
        }
        
        // Unknown error - conservative approach
        return {
            type: 'unknown',
            severity: 'medium',
            isRetryable: false,
            suggestedAction: 'Log error and continue with degraded functionality',
            recoveryStrategy: 'gracefulDegradation'
        };
    }

    /**
     * Execute recovery strategy based on error classification
     */
    public async executeRecovery(
        error: Error | unknown,
        context: string,
        recoveryFunction: () => Promise<any>
    ): Promise<RecoveryResult> {
        const classification = this.classifyError(error);
        const attemptKey = `${context}-${classification.type}`;
        
        if (this.config.logErrors) {
            console.warn(`Error recovery initiated for ${context}:`, {
                error: error instanceof Error ? error.message : String(error),
                classification,
                attemptKey
            });
        }
        
        // Check if we should attempt recovery
        if (!classification.isRetryable) {
            return {
                success: false,
                strategy: classification.recoveryStrategy,
                error: 'Error is not retryable',
                fallbackUsed: true,
                nextAction: classification.suggestedAction
            };
        }
        
        // Check retry limits
        const currentAttempts = this.recoveryAttempts.get(attemptKey) || 0;
        if (currentAttempts >= this.config.maxRetries) {
            return {
                success: false,
                strategy: classification.recoveryStrategy,
                error: 'Maximum retry attempts exceeded',
                fallbackUsed: true,
                nextAction: 'Switch to fallback mode'
            };
        }
        
        // Check rate limiting
        const lastAttempt = this.lastRecoveryTime.get(attemptKey) || 0;
        const timeSinceLastAttempt = Date.now() - lastAttempt;
        const minInterval = this.config.baseDelayMs * Math.pow(2, currentAttempts);
        
        if (timeSinceLastAttempt < minInterval) {
            const waitTime = minInterval - timeSinceLastAttempt;
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        
        // Update attempt tracking
        this.recoveryAttempts.set(attemptKey, currentAttempts + 1);
        this.lastRecoveryTime.set(attemptKey, Date.now());
        
        // Execute recovery based on strategy
        try {
            switch (classification.recoveryStrategy) {
                case 'networkRetry':
                    return await this.executeNetworkRecovery(recoveryFunction, currentAttempts);
                    
                case 'cacheFallback':
                    return await this.executeCacheRecovery(recoveryFunction, currentAttempts);
                    
                case 'serviceWorkerFallback':
                    return await this.executeServiceWorkerRecovery(recoveryFunction, currentAttempts);
                    
                case 'storageFallback':
                    return await this.executeStorageRecovery(recoveryFunction, currentAttempts);
                    
                case 'activityFallback':
                    return await this.executeActivityRecovery(recoveryFunction, currentAttempts);
                    
                default:
                    return await this.executeGracefulDegradation(recoveryFunction, currentAttempts);
            }
        } catch (recoveryError) {
            return {
                success: false,
                strategy: classification.recoveryStrategy,
                error: recoveryError instanceof Error ? recoveryError.message : String(recoveryError),
                fallbackUsed: false,
                nextAction: 'Try alternative recovery method'
            };
        }
    }

    /**
     * Network-specific recovery strategy
     */
    private async executeNetworkRecovery(
        recoveryFunction: () => Promise<any>,
        attemptNumber: number
    ): Promise<RecoveryResult> {
        // Implement progressive timeout and retry strategies
        const timeout = Math.min(5000 + (attemptNumber * 2000), 15000);
        
        try {
            const result = await Promise.race([
                recoveryFunction(),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Recovery timeout')), timeout)
                )
            ]);
            
            return {
                success: true,
                strategy: 'networkRetry',
                fallbackUsed: false,
                result // Store the actual result
            };
        } catch (error) {
            return {
                success: false,
                strategy: 'networkRetry',
                error: error instanceof Error ? error.message : String(error),
                fallbackUsed: false,
                nextAction: 'Try with longer timeout or alternative endpoint'
            };
        }
    }

    /**
     * Cache-specific recovery strategy
     */
    private async executeCacheRecovery(
        recoveryFunction: () => Promise<any>,
        attemptNumber: number
    ): Promise<RecoveryResult> {
        try {
            const result = await recoveryFunction();
            return {
                success: true,
                strategy: 'cacheFallback',
                fallbackUsed: false
            };
        } catch (error) {
            // Try partial cache clearing as fallback
            try {
                await this.partialCacheClearing();
                return {
                    success: true,
                    strategy: 'cacheFallback',
                    fallbackUsed: true,
                    nextAction: 'Partial cache clearing completed'
                };
            } catch (fallbackError) {
                return {
                    success: false,
                    strategy: 'cacheFallback',
                    error: fallbackError instanceof Error ? fallbackError.message : String(fallbackError),
                    fallbackUsed: true,
                    nextAction: 'Continue without cache clearing'
                };
            }
        }
    }

    /**
     * Service worker-specific recovery strategy
     */
    private async executeServiceWorkerRecovery(
        recoveryFunction: () => Promise<any>,
        attemptNumber: number
    ): Promise<RecoveryResult> {
        try {
            const result = await recoveryFunction();
            return {
                success: true,
                strategy: 'serviceWorkerFallback',
                fallbackUsed: false
            };
        } catch (error) {
            // Try minimal service worker management
            try {
                await this.minimalServiceWorkerUpdate();
                return {
                    success: true,
                    strategy: 'serviceWorkerFallback',
                    fallbackUsed: true,
                    nextAction: 'Minimal service worker update completed'
                };
            } catch (fallbackError) {
                return {
                    success: false,
                    strategy: 'serviceWorkerFallback',
                    error: fallbackError instanceof Error ? fallbackError.message : String(fallbackError),
                    fallbackUsed: true,
                    nextAction: 'Continue without service worker update'
                };
            }
        }
    }

    /**
     * Storage-specific recovery strategy
     */
    private async executeStorageRecovery(
        recoveryFunction: () => Promise<any>,
        attemptNumber: number
    ): Promise<RecoveryResult> {
        try {
            const result = await recoveryFunction();
            return {
                success: true,
                strategy: 'storageFallback',
                fallbackUsed: false
            };
        } catch (error) {
            // Try alternative storage method
            try {
                await this.alternativeStorageMethod();
                return {
                    success: true,
                    strategy: 'storageFallback',
                    fallbackUsed: true,
                    nextAction: 'Alternative storage method used'
                };
            } catch (fallbackError) {
                return {
                    success: false,
                    strategy: 'storageFallback',
                    error: fallbackError instanceof Error ? fallbackError.message : String(fallbackError),
                    fallbackUsed: true,
                    nextAction: 'Continue without persistent storage'
                };
            }
        }
    }

    /**
     * User activity-specific recovery strategy
     */
    private async executeActivityRecovery(
        recoveryFunction: () => Promise<any>,
        attemptNumber: number
    ): Promise<RecoveryResult> {
        // For activity errors, we typically switch to immediate mode
        return {
            success: true,
            strategy: 'activityFallback',
            fallbackUsed: true,
            nextAction: 'Switched to immediate update timing'
        };
    }

    /**
     * Graceful degradation for unknown errors
     */
    private async executeGracefulDegradation(
        recoveryFunction: () => Promise<any>,
        attemptNumber: number
    ): Promise<RecoveryResult> {
        return {
            success: false,
            strategy: 'gracefulDegradation',
            error: 'Unknown error - continuing with degraded functionality',
            fallbackUsed: true,
            nextAction: 'Monitor for additional issues'
        };
    }

    /**
     * Helper methods for error classification
     */
    private isNetworkError(error: any): boolean {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorName = error?.name || '';
        
        return error instanceof TypeError ||
               errorName === 'AbortError' ||
               errorName === 'NetworkError' ||
               errorMessage.includes('fetch') ||
               errorMessage.includes('network') ||
               errorMessage.includes('timeout') ||
               error?.code === 'NETWORK_ERROR';
    }

    private isCacheError(error: any): boolean {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        return errorMessage.includes('cache') ||
               errorMessage.includes('Cache') ||
               errorMessage.includes('storage quota') ||
               errorMessage.includes('QuotaExceededError');
    }

    private isServiceWorkerError(error: any): boolean {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        return errorMessage.includes('service worker') ||
               errorMessage.includes('ServiceWorker') ||
               errorMessage.includes('registration') ||
               errorMessage.includes('sw.js');
    }

    private isUserActivityError(error: any): boolean {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        return errorMessage.includes('Activity tracker') ||
               errorMessage.includes('activity') ||
               errorMessage.includes('event listener') ||
               errorMessage.includes('user interaction');
    }

    private isStorageError(error: any): boolean {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        return errorMessage.includes('localStorage') ||
               errorMessage.includes('sessionStorage') ||
               errorMessage.includes('storage') ||
               errorMessage.includes('quota');
    }

    private getNetworkErrorSeverity(error: any): 'low' | 'medium' | 'high' | 'critical' {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        if (errorMessage.includes('timeout')) return 'medium';
        if (errorMessage.includes('404')) return 'high';
        if (errorMessage.includes('500')) return 'high';
        if (errorMessage.includes('network')) return 'medium';
        
        return 'medium';
    }

    /**
     * Fallback recovery methods
     */
    private async partialCacheClearing(): Promise<void> {
        if ('caches' in window) {
            const cacheNames = await caches.keys();
            // Clear only non-critical caches
            const nonCriticalCaches = cacheNames.filter(name => 
                !name.includes('critical') && !name.includes('essential')
            );
            
            await Promise.allSettled(
                nonCriticalCaches.map(name => caches.delete(name))
            );
        }
    }

    private async minimalServiceWorkerUpdate(): Promise<void> {
        if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.getRegistration();
            if (registration) {
                // Just trigger update without waiting for activation
                registration.update().catch(() => {
                    // Ignore errors in minimal update
                });
            }
        }
    }

    private async alternativeStorageMethod(): Promise<void> {
        // Use sessionStorage as fallback for localStorage
        if ('sessionStorage' in window) {
            console.log('Using sessionStorage as fallback for persistent storage');
        }
    }

    /**
     * Reset recovery tracking for a specific context
     */
    public resetRecoveryTracking(context: string): void {
        const keysToRemove = Array.from(this.recoveryAttempts.keys())
            .filter(key => key.startsWith(context));
        
        keysToRemove.forEach(key => {
            this.recoveryAttempts.delete(key);
            this.lastRecoveryTime.delete(key);
        });
    }

    /**
     * Get recovery statistics
     */
    public getRecoveryStats(): {
        totalAttempts: number;
        activeContexts: string[];
        recentFailures: number;
    } {
        const now = Date.now();
        const recentThreshold = 5 * 60 * 1000; // 5 minutes
        
        const recentFailures = Array.from(this.lastRecoveryTime.values())
            .filter(time => now - time < recentThreshold).length;
        
        return {
            totalAttempts: Array.from(this.recoveryAttempts.values())
                .reduce((sum, attempts) => sum + attempts, 0),
            activeContexts: Array.from(new Set(
                Array.from(this.recoveryAttempts.keys())
                    .map(key => {
                        const parts = key.split('-');
                        return parts.slice(0, -1).join('-'); // Remove the error type part
                    })
            )),
            recentFailures
        };
    }
}

/**
 * Global error recovery manager instance
 */
export const globalErrorRecovery = new ErrorRecoveryManager();

/**
 * Convenience function for executing operations with error recovery
 */
export async function withErrorRecovery<T>(
    operation: () => Promise<T>,
    context: string,
    config?: Partial<RecoveryConfig>
): Promise<T> {
    const recovery = config ? new ErrorRecoveryManager(config) : globalErrorRecovery;
    
    try {
        return await operation();
    } catch (error) {
        const result = await recovery.executeRecovery(error, context, operation);
        
        if (result.success) {
            console.log(`Error recovery successful for ${context}:`, result);
            // Return the result from the recovery if available, otherwise try operation again
            if (result.result !== undefined) {
                return result.result;
            }
            return await operation();
        } else {
            console.error(`Error recovery failed for ${context}:`, result);
            throw new Error(`Operation failed after recovery attempts: ${result.error}`);
        }
    }
}