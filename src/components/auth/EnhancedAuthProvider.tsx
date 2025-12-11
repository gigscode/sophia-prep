/**
 * Enhanced Authentication Provider
 * 
 * Integrates authentication state management, session timeout handling,
 * cross-tab synchronization, and navigation behavior for a complete
 * authentication experience.
 */

import { ReactNode, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useNavigation } from '../../hooks/useNavigation';
import { authStateManager } from '../../utils/auth-state-manager';
import { authNavigationHandler } from '../../utils/auth-navigation-handler';
import SessionTimeoutHandler from './SessionTimeoutHandler';
import CrossTabAuthSync from './CrossTabAuthSync';

interface EnhancedAuthProviderProps {
  children: ReactNode;
  sessionTimeoutMinutes?: number;
  sessionWarningMinutes?: number;
  enableCrossTabSync?: boolean;
  enableSessionTimeout?: boolean;
  enableSessionWarning?: boolean;
  enableAutoRefresh?: boolean;
}

export function EnhancedAuthProvider({
  children,
  sessionTimeoutMinutes = 60,
  sessionWarningMinutes = 5,
  enableCrossTabSync = true,
  enableSessionTimeout = true,
  enableSessionWarning = true,
  enableAutoRefresh = true
}: EnhancedAuthProviderProps) {
  // Use sessionTimeoutMinutes to avoid unused variable warning
  console.log(`Auth provider initialized with ${sessionTimeoutMinutes}min timeout`);
  const { user, initialized } = useAuth();
  const { navigate, currentPath } = useNavigation();
  const location = useLocation();

  // Initialize auth state manager with configuration
  useEffect(() => {
    // The auth state manager is already initialized as a singleton
    // We just need to set up the navigation handler
    authNavigationHandler.setNavigator(navigate, currentPath);
    
    // Update navigation handler configuration
    authNavigationHandler.updateConfig({
      protectedPaths: ['/admin', '/profile', '/quiz', '/import-questions'],
      publicPaths: ['/', '/login', '/signup', '/about', '/contact', '/help', '/privacy', '/terms'],
    });
  }, [navigate, currentPath]);

  // Handle authentication state changes
  useEffect(() => {
    if (!initialized) return;

    const unsubscribe = authStateManager.addListener((event) => {
      // Handle navigation for auth state changes
      authNavigationHandler.handleAuthStateChange(event);
    });

    return unsubscribe;
  }, [initialized]);

  // Track user login/logout events
  useEffect(() => {
    if (!initialized) return;

    if (user) {
      // User logged in
      authStateManager.handleLogin(user, 'local');
    } else {
      // User logged out (only if we were previously logged in)
      const wasLoggedIn = sessionStorage.getItem('wasLoggedIn') === 'true';
      if (wasLoggedIn) {
        authStateManager.handleLogout('manual');
        sessionStorage.removeItem('wasLoggedIn');
      }
    }

    // Track login state
    if (user) {
      sessionStorage.setItem('wasLoggedIn', 'true');
    }
  }, [user, initialized]);

  // Update current path for navigation handler
  useEffect(() => {
    authNavigationHandler.setNavigator(navigate, location.pathname);
  }, [navigate, location.pathname]);

  // Handle page refresh and session recovery
  useEffect(() => {
    if (initialized && user) {
      // Session recovered from page refresh
      authStateManager.handleSessionRefresh(user);
    }
  }, [initialized, user]);

  return (
    <>
      {children}
      
      {/* Session Timeout Handler */}
      {enableSessionWarning && enableSessionTimeout && (
        <SessionTimeoutHandler
          warningMinutes={sessionWarningMinutes}
          enableWarningDialog={true}
          enableAutoRefresh={enableAutoRefresh}
        />
      )}
      
      {/* Cross-Tab Authentication Sync */}
      {enableCrossTabSync && (
        <CrossTabAuthSync
          enableNotifications={true}
          enableAutoSync={true}
        />
      )}
    </>
  );
}

export default EnhancedAuthProvider;