/**
 * Session Timeout Handler Component
 * 
 * Provides session timeout warnings and graceful recovery options
 * for users when their authentication session is about to expire.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { authStateManager, AuthStateChangeEvent } from '../../utils/auth-state-manager';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { showToast } from '../ui/Toast';

interface SessionTimeoutHandlerProps {
  warningMinutes?: number;
  enableWarningDialog?: boolean;
  enableAutoRefresh?: boolean;
}

export function SessionTimeoutHandler({
  warningMinutes = 5,
  enableWarningDialog = true,
  enableAutoRefresh = true
}: SessionTimeoutHandlerProps) {
  const { user, logout } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Format time remaining for display
  const formatTimeRemaining = useCallback((seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${remainingSeconds}s`;
  }, []);

  // Handle session refresh
  const handleRefreshSession = useCallback(async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    
    try {
      // Trigger activity to reset session timeout
      authStateManager.updateActivity();
      
      // Close warning dialog
      setShowWarning(false);
      
      showToast('Session refreshed successfully', 'success');
    } catch (error) {
      console.error('Failed to refresh session:', error);
      showToast('Failed to refresh session. Please log in again.', 'error');
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing]);

  // Handle session logout
  const handleLogout = useCallback(() => {
    setShowWarning(false);
    logout();
  }, [logout]);

  // Handle continue session (extend without refresh)
  const handleContinueSession = useCallback(() => {
    authStateManager.updateActivity();
    setShowWarning(false);
    showToast('Session extended', 'success');
  }, []);

  // Set up auth state listener
  useEffect(() => {
    if (!user) {
      setShowWarning(false);
      return;
    }

    const unsubscribe = authStateManager.addListener((event: AuthStateChangeEvent) => {
      if (event.type === 'session_timeout') {
        const timeUntilExpiry = authStateManager.getTimeUntilExpiry();
        const warningThreshold = warningMinutes * 60 * 1000;
        
        // Show warning if we're within the warning threshold
        if (timeUntilExpiry <= warningThreshold && timeUntilExpiry > 0) {
          if (enableWarningDialog) {
            setTimeRemaining(Math.floor(timeUntilExpiry / 1000));
            setShowWarning(true);
          }
        } else if (timeUntilExpiry <= 0) {
          // Session has expired
          setShowWarning(false);
          showToast('Your session has expired', 'warning');
        }
      } else if (event.type === 'logout') {
        setShowWarning(false);
      } else if (event.type === 'session_refresh') {
        setShowWarning(false);
      }
    });

    return unsubscribe;
  }, [user, warningMinutes, enableWarningDialog]);

  // Update countdown timer
  useEffect(() => {
    if (!showWarning) return;

    const interval = setInterval(() => {
      const timeUntilExpiry = authStateManager.getTimeUntilExpiry();
      const remainingSeconds = Math.floor(timeUntilExpiry / 1000);
      
      if (remainingSeconds <= 0) {
        setShowWarning(false);
        clearInterval(interval);
      } else {
        setTimeRemaining(remainingSeconds);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [showWarning]);

  // Auto-refresh session when user is active
  useEffect(() => {
    if (!enableAutoRefresh || !user) return;

    const handleActivity = () => {
      // Only auto-refresh if session is close to expiring
      const timeUntilExpiry = authStateManager.getTimeUntilExpiry();
      const warningThreshold = warningMinutes * 60 * 1000;
      
      if (timeUntilExpiry <= warningThreshold && timeUntilExpiry > 0) {
        authStateManager.updateActivity();
      }
    };

    const events = ['mousedown', 'keypress', 'touchstart', 'scroll'];
    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [enableAutoRefresh, user, warningMinutes]);

  if (!showWarning) {
    return null;
  }

  return (
    <Modal
      isOpen={showWarning}
      onClose={() => {}} // Prevent closing by clicking outside
      title="Session Expiring Soon"
      size="sm"
    >
      <div className="space-y-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Your session will expire soon
          </h3>
          
          <p className="text-gray-600 mb-4">
            Your session will expire in{' '}
            <span className="font-mono font-bold text-red-600">
              {formatTimeRemaining(timeRemaining)}
            </span>
          </p>
          
          <p className="text-sm text-gray-500">
            Would you like to continue your session or log out?
          </p>
        </div>

        <div className="flex flex-col space-y-3">
          <Button
            onClick={handleRefreshSession}
            disabled={isRefreshing}
            className="w-full"
            variant="primary"
          >
            {isRefreshing ? 'Refreshing...' : 'Continue Session'}
          </Button>
          
          <Button
            onClick={handleContinueSession}
            className="w-full"
            variant="secondary"
          >
            Extend Session
          </Button>
          
          <Button
            onClick={handleLogout}
            className="w-full"
            variant="outline"
          >
            Log Out Now
          </Button>
        </div>

        <div className="text-xs text-gray-400 text-center">
          <p>
            Your session will be automatically extended when you interact with the page.
          </p>
        </div>
      </div>
    </Modal>
  );
}

export default SessionTimeoutHandler;