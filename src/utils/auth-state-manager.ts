/**
 * Authentication State Manager
 * 
 * Handles authentication state changes, session timeout, and cross-tab synchronization
 * for proper navigation behavior during login/logout operations.
 */

import { supabase } from '../integrations/supabase/client';

export interface AuthStateChangeEvent {
  type: 'login' | 'logout' | 'session_timeout' | 'session_refresh' | 'tab_sync';
  user: any | null;
  timestamp: number;
  source: 'local' | 'remote' | 'timeout' | 'manual';
}

export interface AuthStateManagerConfig {
  sessionTimeoutMinutes: number;
  sessionWarningMinutes: number;
  enableCrossTabSync: boolean;
  enableSessionTimeout: boolean;
  storageKey: string;
}

export class AuthStateManager {
  private config: AuthStateManagerConfig;
  private listeners: ((event: AuthStateChangeEvent) => void)[] = [];
  private sessionTimeoutId: NodeJS.Timeout | null = null;
  private sessionWarningId: NodeJS.Timeout | null = null;
  private lastActivity: number = Date.now();
  private isActive: boolean = true;
  private storageListener: ((event: StorageEvent) => void) | null = null;

  constructor(config: Partial<AuthStateManagerConfig> = {}) {
    this.config = {
      sessionTimeoutMinutes: 60, // 1 hour default
      sessionWarningMinutes: 5, // Warn 5 minutes before timeout
      enableCrossTabSync: true,
      enableSessionTimeout: true,
      storageKey: 'auth_state_sync',
      ...config
    };

    this.initialize();
  }

  private initialize(): void {
    // Set up activity tracking
    this.setupActivityTracking();
    
    // Set up cross-tab synchronization
    if (this.config.enableCrossTabSync) {
      this.setupCrossTabSync();
    }

    // Set up session timeout monitoring
    if (this.config.enableSessionTimeout) {
      this.setupSessionTimeout();
    }
  }

