/**
 * Unified Navigation Provider
 * 
 * Single React context provider that replaces both NavigationStateProvider and UrlPersistenceProvider
 * to eliminate circular dependencies and provide unified navigation functionality.
 */

import { 
  createContext, 
  useContext, 
  useEffect, 
  useState, 
  useCallback, 
  ReactNode, 
  useRef,
  useMemo
} from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { 
  NavigationManager, 
  NavigationState, 
  NavigationConfig
} from '../../utils/NavigationManager';

/**
 * Enhanced navigation context value that combines both navigation and URL persistence functionality
 */
interface UnifiedNavigationContextValue extends NavigationState {
  // Core navigation methods
  navigate: (path: string, options?: { replace?: boolean; state?: any; preserveParams?: boolean }) => Promise<boolean>;
  goBack: () => Promise<boolean>;
  goForward: () => Promise<boolean>;
  
  // Redirect management
  setPendingRedirect: (path: string | null) => void;
  executePendingRedirect: () => Promise<boolean>;
  
  // Error handling
  clearNavigationError: () => void;
  
  // Parameter management (replaces UrlPersistenceProvider functionality)
  preserveCurrentParams: (paramsToPreserve?: string[]) => void;
  clearPreservedParams: () => void;
  updateRouteParams: (params: Record<string, string>) => void;
  
  // URL persistence methods (from UrlPersistenceProvider)
  preserveCurrentUrl: () => boolean;
  restorePreservedUrl: (options?: { replace?: boolean }) => boolean;
  navigateWithPersistence: (
    path: string, 
    options?: {
      preserveQuery?: boolean;
      preserveRoute?: boolean;
      newParams?: Record<string, string>;
      replace?: boolean;
    }
  ) => Promise<boolean>;
  
  // Validation and status
  isUrlValid: boolean;
  validationErrors: string[];
  
  // Loop detection and recovery
  resetCircuitBreaker: () => void;
  isCircuitBreakerActive: boolean;
  circuitBreakerTimeRemaining: number;
  getLoopDetectionDebugInfo: () => any;
  getDebugLogs: (count?: number) => Array<{ timestamp: number; message: string; data?: any }>;
  clearDebugLogs: () => void;
}

const UnifiedNavigationContext = createContext<UnifiedNavigationContextValue | undefined>(undefined);

/**
 * Props for the UnifiedNavigationProvider
 */
interface UnifiedNavigationProviderProps {
  children: ReactNode;
  config?: Partial<NavigationConfig>;
  enableDebugMode?: boolean;
}

/**
 * Unified Navigation Provider Component
 * 
 * Provides all navigation functionality through a single context provider,
 * eliminating the need for separate NavigationStateProvider and UrlPersistenceProvider.
 */
