/**
 * Tests for Authentication Navigation Handler
 * 
 * Basic tests to verify navigation behavior during authentication state changes
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthNavigationHandler } from './auth-navigation-handler';
import { AuthStateChangeEvent } from './auth-state-manager';

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

describe('AuthNavigationHandler', () => {
  let handler: AuthNavigationHandler;
  let mockNavigate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate = vi.fn();
    
    handler = new AuthNavigationHandler({
      loginPath: '/login',
      homePath: '/',
      adminPath: '/admin',
      protectedPaths: ['/admin', '/profile'],
      publicPaths: ['/', '/login', '/about'],
    });
    
    handler.setNavigator(mockNavigate, '/');
  });

  it('should redirect to home after successful login', () => {
    const loginEvent: AuthStateChangeEvent = {
      type: 'login',
      user: { id: '123', email: 'test@example.com', isAdmin: false },
      timestamp: Date.now(),
      source: 'local'
    };

    handler.setNavigator(mockNavigate, '/login');
    handler.handleAuthStateChange(loginEvent);

    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
  });

  it('should redirect admin users to admin path after login', () => {
    const loginEvent: AuthStateChangeEvent = {
      type: 'login',
      user: { id: '123', email: 'admin@example.com', isAdmin: true },
      timestamp: Date.now(),
      source: 'local'
    };

    handler.setNavigator(mockNavigate, '/login');
    handler.handleAuthStateChange(loginEvent);

    expect(mockNavigate).toHaveBeenCalledWith('/admin', { replace: true });
  });

  it('should redirect to login after logout from protected path', () => {
    const logoutEvent: AuthStateChangeEvent = {
      type: 'logout',
      user: null,
      timestamp: Date.now(),
      source: 'manual'
    };

    handler.setNavigator(mockNavigate, '/profile');
    handler.handleAuthStateChange(logoutEvent);

    expect(mockNavigate).toHaveBeenCalledWith('/login', {
      replace: true,
      state: {
        from: '/profile',
        message: 'Please log in to continue'
      }
    });
  });

  it('should stay on public path after logout', () => {
    const handler = new AuthNavigationHandler({
      preserveLocationOnLogout: true,
      publicPaths: ['/', '/about'],
    });
    
    handler.setNavigator(mockNavigate, '/about');
    
    const logoutEvent: AuthStateChangeEvent = {
      type: 'logout',
      user: null,
      timestamp: Date.now(),
      source: 'manual'
    };

    handler.handleAuthStateChange(logoutEvent);

    // Should not navigate away from public path
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('should handle session timeout correctly', () => {
    const timeoutEvent: AuthStateChangeEvent = {
      type: 'session_timeout',
      user: null,
      timestamp: Date.now(),
      source: 'timeout'
    };

    handler.setNavigator(mockNavigate, '/profile');
    handler.handleAuthStateChange(timeoutEvent);

    expect(mockNavigate).toHaveBeenCalledWith('/login', {
      replace: true,
      state: {
        from: '/profile',
        message: 'Session expired. Please log in again.',
        sessionTimeout: true
      }
    });
  });

  it('should preserve pending redirect location', () => {
    sessionStorageMock.getItem.mockReturnValue('/profile');
    
    const loginEvent: AuthStateChangeEvent = {
      type: 'login',
      user: { id: '123', email: 'test@example.com', isAdmin: false },
      timestamp: Date.now(),
      source: 'local'
    };

    handler.setNavigator(mockNavigate, '/login');
    handler.handleAuthStateChange(loginEvent);

    expect(mockNavigate).toHaveBeenCalledWith('/profile', { replace: true });
    expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('pendingRedirect');
  });

  it('should not redirect to invalid paths', () => {
    sessionStorageMock.getItem.mockReturnValue('http://evil.com');
    
    const loginEvent: AuthStateChangeEvent = {
      type: 'login',
      user: { id: '123', email: 'test@example.com', isAdmin: false },
      timestamp: Date.now(),
      source: 'local'
    };

    handler.setNavigator(mockNavigate, '/login');
    handler.handleAuthStateChange(loginEvent);

    // Should redirect to default home, not the invalid URL
    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
  });

  it('should handle session refresh without navigation', () => {
    const refreshEvent: AuthStateChangeEvent = {
      type: 'session_refresh',
      user: { id: '123', email: 'test@example.com' },
      timestamp: Date.now(),
      source: 'local'
    };

    handler.handleAuthStateChange(refreshEvent);

    // Should not navigate on session refresh
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});