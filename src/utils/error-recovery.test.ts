/**
 * Tests for comprehensive error recovery utilities
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ErrorRecoveryManager, globalErrorRecovery, withErrorRecovery } from './error-recovery';

describe('ErrorRecoveryManager', () => {
    let recoveryManager: ErrorRecoveryManager;

    beforeEach(() => {
        recoveryManager = new ErrorRecoveryManager({
            maxRetries: 2,
            baseDelayMs: 100,
            maxDelayMs: 1000,
            enableFallbacks: true,
            logErrors: false // Disable logging for tests
        });
    });

    describe('Error Classification', () => {
        it('should classify network errors correctly', () => {
            const networkError = new TypeError('Failed to fetch');
            const classification = recoveryManager.classifyError(networkError);
            
            expect(classification.type).toBe('network');
            expect(classification.isRetryable).toBe(true);
            expect(classification.recoveryStrategy).toBe('networkRetry');
        });

        it('should classify cache errors correctly', () => {
            const cacheError = new Error('Cache API not supported');
            const classification = recoveryManager.classifyError(cacheError);
            
            expect(classification.type).toBe('cache');
            expect(classification.isRetryable).toBe(true);
            expect(classification.recoveryStrategy).toBe('cacheFallback');
        });

        it('should classify service worker errors correctly', () => {
            const swError = new Error('Service worker registration failed');
            const classification = recoveryManager.classifyError(swError);
            
            expect(classification.type).toBe('serviceWorker');
            expect(classification.isRetryable).toBe(true);
            expect(classification.recoveryStrategy).toBe('serviceWorkerFallback');
        });

        it('should classify user activity errors correctly', () => {
            const activityError = new Error('Activity tracker setup failed');
            const classification = recoveryManager.classifyError(activityError);
            
            expect(classification.type).toBe('userActivity');
            expect(classification.isRetryable).toBe(false);
            expect(classification.recoveryStrategy).toBe('activityFallback');
        });

        it('should classify storage errors correctly', () => {
            const storageError = new Error('localStorage quota exceeded');
            const classification = recoveryManager.classifyError(storageError);
            
            expect(classification.type).toBe('storage');
            expect(classification.isRetryable).toBe(true);
            expect(classification.recoveryStrategy).toBe('storageFallback');
        });

        it('should classify unknown errors correctly', () => {
            const unknownError = new Error('Something went wrong');
            const classification = recoveryManager.classifyError(unknownError);
            
            expect(classification.type).toBe('unknown');
            expect(classification.isRetryable).toBe(false);
            expect(classification.recoveryStrategy).toBe('gracefulDegradation');
        });
    });

    describe('Recovery Execution', () => {
        it('should handle non-retryable errors', async () => {
            const error = new Error('Activity tracker setup failed');
            const mockFunction = vi.fn().mockRejectedValue(error);
            
            const result = await recoveryManager.executeRecovery(error, 'test-context', mockFunction);
            
            expect(result.success).toBe(false);
            expect(result.fallbackUsed).toBe(true);
            expect(result.strategy).toBe('activityFallback');
        });

        it('should respect retry limits', async () => {
            const error = new TypeError('Network error');
            const mockFunction = vi.fn().mockRejectedValue(error);
            
            // First attempt
            await recoveryManager.executeRecovery(error, 'test-context', mockFunction);
            // Second attempt
            await recoveryManager.executeRecovery(error, 'test-context', mockFunction);
            // Third attempt should be rejected due to retry limit
            const result = await recoveryManager.executeRecovery(error, 'test-context', mockFunction);
            
            expect(result.success).toBe(false);
            expect(result.error).toContain('Maximum retry attempts exceeded');
        });

        it('should handle successful recovery', async () => {
            const error = new TypeError('Network error');
            const mockFunction = vi.fn().mockResolvedValue('success');
            
            const result = await recoveryManager.executeRecovery(error, 'test-context', mockFunction);
            
            expect(result.success).toBe(true);
            expect(result.strategy).toBe('networkRetry');
            expect(result.fallbackUsed).toBe(false);
        });
    });

    describe('Recovery Statistics', () => {
        it('should track recovery attempts', async () => {
            const error = new TypeError('Network error');
            const mockFunction = vi.fn().mockRejectedValue(error);
            
            await recoveryManager.executeRecovery(error, 'test-context', mockFunction);
            
            const stats = recoveryManager.getRecoveryStats();
            expect(stats.totalAttempts).toBeGreaterThan(0);
            expect(stats.activeContexts).toContain('test-context');
        });

        it('should reset recovery tracking', async () => {
            const error = new TypeError('Network error');
            const mockFunction = vi.fn().mockRejectedValue(error);
            
            await recoveryManager.executeRecovery(error, 'test-context', mockFunction);
            recoveryManager.resetRecoveryTracking('test-context');
            
            const stats = recoveryManager.getRecoveryStats();
            expect(stats.activeContexts).not.toContain('test-context');
        });
    });
});

describe('withErrorRecovery', () => {
    it('should execute operation successfully without recovery', async () => {
        const mockOperation = vi.fn().mockResolvedValue('success');
        
        const result = await withErrorRecovery(mockOperation, 'test-context');
        
        expect(result).toBe('success');
        expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('should attempt recovery on failure', async () => {
        const mockOperation = vi.fn()
            .mockRejectedValueOnce(new TypeError('Network error'))
            .mockResolvedValueOnce('success after recovery');
        
        const result = await withErrorRecovery(mockOperation, 'test-context', {
            maxRetries: 1,
            baseDelayMs: 10
        });
        
        expect(result).toBe('success after recovery');
        expect(mockOperation).toHaveBeenCalledTimes(2);
    });

    it('should throw error when recovery fails', async () => {
        const mockOperation = vi.fn().mockRejectedValue(new Error('Persistent error'));
        
        await expect(
            withErrorRecovery(mockOperation, 'test-context', {
                maxRetries: 1,
                baseDelayMs: 10
            })
        ).rejects.toThrow('Operation failed after recovery attempts');
    });
});

describe('Global Error Recovery', () => {
    it('should provide a global instance', () => {
        expect(globalErrorRecovery).toBeInstanceOf(ErrorRecoveryManager);
    });

    it('should classify errors using global instance', () => {
        const error = new TypeError('Network error');
        const classification = globalErrorRecovery.classifyError(error);
        
        expect(classification.type).toBe('network');
        expect(classification.isRetryable).toBe(true);
    });
});