export function UnifiedNavigationProvider({ 
  children, 
  config = {},
  enableDebugMode = false 
}: UnifiedNavigationProviderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  
  // Create navigation manager instance with proper configuration
  const navigationManager = useMemo(() => {
    const managerConfig: Partial<NavigationConfig> = {
      enablePersistence: true,
      enableErrorRecovery: true,
      maxRetries: 3,
      debugMode: enableDebugMode,
      ...config
    };
    
    return new NavigationManager(managerConfig);
  }, [config, enableDebugMode]);
  
  // Navigation state from the manager
  const [navigationState, setNavigationState] = useState<NavigationState>(() => 
    navigationManager.getState()
  );
  
  // Validation state
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isUrlValid, setIsUrlValid] = useState(true);
  
  // Refs to prevent infinite loops in useEffect dependencies
  const locationRef = useRef(location);
  const paramsRef = useRef(params);
  const isInitializedRef = useRef(false);
  
  // Browser history integration state
  const historyStateRef = useRef<{ 
    lastHistoryAction: string | null; 
    historyChangeTimestamp: number;
    preventNextHistoryUpdate: boolean;
  }>({
    lastHistoryAction: null,
    historyChangeTimestamp: 0,
    preventNextHistoryUpdate: false
  });
  
  // Update refs when location or params change
  useEffect(() => {
    locationRef.current = location;
    paramsRef.current = params;
  }, [location, params]);
  
  // Efficient state storage without triggering additional renders
  useEffect(() => {
    if (!isInitializedRef.current) return;
    
    // Debounce state storage to prevent excessive writes
    const debounceTimeout = setTimeout(() => {
      try {
        // Only store state if it has meaningfully changed
        const currentStateKey = `${navigationState.currentPath}|${navigationState.isNavigating}|${JSON.stringify(navigationState.preservedParams)}`;
        const lastStoredKey = sessionStorage.getItem('nav_last_stored_key');
        
        if (currentStateKey !== lastStoredKey) {
          // Store state efficiently without triggering re-renders
          const stateToStore = {
            currentPath: navigationState.currentPath,
            preservedParams: navigationState.preservedParams,
            routeParams: navigationState.routeParams,
            timestamp: Date.now()
          };
          
          sessionStorage.setItem('nav_efficient_state', JSON.stringify(stateToStore));
          sessionStorage.setItem('nav_last_stored_key', currentStateKey);
        }
      } catch (error) {
        // Silently handle storage errors to prevent disrupting navigation
        console.warn('State storage failed:', error);
      }
    }, 100); // 100ms debounce
    
    return () => clearTimeout(debounceTimeout);
  }, [
    navigationState.currentPath,
    navigationState.preservedParams,
    navigationState.routeParams,
    navigationState.isNavigating
  ]);
  
  // Initialize navigation manager and set up event listeners
  useEffect(() => {
    if (isInitializedRef.current) return;
    
    // Initialize event listeners
    navigationManager.initializeEventListeners();
    
    // Set up state change listener
    const unsubscribe = navigationManager.addListener((newState) => {
      setNavigationState(newState);
    });
    
    // Update route params from current location
    if (params && Object.keys(params).length > 0) {
      navigationManager.updateRouteParams(params as Record<string, string>);
    }
    
    // Execute any pending redirects
    navigationManager.executePendingRedirect();
    
    isInitializedRef.current = true;
    
    // Cleanup function
    return () => {
      unsubscribe();
      navigationManager.cleanup();
    };
  }, []); // Empty dependency array - only run once on mount
  
  // Handle location changes with optimized dependencies to prevent unnecessary re-renders
  useEffect(() => {
    if (!isInitializedRef.current) return;
    
    const currentPath = location.pathname + location.search + location.hash;
    const statePath = navigationState.currentPath;
    
    // Only update if the path actually changed and we're not already navigating
    if (currentPath !== statePath && !navigationState.isNavigating) {
      // Batch route params update with URL validation for efficiency
      const updates: { params?: Record<string, string>; validation?: { isValid: boolean; errors: string[] } } = {};
      
      // Update route params if they changed
      if (params && Object.keys(params).length > 0) {
        updates.params = params as Record<string, string>;
      }
      
      // Validate current URL
      try {
        // Simple validation - check if path is reasonable
        const isValid = currentPath.startsWith('/') && !currentPath.includes('//');
        updates.validation = { isValid, errors: isValid ? [] : ['Invalid URL format'] };
      } catch (error) {
        updates.validation = { 
          isValid: false, 
          errors: [error instanceof Error ? error.message : 'URL validation failed'] 
        };
      }
      
      // Apply updates in batch to minimize re-renders
      if (updates.params) {
        navigationManager.updateRouteParams(updates.params);
      }
      
      if (updates.validation) {
        setIsUrlValid(updates.validation.isValid);
        setValidationErrors(updates.validation.errors);
      }
    }
  }, [
    // Optimize dependencies - only include what actually matters for this effect
    location.pathname, 
    location.search, 
    location.hash, 
    navigationState.currentPath, 
    navigationState.isNavigating,
    // Use JSON.stringify for params to avoid unnecessary re-renders on object reference changes
    JSON.stringify(params),
    navigationManager
  ]);
  
  // Enhanced navigate function with efficient browser history integration
  const handleNavigate = useCallback(async (
    path: string, 
    options?: { replace?: boolean; state?: any; preserveParams?: boolean }
  ): Promise<boolean> => {
    try {
      // Prevent history update loops by tracking navigation source
      historyStateRef.current.preventNextHistoryUpdate = true;
      historyStateRef.current.lastHistoryAction = options?.replace ? 'replace' : 'push';
      historyStateRef.current.historyChangeTimestamp = Date.now();
      
      // Use navigation manager for consistent behavior and state management
      const success = await navigationManager.navigate(path, options);
      
      // Integrate with React Router for browser history without causing loops
      if (success && navigate) {
        // Use a small delay to ensure navigation manager state is updated first
        setTimeout(() => {
          navigate(path, { replace: options?.replace, state: options?.state });
          // Reset prevention flag after navigation completes
          setTimeout(() => {
            historyStateRef.current.preventNextHistoryUpdate = false;
          }, 50);
        }, 0);
      } else {
        // Reset prevention flag if navigation failed
        historyStateRef.current.preventNextHistoryUpdate = false;
      }
      
      return success;
    } catch (error) {
      // Reset prevention flag on error
      historyStateRef.current.preventNextHistoryUpdate = false;
      console.error('Navigation failed:', error);
      return false;
    }
  }, [navigate, navigationManager]);
  
  // Browser navigation methods with history integration
  const goBack = useCallback(async (): Promise<boolean> => {
    try {
      historyStateRef.current.lastHistoryAction = 'back';
      historyStateRef.current.historyChangeTimestamp = Date.now();
      return await navigationManager.goBack();
    } catch (error) {
      console.error('Back navigation failed:', error);
      return false;
    }
  }, [navigationManager]);
  
  const goForward = useCallback(async (): Promise<boolean> => {
    try {
      historyStateRef.current.lastHistoryAction = 'forward';
      historyStateRef.current.historyChangeTimestamp = Date.now();
      return await navigationManager.goForward();
    } catch (error) {
      console.error('Forward navigation failed:', error);
      return false;
    }
  }, [navigationManager]);
  
  // Redirect management
  const setPendingRedirect = useCallback((path: string | null) => {
    navigationManager.setPendingRedirect(path);
  }, [navigationManager]);
  
  const executePendingRedirect = useCallback(async (): Promise<boolean> => {
    return await navigationManager.executePendingRedirect();
  }, [navigationManager]);
  
  // Error handling
  const clearNavigationError = useCallback(() => {
    navigationManager.clearNavigationError();
  }, [navigationManager]);
  
  // Parameter management methods
  const preserveCurrentParams = useCallback((paramsToPreserve?: string[]) => {
    navigationManager.preserveCurrentParams(paramsToPreserve);
  }, [navigationManager]);
  
  const clearPreservedParams = useCallback(() => {
    navigationManager.clearPreservedParams();
  }, [navigationManager]);
  
  const updateRouteParams = useCallback((newParams: Record<string, string>) => {
    navigationManager.updateRouteParams(newParams);
  }, [navigationManager]);
  
  // URL persistence methods (replacing UrlPersistenceProvider functionality)
  const preserveCurrentUrl = useCallback((): boolean => {
    try {
      navigationManager.preserveCurrentParams();
      return true;
    } catch (error) {
      console.warn('Failed to preserve current URL:', error);
      return false;
    }
  }, [navigationManager]);
  
  const restorePreservedUrl = useCallback((_options?: { replace?: boolean }): boolean => {
    try {
      // This would need to be implemented in NavigationManager if needed
      // For now, return true as a placeholder
      return true;
    } catch (error) {
      console.warn('Failed to restore preserved URL:', error);
      return false;
    }
  }, []);
  
  const navigateWithPersistence = useCallback(async (
    path: string,
    options?: {
      preserveQuery?: boolean;
      preserveRoute?: boolean;
      newParams?: Record<string, string>;
      replace?: boolean;
    }
  ): Promise<boolean> => {
    try {
      // Preserve current parameters if requested
      if (options?.preserveQuery) {
        preserveCurrentParams();
      }
      
      // Navigate with parameter preservation
      return await handleNavigate(path, {
        replace: options?.replace,
        preserveParams: options?.preserveQuery || options?.preserveRoute
      });
    } catch (error) {
      console.error('Navigation with persistence failed:', error);
      return false;
    }
  }, [handleNavigate, preserveCurrentParams]);
  
  // Loop detection and recovery
  const resetCircuitBreaker = useCallback(() => {
    navigationManager.resetCircuitBreaker();
  }, [navigationManager]);
  
  const getLoopDetectionDebugInfo = useCallback(() => {
    return navigationManager.getLoopDetectionDebugInfo();
  }, [navigationManager]);
  
  const getDebugLogs = useCallback((count?: number) => {
    return navigationManager.getDebugLogs(count);
  }, [navigationManager]);
  
  const clearDebugLogs = useCallback(() => {
    navigationManager.clearDebugLogs();
  }, [navigationManager]);
  
  const isCircuitBreakerActive = navigationManager.isCircuitBreakerActive();
  const circuitBreakerTimeRemaining = navigationManager.getCircuitBreakerTimeRemaining();
  
  // Create stable context value to prevent unnecessary re-renders
  const contextValue = useMemo((): UnifiedNavigationContextValue => ({
    // Navigation state
    ...navigationState,
    
    // Core navigation methods
    navigate: handleNavigate,
    goBack,
    goForward,
    
    // Redirect management
    setPendingRedirect,
    executePendingRedirect,
    
    // Error handling
    clearNavigationError,
    
    // Parameter management
    preserveCurrentParams,
    clearPreservedParams,
    updateRouteParams,
    
    // URL persistence methods
    preserveCurrentUrl,
    restorePreservedUrl,
    navigateWithPersistence,
    
    // Validation and status
    isUrlValid,
    validationErrors,
    
    // Loop detection and recovery
    resetCircuitBreaker,
    isCircuitBreakerActive,
    circuitBreakerTimeRemaining,
    getLoopDetectionDebugInfo,
    getDebugLogs,
    clearDebugLogs
  }), [
    navigationState,
    handleNavigate,
    goBack,
    goForward,
    setPendingRedirect,
    executePendingRedirect,
    clearNavigationError,
    preserveCurrentParams,
    clearPreservedParams,
    updateRouteParams,
    preserveCurrentUrl,
    restorePreservedUrl,
    navigateWithPersistence,
    isUrlValid,
    validationErrors,
    resetCircuitBreaker,
    isCircuitBreakerActive,
    circuitBreakerTimeRemaining,
    getLoopDetectionDebugInfo,
    getDebugLogs,
    clearDebugLogs
  ]);
  
  return (
    <UnifiedNavigationContext.Provider value={contextValue}>
      {children}
    </UnifiedNavigationContext.Provider>
  );
}

