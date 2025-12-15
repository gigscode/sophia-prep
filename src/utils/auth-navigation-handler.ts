/**
 * Authentication Navigation Handler
 * 
 * Handles navigation behavior during authentication state changes,
 * including login/logout redirects and session timeout recovery.
 */

import { AuthStateChangeEvent } from './auth-state-manager';
import { showToast } from '../components/ui/Toast';

type NavigateFunction = (path: string, options?: { replace?: boolean; state?: any; preserveParams?: boolean }) => void;

export interface AuthNavigationConfig {
  loginPath: string;
  homePath: string;
  adminPath: string;
  protectedPaths: string[];
  publicPaths: string[];
  preserveLocationOnLogin: boolean;
  preserveLocationOnLogout: boolean;
  sessionTimeoutRedirect: string;
}

export class AuthNavigationHandler {
  private config: AuthNavigationConfig;
  private navigate: NavigateFunction | null = null;
  private currentPath: string = '/';

  constructor(config: Partial<AuthNavigationConfig> = {}) {
    this.config = {
      loginPath: '/login',
      homePath: '/',
      adminPath: '/7351/admin',
      protectedPaths: ['/7351/admin', '/profile', '/quiz'],
      publicPaths: ['/', '/login', '/signup', '/about', '/contact'],
      preserveLocationOnLogin: true,
      preserveLocationOnLogout: false,
      sessionTimeoutRedirect: '/login',
      ...config
    };
  }

  /**
   * Set the navigate function and current path
   */
  public setNavigator(navigate: NavigateFunction, currentPath: string): void {
    this.navigate = navigate;
    this.currentPath = currentPath;
  }

  /**
   * Handle authentication state change events
   */
  public handleAuthStateChange(event: AuthStateChangeEvent): void {
    if (!this.navigate) {
      console.warn('Navigate function not set in AuthNavigationHandler');
      return;
    }

    switch (event.type) {
      case 'login':
        this.handleLogin(event);
        break;
      case 'logout':
        this.handleLogout(event);
        break;
      case 'session_timeout':
        this.handleSessionTimeout(event);
        break;
      case 'session_refresh':
        this.handleSessionRefresh(event);
        break;
      case 'tab_sync':
        this.handleTabSync(event);
        break;
    }
  }

  /**
   * Handle user login
   */
  private handleLogin(event: AuthStateChangeEvent): void {
    const { user, source } = event;

    // Show success message for local logins
    if (source === 'local') {
      showToast(`Welcome back, ${user?.name || user?.email || 'User'}!`, 'success');
    }

    // Handle navigation after login
    if (this.config.preserveLocationOnLogin) {
      // Check for pending redirect
      const pendingRedirect = this.getPendingRedirect();
      if (pendingRedirect && this.isValidRedirectPath(pendingRedirect)) {
        this.clearPendingRedirect();
        this.navigate?.(pendingRedirect, { replace: true });
        return;
      }

      // If currently on login page, redirect to appropriate home
      if (this.currentPath === this.config.loginPath) {
        const redirectPath = user?.isAdmin ? this.config.adminPath : this.config.homePath;
        this.navigate?.(redirectPath, { replace: true });
        return;
      }

      // Otherwise, stay on current page if it's accessible
      if (this.isPathAccessible(this.currentPath, user)) {
        // Stay on current page, just update state
        return;
      }
    }

    // Default redirect after login
    const defaultPath = user?.isAdmin ? this.config.adminPath : this.config.homePath;

    // Avoid redirecting to the same path
    if (this.currentPath === defaultPath) {
      return;
    }

    this.navigate?.(defaultPath, { replace: true });
  }

