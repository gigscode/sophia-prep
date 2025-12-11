/**
 * Tests for Authentication State Manager
 * 
 * Basic tests to verify authentication state change handling functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AuthStateManager } from './auth-state-manager';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

describe('AuthStateManager', () => {
  let authStateManager: AuthStateManager;
  let mockListener: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockListener = vi.fn();
    
    authStateManager = new AuthStateManager({
      sessionTimeoutMinutes: 1, // 1 minute for testing
      sessionWarningMinutes: 0.1, // 6 seconds for testing
      enableCrossTabSync: true,
      enableSessionTimeout: true,
    });
  });

  afterEach(() => {
    authStateManager.destroy();
  });

  it('should handle user login correctly', () => {
    const unsubscribe = authStateManager.addListener(mockListener);
    
    const mockUser = { id: '123', email: 'test@example.com', name: 'Test User' };
    authStateManager.handleLogin(mockUser, 'local');
    
    expect(mockListener).toHaveBeenCalledWith({
      type: 'login',
      user: mockUser,
      timestamp: expect.any(Number),
      source: 'local'
    });
    
    unsubscribe();
  });

  it('should handle user logout correctly', () => {
    const unsubscribe = authStateManager.addListener(mockListener);
    
    authStateManager.handleLogout('manual');
    
    expect(mockListener).toHaveBeenCalledWith({
      type: 'logout',
      user: null,
      timestamp: expect.any(Number),
      source: 'manual'
    });
    
    unsubscribe();
  });

  it('should handle session refresh correctly', () => {
    const unsubscribe = authStateManager.addListener(mockListener);
    
    const mockUser = { id: '123', email: 'test@example.com', name: 'Test User' };
    authStateManager.handleSessionRefresh(mockUser);
    
    expect(mockListener).toHaveBeenCalledWith({
      type: 'session_refresh',
      user: mockUser,
      timestamp: expect.any(Number),
      source: 'local'
    });
    
    unsubscribe();
  });

  it('should update activity timestamp', () => {
    const initialActivity = Date.now();
    authStateManager.updateActivity();
    
    // Activity should be updated to current time (within reasonable margin)
    const timeUntilExpiry = authStateManager.getTimeUntilExpiry();
    const expectedTimeout = 1 * 60 * 1000; // 1 minute in ms
    
    expect(timeUntilExpiry).toBeGreaterThan(expectedTimeout - 1000); // Within 1 second
    expect(timeUntilExpiry).toBeLessThanOrEqual(expectedTimeout);
  });

  it('should detect session expiry correctly', () => {
    // Create manager with very short timeout for testing
    const shortTimeoutManager = new AuthStateManager({
      sessionTimeoutMinutes: 0.001, // ~60ms
      enableSessionTimeout: true,
    });
    
    // Initially not expired
    expect(shortTimeoutManager.isSessionExpired()).toBe(false);
    
    // Wait for timeout
    setTimeout(() => {
      expect(shortTimeoutManager.isSessionExpired()).toBe(true);
      shortTimeoutManager.destroy();
    }, 100);
  });

  it('should broadcast events to localStorage for cross-tab sync', () => {
    const mockUser = { id: '123', email: 'test@example.com' };
    
    authStateManager.handleLogin(mockUser, 'local');
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'auth_state_sync',
      expect.stringContaining('"type":"login"')
    );
  });

  it('should allow multiple listeners', () => {
    const listener1 = vi.fn();
    const listener2 = vi.fn();
    
    const unsubscribe1 = authStateManager.addListener(listener1);
    const unsubscribe2 = authStateManager.addListener(listener2);
    
    authStateManager.handleLogout('manual');
    
    expect(listener1).toHaveBeenCalled();
    expect(listener2).toHaveBeenCalled();
    
    unsubscribe1();
    unsubscribe2();
  });

  it('should remove listeners correctly', () => {
    const listener = vi.fn();
    const unsubscribe = authStateManager.addListener(listener);
    
    // Remove listener
    unsubscribe();
    
    // Event should not trigger listener
    authStateManager.handleLogout('manual');
    expect(listener).not.toHaveBeenCalled();
  });
});