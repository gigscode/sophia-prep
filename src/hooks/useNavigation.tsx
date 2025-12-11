/**
 * Simplified useNavigation Hook
 * 
 * Refactored to use the UnifiedNavigationProvider and eliminate circular dependencies.
 * This hook now provides a clean interface without managing its own state or context.
 */

import { useCallback, useMemo } from 'react';
import { useUnifiedNavigation } from '../components/navigation/UnifiedNavigationProvider';

/**
 * Navigation state interface for backward compatibility
 */
export interface NavigationState {
  currentPath: string;
  previousPath: string | null;
  isNavigating: boolean;
  pendingRedirect: string | null;
  navigationError: string | null;
  preservedParams: Record<string, string>;
  routeParams: Record<string, string>;
}

/**
 * Navigation context value interface for backward compatibility
 */
export interface NavigationContextValue extends NavigationState {
  navigate: (path: string, options?: { replace?: boolean; state?: any; preserveParams?: boolean }) => Promise<boolean>;
  goBack: () => Promise<boolean>;
  goForward: () => Promise<boolean>;
  setPendingRedirect: (path: string | null) => void;
  clearNavigationError: () => void;
  setNavigationError: (error: string | null) => void;
  preserveCurrentParams: (paramsToPreserve?: string[]) => void;
  restorePreservedParams: () => void;
  clearPreservedParams: () => void;
  updateRouteParams: (params: Record<string, string>) => void;
}

/**
 * Enhanced useNavigation hook that uses the unified navigation system
 * 
 * This hook eliminates circular dependencies by:
 * 1. Using the UnifiedNavigationProvider instead of managing its own state
 * 2. Providing stable references to prevent unnecessary re-renders
 * 3. Including built-in error handling and recovery
 * 4. Removing complex useEffect dependencies that caused loops
 */
export function useNavigation(): NavigationContextValue {
  const unified = useUnifiedNavigation();

  // Create stable navigate function with error handling
  const navigate = useCallback(async (
    path: string, 
    options?: { replace?: boolean; state?: any; preserveParams?: boolean }
  ): Promise<boolean> => {
    try {
      return await unified.navigate(path, options);
    } catch (error) {
      console.error('Navigation failed in useNavigation hook:', error);
      return false;
    }
  }, [unified.navigate]);

  // Create stable goBack function with error handling
  const goBack = useCallback(async (): Promise<boolean> => {
    try {
      return await unified.goBack();
    } catch (error) {
      console.error('Back navigation failed in useNavigation hook:', error);
      return false;
    }
  }, [unified.goBack]);

  // Create stable goForward function with error handling
  const goForward = useCallback(async (): Promise<boolean> => {
    try {
      return await unified.goForward();
    } catch (error) {
      console.error('Forward navigation failed in useNavigation hook:', error);
      return false;
    }
  }, [unified.goForward]);

  // Create stable setPendingRedirect function
  const setPendingRedirect = useCallback((path: string | null) => {
    try {
      unified.setPendingRedirect(path);
    } catch (error) {
      console.error('Set pending redirect failed in useNavigation hook:', error);
    }
  }, [unified.setPendingRedirect]);

  // Create stable clearNavigationError function
  const clearNavigationError = useCallback(() => {
    try {
      unified.clearNavigationError();
    } catch (error) {
      console.error('Clear navigation error failed in useNavigation hook:', error);
    }
  }, [unified.clearNavigationError]);

  // Backward compatibility function for setNavigationError
  const setNavigationError = useCallback((error: string | null) => {
    // This functionality is now handled by the NavigationManager
    // Log a deprecation warning
    console.warn('setNavigationError is deprecated in unified navigation system');
    
    // For backward compatibility, we could potentially add this to NavigationManager
    // For now, just log the error
    if (error) {
      console.error('Navigation error set via deprecated method:', error);
    }
  }, []);

  // Create stable preserveCurrentParams function
  const preserveCurrentParams = useCallback((paramsToPreserve?: string[]) => {
    try {
      unified.preserveCurrentParams(paramsToPreserve);
    } catch (error) {
      console.error('Preserve current params failed in useNavigation hook:', error);
    }
  }, [unified.preserveCurrentParams]);

  // Backward compatibility function for restorePreservedParams
  const restorePreservedParams = useCallback(() => {
    // This functionality is now handled automatically by the unified system
    console.warn('restorePreservedParams is deprecated - parameters are restored automatically');
  }, []);

  // Create stable clearPreservedParams function
  const clearPreservedParams = useCallback(() => {
    try {
      unified.clearPreservedParams();
    } catch (error) {
      console.error('Clear preserved params failed in useNavigation hook:', error);
    }
  }, [unified.clearPreservedParams]);

  // Create stable updateRouteParams function
  const updateRouteParams = useCallback((params: Record<string, string>) => {
    try {
      unified.updateRouteParams(params);
    } catch (error) {
      console.error('Update route params failed in useNavigation hook:', error);
    }
  }, [unified.updateRouteParams]);

  // Create stable context value to prevent unnecessary re-renders
  const contextValue = useMemo((): NavigationContextValue => ({
    // Navigation state from unified provider
    currentPath: unified.currentPath,
    previousPath: unified.previousPath,
    isNavigating: unified.isNavigating,
    pendingRedirect: unified.pendingRedirect,
    navigationError: unified.navigationError,
    preservedParams: unified.preservedParams,
    routeParams: unified.routeParams,
    
    // Stable function references
    navigate,
    goBack,
    goForward,
    setPendingRedirect,
    clearNavigationError,
    setNavigationError,
    preserveCurrentParams,
    restorePreservedParams,
    clearPreservedParams,
    updateRouteParams
  }), [
    // State dependencies
    unified.currentPath,
    unified.previousPath,
    unified.isNavigating,
    unified.pendingRedirect,
    unified.navigationError,
    unified.preservedParams,
    unified.routeParams,
    
    // Function dependencies (these are stable due to useCallback)
    navigate,
    goBack,
    goForward,
    setPendingRedirect,
    clearNavigationError,
    setNavigationError,
    preserveCurrentParams,
    restorePreservedParams,
    clearPreservedParams,
    updateRouteParams
  ]);

  return contextValue;
}

// NavigationStateProvider has been removed - use UnifiedNavigationProvider instead

// Export types for backward compatibility
export type { NavigationContextValue };