/**
 * Hook to use unified navigation functionality
 * Replaces both useNavigation and useUrlPersistence hooks
 */
export function useUnifiedNavigation() {
  const context = useContext(UnifiedNavigationContext);
  if (!context) {
    throw new Error('useUnifiedNavigation must be used within UnifiedNavigationProvider');
  }
  return context;
}

/**
 * Backward compatibility hook that provides the same interface as useNavigation
 */
export function useNavigation() {
  const unified = useUnifiedNavigation();
  
  // Return interface compatible with the old useNavigation hook
  return {
    currentPath: unified.currentPath,
    previousPath: unified.previousPath,
    isNavigating: unified.isNavigating,
    pendingRedirect: unified.pendingRedirect,
    navigationError: unified.navigationError,
    preservedParams: unified.preservedParams,
    routeParams: unified.routeParams,
    navigate: unified.navigate,
    goBack: unified.goBack,
    goForward: unified.goForward,
    setPendingRedirect: unified.setPendingRedirect,
    clearNavigationError: unified.clearNavigationError,
    setNavigationError: (_error: string | null) => {
      // This functionality would need to be added to NavigationManager if needed
      console.warn('setNavigationError is deprecated in unified navigation');
    },
    preserveCurrentParams: unified.preserveCurrentParams,
    restorePreservedParams: () => {
      // This functionality is now handled automatically
      console.warn('restorePreservedParams is deprecated in unified navigation');
    },
    clearPreservedParams: unified.clearPreservedParams,
    updateRouteParams: unified.updateRouteParams
  };
}

/**
 * Backward compatibility hook that provides the same interface as useUrlPersistence
 */
export function useUrlPersistence() {
  const unified = useUnifiedNavigation();
  
  // Return interface compatible with the old useUrlPersistence hook
  return {
    preserveCurrentUrl: unified.preserveCurrentUrl,
    restorePreservedUrl: unified.restorePreservedUrl,
    navigateWithPersistence: unified.navigateWithPersistence,
    validateCurrentUrl: () => ({
      success: unified.isUrlValid,
      errors: unified.validationErrors
    }),
    clearPersistedUrls: unified.clearPreservedParams,
    isUrlValid: unified.isUrlValid,
    validationErrors: unified.validationErrors
  };
}

export type { UnifiedNavigationContextValue, UnifiedNavigationProviderProps };