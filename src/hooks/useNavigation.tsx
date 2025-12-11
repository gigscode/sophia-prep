import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { 
  isValidPath, 
  normalizePath, 
  preserveUrlState, 
  getPreservedUrlState,
  clearPreservedUrlState,
  preserveQueryParams,
  mergeQueryParams,
  restoreQueryParams,
  preserveRouteParams,
  getPreservedRouteParams,
  createUrlStateSnapshot
} from '../utils/navigation';
import { defaultUrlStateManager } from '../utils/url-state-manager';

interface NavigationState {
  currentPath: string;
  previousPath: string | null;
  isNavigating: boolean;
  pendingRedirect: string | null;
  navigationError: string | null;
  preservedParams: Record<string, string>;
  routeParams: Record<string, string>;
}

interface NavigationContextValue extends NavigationState {
  navigate: (path: string, options?: { replace?: boolean; state?: any; preserveParams?: boolean }) => void;
  goBack: () => void;
  goForward: () => void;
  setPendingRedirect: (path: string | null) => void;
  clearNavigationError: () => void;
  setNavigationError: (error: string | null) => void;
  preserveCurrentParams: (paramsToPreserve?: string[]) => void;
  restorePreservedParams: () => void;
  clearPreservedParams: () => void;
  updateRouteParams: (params: Record<string, string>) => void;
}

const NavigationContext = createContext<NavigationContextValue | undefined>(undefined);

