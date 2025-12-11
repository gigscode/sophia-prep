/**
 * Cross-Tab Authentication Synchronization Component
 * 
 * Handles authentication state synchronization across browser tabs
 * to ensure consistent user experience when logging in/out from different tabs.
 */

import { useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigation } from '../../hooks/useNavigation';
import { authStateManager, AuthStateChangeEvent } from '../../utils/auth-state-manager';
import { authNavigationHandler } from '../../utils/auth-navigation-handler';
import { showToast } from '../ui/Toast';

interface CrossTabAuthSyncProps {
  enableNotifications?: boolean;
  enableAutoSync?: boolean;
}

export function CrossTabAuthSync({
  enableNotifications = true,
  enableAutoSync = true
}: CrossTabAuthSyncProps) {
  const { user, logout } = useAuth();
  const { navigate, currentPath } = useNavigation();
  // const [lastSyncEvent, setLastSyncEvent] = useState<AuthStateChangeEvent | null>(null);

  // Set up navigation handler
  useEffect(() => {
    authNavigationHandler.setNavigator(navigate, currentPath);
  }, [navigate, currentPath]);

  // Handle cross-tab authentication events
  useEffect(() => {
    if (!enableAutoSync) return;

    const unsubscribe = authStateManager.addListener((event: AuthStateChangeEvent) => {
      // Only handle remote events (from other tabs)
      if (event.source !== 'remote') return;

      // setLastSyncEvent(event);

      switch (event.type) {
        case 'login':
          handleRemoteLogin(event);
          break;
        case 'logout':
          handleRemoteLogout(event);
          break;
        case 'session_timeout':
          handleRemoteSessionTimeout(event);
          break;
      }
    });

    return unsubscribe;
  }, [enableAutoSync, user, logout, enableNotifications]);

  /**
   * Handle login from another tab
   */
  const handleRemoteLogin = (event: AuthStateChangeEvent) => {
    if (enableNotifications && !user) {
      showToast('You have been logged in from another tab', 'info');
    }

    // Let the auth provider handle the actual login state
    // We just handle navigation if needed
    authNavigationHandler.handleAuthStateChange({
      ...event,
      source: 'remote'
    });
  };

  /**
   * Handle logout from another tab
   */
  const handleRemoteLogout = (event: AuthStateChangeEvent) => {
    if (enableNotifications && user) {
      showToast('You have been logged out from another tab', 'warning');
    }

    // Perform local logout to sync state
    logout();

    // Handle navigation
    authNavigationHandler.handleAuthStateChange({
      ...event,
      source: 'remote'
    });
  };

  /**
   * Handle session timeout from another tab
   */
  const handleRemoteSessionTimeout = (event: AuthStateChangeEvent) => {
    if (enableNotifications && user) {
      showToast('Your session has expired in another tab', 'warning');
    }

    // Perform local logout
    logout();

    // Handle navigation
    authNavigationHandler.handleAuthStateChange({
      ...event,
      source: 'remote'
    });
  };

  // Handle page visibility changes for sync
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && enableAutoSync) {
        // Page became visible, check for any missed sync events
        // This helps catch events that might have been missed while tab was inactive

        // Update activity to refresh session if needed
        if (user) {
          authStateManager.updateActivity();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [enableAutoSync, user]);

  // Handle storage events for additional sync reliability
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      // Handle auth-related storage changes
      if (event.key === 'supabase.auth.token' || event.key?.startsWith('sb-')) {
        // Supabase auth token changed in another tab
        if (event.newValue === null && user) {
          // Token was removed, user logged out
          if (enableNotifications) {
            showToast('Authentication session ended', 'info');
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [user, enableNotifications]);

  // Broadcast current auth state when component mounts
  useEffect(() => {
    if (user && enableAutoSync) {
      // Broadcast current login state to other tabs
      authStateManager.handleLogin(user, 'local');
    }
  }, [user, enableAutoSync]);

  // This component doesn't render anything visible
  return null;
}

export default CrossTabAuthSync;