/**
 * URL Persistence Provider
 * 
 * Provides comprehensive URL and parameter persistence functionality
 * across the application with automatic restoration on page refresh.
 */

import { ReactNode, useEffect, useCallback, createContext, useContext } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { 
  UrlParameterPersistence, 
  ParameterPersistenceConfig,
  ParameterPersistenceResult,
  appParameterPersistence
} from '../../utils/url-parameter-persistence';
import { useNavigation } from '../../hooks/useNavigation';

interface UrlPersistenceContextValue {
  preserveCurrentUrl: (routePath?: string) => ParameterPersistenceResult;
  restorePreservedUrl: (options?: { replace?: boolean; key?: string }) => ParameterPersistenceResult;
  navigateWithPersistence: (
    path: string, 
    options?: {
      preserveQuery?: boolean;
      preserveRoute?: boolean;
      newParams?: Record<string, string>;
      replace?: boolean;
    }
  ) => ParameterPersistenceResult;
  validateCurrentUrl: () => ParameterPersistenceResult;
  clearPersistedUrls: () => void;
  isUrlValid: boolean;
  validationErrors: string[];
}

const UrlPersistenceContext = createContext<UrlPersistenceContextValue | undefined>(undefined);

interface UrlPersistenceProviderProps {
  children: ReactNode;
  config?: ParameterPersistenceConfig;
  autoRestore?: boolean;
  validateOnMount?: boolean;
}

export function UrlPersistenceProvider({
  children,
  config,
  autoRestore = true,
  validateOnMount = true
}: UrlPersistenceProviderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const { updateRouteParams } = useNavigation();
  
  // Use provided config or default app persistence
  const persistence = config ? new UrlParameterPersistence(config) : appParameterPersistence;

  // Preserve current URL with validation
  const preserveCurrentUrl = useCallback((routePath?: string): ParameterPersistenceResult => {
    const result = persistence.preserveParameters(
      location,
      params as Record<string, string>,
      routePath
    );
    
    if (result.success && result.preservedParams) {
      updateRouteParams(result.preservedParams.route);
    }
    
    return result;
  }, [location, params, persistence, updateRouteParams]);

  // Restore preserved URL
  const restorePreservedUrl = useCallback((options?: { replace?: boolean; key?: string }): ParameterPersistenceResult => {
    return persistence.restoreParameters(
      navigate,
      { pathname: location.pathname, search: location.search },
      options
    );
  }, [persistence, navigate, location]);

  // Navigate with parameter preservation
  const navigateWithPersistence = useCallback((
    path: string,
    options?: {
      preserveQuery?: boolean;
      preserveRoute?: boolean;
      newParams?: Record<string, string>;
      replace?: boolean;
    }
  ): ParameterPersistenceResult => {
    return persistence.navigateWithPreservation(path, navigate, options);
  }, [persistence, navigate]);

  // Validate current URL
  const validateCurrentUrl = useCallback((): ParameterPersistenceResult => {
    return persistence.validateCurrentParameters(
      location,
      params as Record<string, string>
    );
  }, [persistence, location, params]);

  // Clear all persisted URLs
  const clearPersistedUrls = useCallback(() => {
    persistence.clearAllParameters();
  }, [persistence]);

  // Validation state
  const validation = validateCurrentUrl();
  const isUrlValid = validation.success;
  const validationErrors = validation.errors;

  // Handle page refresh and initial load
  useEffect(() => {
    const handlePageLoad = async () => {
      try {
        // Validate current URL if requested
        if (validateOnMount) {
          const validation = validateCurrentUrl();
          if (!validation.success) {
            console.warn('URL validation failed on mount:', validation.errors);
            // Don't block the app, just log the errors
          }
        }

        // Auto-restore preserved URL if enabled
        if (autoRestore) {
          const restoration = restorePreservedUrl({ replace: true });
          if (restoration.success) {
            console.log('Successfully restored preserved URL');
            return; // URL was restored, don't preserve current
          }
        }

        // Preserve current URL for future restoration
        const preservation = preserveCurrentUrl();
        if (!preservation.success) {
          console.warn('Failed to preserve current URL:', preservation.errors);
        }
      } catch (error) {
        console.error('URL persistence initialization failed:', error);
      }
    };

    // Only run on initial mount, not on every location change
    handlePageLoad();
  }, []); // Empty dependency array - only run once

  // Preserve URL state on location changes (but not on initial mount)
  useEffect(() => {
    // Skip the initial mount (handled above)
    const isInitialMount = !window.history.state;
    if (isInitialMount) return;

    const preservation = preserveCurrentUrl();
    if (!preservation.success) {
      console.warn('Failed to preserve URL on navigation:', preservation.errors);
    }
  }, [location.pathname, location.search, location.hash, preserveCurrentUrl]);

  // Handle browser navigation events
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // Browser back/forward navigation occurred
      // Validate and preserve the new URL
      setTimeout(() => {
        const validation = validateCurrentUrl();
        if (validation.success) {
          preserveCurrentUrl();
        } else {
          console.warn('Invalid URL after browser navigation:', validation.errors);
        }
      }, 0);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [validateCurrentUrl, preserveCurrentUrl]);

  // Handle page visibility changes (for tab switching)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page became visible, check if we need to restore state
        const restoration = restorePreservedUrl({ replace: false });
        if (restoration.success) {
          console.log('Restored URL state after tab switch');
        }
      } else {
        // Page became hidden, preserve current state
        preserveCurrentUrl();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [restorePreservedUrl, preserveCurrentUrl]);

  const contextValue: UrlPersistenceContextValue = {
    preserveCurrentUrl,
    restorePreservedUrl,
    navigateWithPersistence,
    validateCurrentUrl,
    clearPersistedUrls,
    isUrlValid,
    validationErrors
  };

  return (
    <UrlPersistenceContext.Provider value={contextValue}>
      {children}
    </UrlPersistenceContext.Provider>
  );
}

/**
 * Hook to use URL persistence functionality
 */
export function useUrlPersistence() {
  const context = useContext(UrlPersistenceContext);
  if (!context) {
    throw new Error('useUrlPersistence must be used within UrlPersistenceProvider');
  }
  return context;
}

/**
 * Higher-order component to add URL persistence to any component
 */
export function withUrlPersistence<P extends object>(
  Component: React.ComponentType<P>,
  config?: ParameterPersistenceConfig
) {
  return function UrlPersistentComponent(props: P) {
    return (
      <UrlPersistenceProvider config={config}>
        <Component {...props} />
      </UrlPersistenceProvider>
    );
  };
}