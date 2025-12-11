/**
 * NavigationManager Tests
 * 
 * Tests for the unified navigation manager functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NavigationManager } from './NavigationManager';

// Mock window.location and history
const mockLocation = {
  pathname: '/test',
  search: '?param=value',
  hash: '#section',
  origin: 'http://localhost:3000'
};

const mockHistory = {
  pushState: vi.fn(),
  replaceState: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  state: null
};

// Mock sessionStorage
const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

describe('NavigationManager', () => {
  let navigationManager: NavigationManager;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Mock window properties
    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true
    });
    
    Object.defineProperty(window, 'history', {
      value: mockHistory,
      writable: true
    });
    
    Object.defineProperty(window, 'sessionStorage', {
      value: mockSessionStorage,
      writable: true
    });

    // Mock document
    Object.defineProperty(document, 'hidden', {
      value: false,
      writable: true
    });

    navigationManager = new NavigationManager({
      enablePersistence: true,
      enableErrorRecovery: true,
      maxRetries: 2,
      debugMode: false
    });
  });

  afterEach(() => {
    navigationManager.cleanup();
  });

  describe('initialization', () => {
    it('should initialize with current location', () => {
      const state = navigationManager.getState();
      
      expect(state.currentPath).toBe('/test?param=value#section');
      expect(state.isNavigating).toBe(false);
      expect(state.navigationError).toBe(null);
    });

    it('should handle initialization errors gracefully', () => {
      // Mock location to throw error
      Object.defineProperty(window, 'location', {
        get: () => { throw new Error('Location access failed'); }
      });

      const manager = new NavigationManager();
      const state = manager.getState();
      
      expect(state.currentPath).toBe('/');
      expect(state.navigationError).toBe(null);
      
      manager.cleanup();
    });
  });

  describe('navigation', () => {
    it('should navigate to valid paths', async () => {
      const result = await navigationManager.navigate('/new-path');
      
      expect(result).toBe(true);
      expect(mockHistory.pushState).toHaveBeenCalledWith(undefined, '', '/new-path');
      
      const state = navigationManager.getState();
      expect(state.currentPath).toBe('/new-path');
      expect(state.previousPath).toBe('/test?param=value#section');
      expect(state.isNavigating).toBe(false);
    });

    it('should handle replace navigation', async () => {
      const result = await navigationManager.navigate('/replace-path', { replace: true });
      
      expect(result).toBe(true);
      expect(mockHistory.replaceState).toHaveBeenCalledWith(undefined, '', '/replace-path');
    });

    it('should reject invalid paths', async () => {
      const result = await navigationManager.navigate('invalid<path>');
      
      expect(result).toBe(false);
      expect(mockHistory.pushState).not.toHaveBeenCalled();
      
      const state = navigationManager.getState();
      expect(state.navigationError).toContain('Invalid navigation path');
    });

    it('should preserve parameters when requested', async () => {
      navigationManager.preserveCurrentParams(['param']);
      
      const result = await navigationManager.navigate('/new-path', { preserveParams: true });
      
      expect(result).toBe(true);
      // Should merge preserved params into the new path
      expect(mockHistory.pushState).toHaveBeenCalled();
    });
  });

  describe('browser navigation', () => {
    it('should handle back navigation', async () => {
      const result = await navigationManager.goBack();
      
      expect(result).toBe(true);
      expect(mockHistory.back).toHaveBeenCalled();
    });

    it('should handle forward navigation', async () => {
      const result = await navigationManager.goForward();
      
      expect(result).toBe(true);
      expect(mockHistory.forward).toHaveBeenCalled();
    });

    it('should handle popstate events', () => {
      const initialState = navigationManager.getState();
      
      // Simulate popstate event
      Object.defineProperty(window, 'location', {
        value: { ...mockLocation, pathname: '/back-path' },
        writable: true
      });
      
      navigationManager.handlePopState(new PopStateEvent('popstate'));
      
      const newState = navigationManager.getState();
      expect(newState.currentPath).toBe('/back-path?param=value#section');
      expect(newState.previousPath).toBe(initialState.currentPath);
    });
  });

  describe('parameter management', () => {
    it('should preserve current parameters', () => {
      navigationManager.preserveCurrentParams(['param']);
      
      const state = navigationManager.getState();
      expect(state.preservedParams).toEqual({ param: 'value' });
    });

    it('should update route parameters', () => {
      navigationManager.updateRouteParams({ id: '123', type: 'test' });
      
      const state = navigationManager.getState();
      expect(state.routeParams).toEqual({ id: '123', type: 'test' });
    });

    it('should clear preserved parameters', () => {
      navigationManager.preserveCurrentParams(['param']);
      navigationManager.clearPreservedParams();
      
      const state = navigationManager.getState();
      expect(state.preservedParams).toEqual({});
    });
  });

  describe('pending redirects', () => {
    it('should set and execute pending redirects', async () => {
      navigationManager.setPendingRedirect('/redirect-target');
      
      let state = navigationManager.getState();
      expect(state.pendingRedirect).toBe('/redirect-target');
      
      const result = await navigationManager.executePendingRedirect();
      
      expect(result).toBe(true);
      expect(mockHistory.pushState).toHaveBeenCalledWith(undefined, '', '/redirect-target');
      
      state = navigationManager.getState();
      expect(state.pendingRedirect).toBe(null);
    });

    it('should not execute redirect when already navigating', async () => {
      navigationManager.setPendingRedirect('/redirect-target');
      
      // Set navigating state
      const state = navigationManager.getState();
      (navigationManager as any).updateState({ isNavigating: true });
      
      const result = await navigationManager.executePendingRedirect();
      
      expect(result).toBe(false);
      expect(mockHistory.pushState).not.toHaveBeenCalled();
    });
  });

  describe('loop detection', () => {
    it('should detect and prevent infinite loops', async () => {
      // Simulate rapid navigation to same path
      for (let i = 0; i < 60; i++) {
        await navigationManager.navigate('/loop-path');
      }
      
      const loopStatus = navigationManager.getLoopDetectionStatus();
      expect(loopStatus.isCircuitBreakerActive).toBe(true);
      
      // Further navigation should be blocked
      const result = await navigationManager.navigate('/blocked-path');
      expect(result).toBe(false);
    });

    it('should reset circuit breaker', () => {
      // Activate circuit breaker
      (navigationManager as any).activateCircuitBreaker();
      
      let loopStatus = navigationManager.getLoopDetectionStatus();
      expect(loopStatus.isCircuitBreakerActive).toBe(true);
      
      navigationManager.resetCircuitBreaker();
      
      loopStatus = navigationManager.getLoopDetectionStatus();
      expect(loopStatus.isCircuitBreakerActive).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle navigation errors with retry', async () => {
      // Mock history.pushState to throw error
      mockHistory.pushState.mockImplementationOnce(() => {
        throw new Error('Navigation failed');
      });
      
      const result = await navigationManager.navigate('/error-path');
      
      // Should retry and eventually succeed
      expect(mockHistory.pushState).toHaveBeenCalledTimes(2);
    });

    it('should clear navigation errors', () => {
      // Set an error state
      (navigationManager as any).handleError('navigation', 'Test error');
      
      let state = navigationManager.getState();
      expect(state.navigationError).toBe('Test error');
      
      navigationManager.clearNavigationError();
      
      state = navigationManager.getState();
      expect(state.navigationError).toBe(null);
    });
  });

  describe('event listeners', () => {
    it('should add and remove state listeners', () => {
      const listener = vi.fn();
      const removeListener = navigationManager.addListener(listener);
      
      // Trigger state change by setting a pending redirect
      navigationManager.setPendingRedirect('/test-redirect');
      
      expect(listener).toHaveBeenCalled();
      
      // Remove listener
      removeListener();
      listener.mockClear();
      
      // This should not trigger the listener since it's been removed
      navigationManager.setPendingRedirect('/another-redirect');
      expect(listener).not.toHaveBeenCalled();
    });

    it('should initialize and cleanup event listeners', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      
      navigationManager.initializeEventListeners();
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('popstate', expect.any(Function));
      
      navigationManager.cleanup();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('popstate', expect.any(Function));
    });
  });

  describe('persistence', () => {
    it('should save and load state when persistence is enabled', async () => {
      const manager = new NavigationManager({ enablePersistence: true });
      
      // Clear previous calls to focus on this test
      mockSessionStorage.setItem.mockClear();
      
      // Trigger a navigation which should save state
      await manager.navigate('/test-persistence');
      
      // Should attempt to save state
      expect(mockSessionStorage.setItem).toHaveBeenCalled();
      
      manager.cleanup();
    });

    it('should not save state when persistence is disabled', () => {
      const manager = new NavigationManager({ enablePersistence: false });
      
      // Clear previous calls
      mockSessionStorage.setItem.mockClear();
      
      manager.preserveCurrentParams(['test']);
      
      // Should not save to storage
      expect(mockSessionStorage.setItem).not.toHaveBeenCalled();
      
      manager.cleanup();
    });
  });
});