  /**
   * Handle user logout
   */
  private handleLogout(event: AuthStateChangeEvent): void {
    const { source } = event;

    // Show appropriate message based on logout source
    switch (source) {
      case 'timeout':
        showToast('Your session has expired. Please log in again.', 'warning');
        break;
      case 'manual':
        showToast('You have been logged out successfully.', 'success');
        break;
      case 'remote':
        showToast('You have been logged out from another tab.', 'info');
        break;
    }

    // Handle navigation after logout
    if (this.config.preserveLocationOnLogout && this.isPublicPath(this.currentPath)) {
      // Stay on current page if it's public
      return;
    }

    // If on a protected path, redirect to login
    if (this.isProtectedPath(this.currentPath)) {
      this.setPendingRedirect(this.currentPath);
      this.navigate?.(this.config.loginPath, {
        replace: true,
        state: {
          from: this.currentPath,
          message: 'Please log in to continue'
        }
      });
      return;
    }

    // Default redirect to home
    this.navigate?.(this.config.homePath, { replace: true });
  }

  /**
   * Handle session timeout
   */
  private handleSessionTimeout(_event: AuthStateChangeEvent): void {
    // Save current location for post-login redirect
    if (this.isProtectedPath(this.currentPath)) {
      this.setPendingRedirect(this.currentPath);
    }

    showToast('Your session has expired. Please log in again.', 'warning');

    this.navigate?.(this.config.sessionTimeoutRedirect, {
      replace: true,
      state: {
        from: this.currentPath,
        message: 'Session expired. Please log in again.',
        sessionTimeout: true
      }
    });
  }

  /**
   * Handle session refresh
   */
  private handleSessionRefresh(_event: AuthStateChangeEvent): void {
    // Session refreshed successfully, no navigation needed
    // Just log for debugging
    console.log('Session refreshed successfully');
  }

  /**
   * Handle cross-tab synchronization
   */
  private handleTabSync(event: AuthStateChangeEvent): void {
    // Handle navigation based on the synced event type
    if (event.type === 'logout') {
      this.handleLogout({ ...event, source: 'remote' });
    } else if (event.type === 'login') {
      // For login sync, just update state without navigation
      // to avoid disrupting user's current activity
      console.log('User logged in from another tab');
    }
  }

  /**
   * Check if a path is protected (requires authentication)
   */
  private isProtectedPath(path: string): boolean {
    return this.config.protectedPaths.some(protectedPath =>
      path.startsWith(protectedPath)
    );
  }

  /**
   * Check if a path is public (accessible without authentication)
   */
  private isPublicPath(path: string): boolean {
    return this.config.publicPaths.some(publicPath =>
      path === publicPath || path.startsWith(publicPath + '/')
    );
  }

  /**
   * Check if a path is accessible for the given user
   */
  private isPathAccessible(path: string, user: any): boolean {
    // Public paths are always accessible
    if (this.isPublicPath(path)) {
      return true;
    }

    // Protected paths require authentication
    if (this.isProtectedPath(path)) {
      if (!user) {
        return false;
      }

      // Admin paths require admin privileges
      if (path.startsWith(this.config.adminPath)) {
        return user.isAdmin === true;
      }

      return true;
    }

    // Default to accessible
    return true;
  }

  /**
   * Check if a redirect path is valid and safe
   */
  private isValidRedirectPath(path: string): boolean {
    // Prevent open redirects - only allow internal paths
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('//')) {
      return false;
    }

    // Must start with /
    if (!path.startsWith('/')) {
      return false;
    }

    // Don't redirect to login page
    if (path === this.config.loginPath) {
      return false;
    }

    return true;
  }

  /**
   * Set pending redirect for post-login navigation
   */
  private setPendingRedirect(path: string): void {
    try {
      sessionStorage.setItem('pendingRedirect', path);
    } catch (error) {
      console.warn('Failed to set pending redirect:', error);
    }
  }

  /**
   * Get pending redirect path
   */
  private getPendingRedirect(): string | null {
    try {
      return sessionStorage.getItem('pendingRedirect');
    } catch (error) {
      console.warn('Failed to get pending redirect:', error);
      return null;
    }
  }

  /**
   * Clear pending redirect
   */
  private clearPendingRedirect(): void {
    try {
      sessionStorage.removeItem('pendingRedirect');
    } catch (error) {
      console.warn('Failed to clear pending redirect:', error);
    }
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<AuthNavigationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  public getConfig(): AuthNavigationConfig {
    return { ...this.config };
  }
}

// Default instance for app-wide use
export const authNavigationHandler = new AuthNavigationHandler();