export function NavigationStateProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  
  const [navigationState, setNavigationState] = useState<NavigationState>(() => {
    const currentPath = normalizePath(location.pathname + location.search + location.hash);
    const previousPath = getPreservedUrlState('previousPath');
    const preservedParams = getPreservedUrlState('queryParams') || {};
    const routeParams = getPreservedRouteParams(location.pathname) || {};
    
    return {
      currentPath,
      previousPath,
      isNavigating: false,
      pendingRedirect: getPreservedUrlState('pendingRedirect'),
      navigationError: null,
      preservedParams,
      routeParams,
    };
  });

  // Track path changes and update navigation state
  useEffect(() => {
    const newPath = normalizePath(location.pathname + location.search + location.hash);
    
    setNavigationState(prev => {
      const updatedState = {
        ...prev,
        previousPath: prev.currentPath !== newPath ? prev.currentPath : prev.previousPath,
        currentPath: newPath,
        isNavigating: false, // Navigation completed
        routeParams: { ...params } as Record<string, string>,
      };
      
      // Preserve navigation state for page refreshes
      preserveUrlState('previousPath', updatedState.previousPath);
      preserveUrlState('currentPath', updatedState.currentPath);
      
      // Create and save URL state snapshot
      const snapshot = createUrlStateSnapshot(location, params as Record<string, string>);
      defaultUrlStateManager.saveSnapshot(snapshot);
      
      // Preserve route parameters
      preserveRouteParams(params as Record<string, string>, location.pathname);
      
      return updatedState;
    });
  }, [location, params]);

  // Enhanced navigate function with loading states and error handling
  const handleNavigate = useCallback((path: string, options?: { replace?: boolean; state?: any; preserveParams?: boolean }) => {
    try {
      // Validate path before navigation
      if (!isValidPath(path)) {
        throw new Error(`Invalid navigation path: ${path}`);
      }

      let finalPath = normalizePath(path);
      
      // Merge preserved parameters if requested
      if (options?.preserveParams) {
        const currentParams = new URLSearchParams(location.search);
        const preserved = preserveQueryParams(currentParams, Object.keys(navigationState.preservedParams));
        const merged = mergeQueryParams(preserved, true);
        
        if (Object.keys(merged).length > 0) {
          const url = new URL(finalPath, window.location.origin);
          Object.entries(merged).forEach(([key, value]) => {
            url.searchParams.set(key, value);
          });
          finalPath = url.pathname + url.search + url.hash;
        }
      }
      
      setNavigationState(prev => ({
        ...prev,
        isNavigating: true,
        navigationError: null,
      }));

      navigate(finalPath, options);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Navigation failed';
      setNavigationState(prev => ({
        ...prev,
        isNavigating: false,
        navigationError: errorMessage,
      }));
      console.error('Navigation error:', error);
    }
  }, [navigate, location.search, navigationState.preservedParams]);

  // Browser back navigation
  const goBack = useCallback(() => {
    try {
      setNavigationState(prev => ({
        ...prev,
        isNavigating: true,
        navigationError: null,
      }));

      window.history.back();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Back navigation failed';
      setNavigationState(prev => ({
        ...prev,
        isNavigating: false,
        navigationError: errorMessage,
      }));
      console.error('Back navigation error:', error);
    }
  }, []);

  // Browser forward navigation
  const goForward = useCallback(() => {
    try {
      setNavigationState(prev => ({
        ...prev,
        isNavigating: true,
        navigationError: null,
      }));

      window.history.forward();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Forward navigation failed';
      setNavigationState(prev => ({
        ...prev,
        isNavigating: false,
        navigationError: errorMessage,
      }));
      console.error('Forward navigation error:', error);
    }
  }, []);

  // Set pending redirect for post-authentication navigation
  const setPendingRedirect = useCallback((path: string | null) => {
    setNavigationState(prev => ({
      ...prev,
      pendingRedirect: path,
    }));
    
    // Preserve pending redirect across page refreshes
    if (path) {
      preserveUrlState('pendingRedirect', path);
    } else {
      clearPreservedUrlState('pendingRedirect');
    }
  }, []);

  // Clear navigation error
  const clearNavigationError = useCallback(() => {
    setNavigationState(prev => ({
      ...prev,
      navigationError: null,
    }));
  }, []);

  // Set navigation error
  const setNavigationError = useCallback((error: string | null) => {
    setNavigationState(prev => ({
      ...prev,
      navigationError: error,
    }));
  }, []);

  // Preserve current query parameters
  const preserveCurrentParams = useCallback((paramsToPreserve?: string[]) => {
    try {
      const currentParams = new URLSearchParams(location.search);
      const toPreserve = paramsToPreserve || Array.from(currentParams.keys());
      const preserved = preserveQueryParams(currentParams, toPreserve);
      
      setNavigationState(prev => ({
        ...prev,
        preservedParams: { ...prev.preservedParams, ...preserved },
      }));
    } catch (error) {
      console.warn('Failed to preserve current parameters:', error);
    }
  }, [location.search]);

  // Restore preserved query parameters
  const restorePreservedParams = useCallback(() => {
    try {
      if (Object.keys(navigationState.preservedParams).length > 0) {
        restoreQueryParams(navigate, location.pathname);
      }
    } catch (error) {
      console.warn('Failed to restore preserved parameters:', error);
    }
  }, [navigate, location.pathname, navigationState.preservedParams]);

  // Clear preserved parameters
  const clearPreservedParams = useCallback(() => {
    setNavigationState(prev => ({
      ...prev,
      preservedParams: {},
    }));
    clearPreservedUrlState('queryParams');
  }, []);

  // Update route parameters
  const updateRouteParams = useCallback((newParams: Record<string, string>) => {
    setNavigationState(prev => ({
      ...prev,
      routeParams: { ...prev.routeParams, ...newParams },
    }));
    preserveRouteParams(newParams, location.pathname);
  }, [location.pathname]);

  // Handle browser navigation events (back/forward buttons)
  useEffect(() => {
    const handlePopState = () => {
      setNavigationState(prev => ({
        ...prev,
        isNavigating: true,
        navigationError: null,
      }));
    };

    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Handle pending redirects after authentication
  useEffect(() => {
    if (navigationState.pendingRedirect && !navigationState.isNavigating) {
      const redirectPath = navigationState.pendingRedirect;
      setPendingRedirect(null);
      handleNavigate(redirectPath);
    }
  }, [navigationState.pendingRedirect, navigationState.isNavigating, handleNavigate, setPendingRedirect]);

  // Handle page refresh and URL state restoration
  useEffect(() => {
    const handlePageLoad = () => {
      try {
        // Check if we should restore URL state on page load
        if (defaultUrlStateManager.shouldRestoreOnPageLoad(location)) {
          // Try to restore preserved state
          const restored = defaultUrlStateManager.restorePreservedState(
            navigate, 
            'preserved', 
            { replace: true }
          );
          
          if (!restored) {
            // If no preserved state, handle current state
            defaultUrlStateManager.handlePageRefresh(
              location,
              navigate,
              params as Record<string, string>,
              location.pathname
            );
          }
        } else {
          // Just preserve current state for future use
          defaultUrlStateManager.preserveCurrentState(
            location,
            params as Record<string, string>,
            location.pathname
          );
        }
      } catch (error) {
        console.warn('Failed to handle page load URL state:', error);
      }
    };

    // Only run on initial load, not on every location change
    if (navigationState.currentPath === normalizePath(location.pathname + location.search + location.hash)) {
      handlePageLoad();
    }
  }, []); // Empty dependency array - only run once on mount

  const contextValue: NavigationContextValue = {
    ...navigationState,
    navigate: handleNavigate,
    goBack,
    goForward,
    setPendingRedirect,
    clearNavigationError,
    setNavigationError,
    preserveCurrentParams,
    restorePreservedParams,
    clearPreservedParams,
    updateRouteParams,
  };

  return (
    <NavigationContext.Provider value={contextValue}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within NavigationStateProvider');
  }
  return context;
}

export type { NavigationState, NavigationContextValue };