  /**
   * Add a listener for authentication state changes
   */
  public addListener(listener: (event: AuthStateChangeEvent) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Emit an authentication state change event
   */
  private emit(event: AuthStateChangeEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Auth state listener error:', error);
      }
    });
  }

  /**
   * Handle user login
   */
  public handleLogin(user: any, source: 'local' | 'remote' = 'local'): void {
    this.updateActivity();
    this.resetSessionTimeout();
    
    const event: AuthStateChangeEvent = {
      type: 'login',
      user,
      timestamp: Date.now(),
      source
    };

    this.emit(event);
    this.broadcastToTabs(event);
  }

  /**
   * Handle user logout
   */
  public handleLogout(source: 'local' | 'remote' | 'timeout' | 'manual' = 'manual'): void {
    this.clearSessionTimeout();
    
    const event: AuthStateChangeEvent = {
      type: 'logout',
      user: null,
      timestamp: Date.now(),
      source
    };

    this.emit(event);
    
    if (source !== 'remote') {
      this.broadcastToTabs(event);
    }
  }

  /**
   * Handle session timeout
   */
  public handleSessionTimeout(): void {
    console.warn('Session timeout detected');
    
    const event: AuthStateChangeEvent = {
      type: 'session_timeout',
      user: null,
      timestamp: Date.now(),
      source: 'timeout'
    };

    this.emit(event);
    this.broadcastToTabs(event);
    
    // Sign out from Supabase
    supabase.auth.signOut().catch(error => {
      console.error('Error signing out after timeout:', error);
    });
  }

  /**
   * Handle session refresh
   */
  public handleSessionRefresh(user: any): void {
    this.updateActivity();
    this.resetSessionTimeout();
    
    const event: AuthStateChangeEvent = {
      type: 'session_refresh',
      user,
      timestamp: Date.now(),
      source: 'local'
    };

    this.emit(event);
  }

  /**
   * Update user activity timestamp
   */
  public updateActivity(): void {
    this.lastActivity = Date.now();
    
    if (this.config.enableSessionTimeout) {
      this.resetSessionTimeout();
    }
  }

  /**
   * Check if session is expired
   */
  public isSessionExpired(): boolean {
    if (!this.config.enableSessionTimeout) {
      return false;
    }

    const timeoutMs = this.config.sessionTimeoutMinutes * 60 * 1000;
    return (Date.now() - this.lastActivity) > timeoutMs;
  }

  /**
   * Get time until session expires (in milliseconds)
   */
  public getTimeUntilExpiry(): number {
    if (!this.config.enableSessionTimeout) {
      return Infinity;
    }

    const timeoutMs = this.config.sessionTimeoutMinutes * 60 * 1000;
    const elapsed = Date.now() - this.lastActivity;
    return Math.max(0, timeoutMs - elapsed);
  }

  /**
   * Set up activity tracking
   */
  private setupActivityTracking(): void {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const activityHandler = () => {
      if (this.isActive) {
        this.updateActivity();
      }
    };

    events.forEach(event => {
      document.addEventListener(event, activityHandler, { passive: true });
    });

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      this.isActive = !document.hidden;
      if (this.isActive) {
        this.updateActivity();
      }
    });
  }

  /**
   * Set up cross-tab synchronization
   */
  private setupCrossTabSync(): void {
    this.storageListener = (event: StorageEvent) => {
      if (event.key === this.config.storageKey && event.newValue) {
        try {
          const authEvent: AuthStateChangeEvent = JSON.parse(event.newValue);
          
          // Only process events from other tabs
          if (authEvent.source !== 'local') {
            this.emit({
              ...authEvent,
              source: 'remote'
            });
          }
        } catch (error) {
          console.error('Error parsing cross-tab auth event:', error);
        }
      }
    };

    window.addEventListener('storage', this.storageListener);
  }

  /**
   * Broadcast authentication event to other tabs
   */
  private broadcastToTabs(event: AuthStateChangeEvent): void {
    if (!this.config.enableCrossTabSync) {
      return;
    }

    try {
      localStorage.setItem(this.config.storageKey, JSON.stringify(event));
      
      // Clear the item after a short delay to allow other tabs to read it
      setTimeout(() => {
        localStorage.removeItem(this.config.storageKey);
      }, 100);
    } catch (error) {
      console.error('Error broadcasting auth event to tabs:', error);
    }
  }

  /**
   * Set up session timeout monitoring
   */
  private setupSessionTimeout(): void {
    this.resetSessionTimeout();
  }

  /**
   * Reset session timeout timers
   */
  private resetSessionTimeout(): void {
    this.clearSessionTimeout();

    if (!this.config.enableSessionTimeout) {
      return;
    }

    const timeoutMs = this.config.sessionTimeoutMinutes * 60 * 1000;
    const warningMs = (this.config.sessionTimeoutMinutes - this.config.sessionWarningMinutes) * 60 * 1000;

    // Set warning timer
    if (this.config.sessionWarningMinutes > 0 && warningMs > 0) {
      this.sessionWarningId = setTimeout(() => {
        const event: AuthStateChangeEvent = {
          type: 'session_timeout',
          user: null,
          timestamp: Date.now(),
          source: 'timeout'
        };
        
        // Emit warning event (listeners can differentiate by checking time until expiry)
        this.emit(event);
      }, warningMs);
    }

    // Set timeout timer
    this.sessionTimeoutId = setTimeout(() => {
      this.handleSessionTimeout();
    }, timeoutMs);
  }

  /**
   * Clear session timeout timers
   */
  private clearSessionTimeout(): void {
    if (this.sessionTimeoutId) {
      clearTimeout(this.sessionTimeoutId);
      this.sessionTimeoutId = null;
    }

    if (this.sessionWarningId) {
      clearTimeout(this.sessionWarningId);
      this.sessionWarningId = null;
    }
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    this.clearSessionTimeout();
    
    if (this.storageListener) {
      window.removeEventListener('storage', this.storageListener);
      this.storageListener = null;
    }

    this.listeners.length = 0;
  }
}

// Default instance for app-wide use
export const authStateManager = new AuthStateManager();