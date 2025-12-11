/**
 * URL Parameters Hook
 * 
 * Provides easy access to URL parameters with persistence
 * and validation capabilities.
 */

import { useCallback, useMemo } from 'react';
import { useSearchParams, useParams, useLocation } from 'react-router-dom';
import { useNavigation } from './useNavigation';
import { extractQueryParams, buildPathWithParams } from '../utils/navigation';
import { useUrlStateManager } from '../utils/url-state-manager';

/**
 * Hook for managing URL parameters with persistence
 */
export function useUrlParams() {
  const [searchParams, setSearchParams] = useSearchParams();
  const routeParams = useParams();
  const location = useLocation();
  const { navigate, preserveCurrentParams, clearPreservedParams } = useNavigation();
  const urlStateManager = useUrlStateManager();

  // Get all query parameters as an object
  const queryParams = useMemo(() => {
    return extractQueryParams(location.pathname + location.search);
  }, [location.pathname, location.search]);

  // Get a specific query parameter
  const getQueryParam = useCallback((key: string, defaultValue?: string): string | undefined => {
    return searchParams.get(key) || defaultValue;
  }, [searchParams]);

  // Set a single query parameter
  const setQueryParam = useCallback((key: string, value: string | null, options?: { replace?: boolean; preserve?: boolean }) => {
    const newParams = new URLSearchParams(searchParams);

    if (value === null || value === undefined) {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }

    if (options?.preserve) {
      preserveCurrentParams([key]);
    }

    setSearchParams(newParams, { replace: options?.replace });
  }, [searchParams, setSearchParams, preserveCurrentParams]);

  // Set multiple query parameters
  const setQueryParams = useCallback((params: Record<string, string | null>, options?: { replace?: boolean; preserve?: boolean; merge?: boolean }) => {
    const newParams = options?.merge ? new URLSearchParams(searchParams) : new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        newParams.delete(key);
      } else {
        newParams.set(key, value);
      }
    });

    if (options?.preserve) {
      preserveCurrentParams(Object.keys(params));
    }

    setSearchParams(newParams, { replace: options?.replace });
  }, [searchParams, setSearchParams, preserveCurrentParams]);

  // Clear all query parameters
  const clearQueryParams = useCallback((options?: { replace?: boolean }) => {
    setSearchParams(new URLSearchParams(), { replace: options?.replace });
    clearPreservedParams();
  }, [setSearchParams, clearPreservedParams]);

  // Get a specific route parameter
  const getRouteParam = useCallback((key: string, defaultValue?: string): string | undefined => {
    return (routeParams as Record<string, string>)[key] || defaultValue;
  }, [routeParams]);

  // Navigate with parameters using URL state manager
  const navigateWithParams = useCallback((
    path: string,
    params?: Record<string, string>,
    options?: { replace?: boolean; preserveQuery?: boolean; preserveRoute?: boolean }
  ) => {
    urlStateManager.handleNavigationWithPersistence(
      params ? buildPathWithParams(path, params) : path,
      navigate,
      {
        preserveQuery: options?.preserveQuery,
        preserveRoute: options?.preserveRoute,
        mergeParams: params,
        replace: options?.replace
      }
    );
  }, [navigate, urlStateManager]);

  // Update URL without navigation (useful for filters, search, etc.)
  const updateUrl = useCallback((
    params: Record<string, string | null>,
    options?: { replace?: boolean; preserve?: boolean }
  ) => {
    const currentUrl = new URL(window.location.href);

    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        currentUrl.searchParams.delete(key);
      } else {
        currentUrl.searchParams.set(key, value);
      }
    });

    const newPath = currentUrl.pathname + currentUrl.search + currentUrl.hash;

    if (options?.preserve) {
      preserveCurrentParams(Object.keys(params));
    }

    navigate(newPath, { replace: options?.replace });
  }, [navigate, preserveCurrentParams]);

  // Restore parameters from preserved state
  const restoreParams = useCallback((key: string = 'preserved') => {
    return urlStateManager.restorePreservedState(navigate, key, { replace: true });
  }, [urlStateManager, navigate]);

  // Preserve current parameters
  const preserveParams = useCallback((paramsToPreserve?: string[], key: string = 'preserved') => {
    const snapshot = urlStateManager.createSnapshot(
      location,
      routeParams as Record<string, string>
    );
    urlStateManager.saveSnapshot(snapshot, key);

    if (paramsToPreserve) {
      preserveCurrentParams(paramsToPreserve);
    }
  }, [urlStateManager, location, routeParams, preserveCurrentParams]);

  // Check if a parameter exists
  const hasQueryParam = useCallback((key: string): boolean => {
    return searchParams.has(key);
  }, [searchParams]);

  const hasRouteParam = useCallback((key: string): boolean => {
    return key in (routeParams as Record<string, string>);
  }, [routeParams]);

  // Get parameter validation status
  const isValidParam = useCallback((key: string, validator: (value: string) => boolean): boolean => {
    const value = getQueryParam(key) || getRouteParam(key);
    return value ? validator(value) : false;
  }, [getQueryParam, getRouteParam]);

  // Merge with preserved parameters
  const mergeWithPreserved = useCallback((newParams: Record<string, string>, key: string = 'current') => {
    return urlStateManager.mergeWithPreservedParams(newParams, key);
  }, [urlStateManager]);

  // Validate current URL parameters
  const validateCurrentParams = useCallback((validators: {
    queryValidators?: Record<string, (value: string) => boolean>;
    routeValidators?: Record<string, (value: string) => boolean>;
  }) => {
    return urlStateManager.validateAndPreserveParams(
      location,
      routeParams as Record<string, string>,
      validators
    );
  }, [urlStateManager, location, routeParams]);

  // Get validation errors for current parameters
  const getParamValidationErrors = useCallback((validators: {
    queryValidators?: Record<string, (value: string) => boolean>;
    routeValidators?: Record<string, (value: string) => boolean>;
  }) => {
    const validation = validateCurrentParams(validators);
    return validation.errors;
  }, [validateCurrentParams]);

  // Check if all current parameters are valid
  const areParamsValid = useCallback((validators: {
    queryValidators?: Record<string, (value: string) => boolean>;
    routeValidators?: Record<string, (value: string) => boolean>;
  }) => {
    const validation = validateCurrentParams(validators);
    return validation.isValid;
  }, [validateCurrentParams]);

  return {
    // Query parameters
    queryParams,
    getQueryParam,
    setQueryParam,
    setQueryParams,
    clearQueryParams,
    hasQueryParam,

    // Route parameters
    routeParams: routeParams as Record<string, string>,
    getRouteParam,
    hasRouteParam,

    // Navigation with parameters
    navigateWithParams,
    updateUrl,

    // Parameter persistence
    preserveParams,
    restoreParams,
    mergeWithPreserved,

    // Validation
    isValidParam,
    validateCurrentParams,
    getParamValidationErrors,
    areParamsValid,

    // Current location info
    pathname: location.pathname,
    search: location.search,
    hash: location.hash,
    fullPath: location.pathname + location.search + location.hash
  };
}

/**
 * Hook for managing specific parameter types with validation
 */
export function useTypedUrlParams<T extends Record<string, any>>(
  paramConfig: {
    [K in keyof T]: {
      type: 'query' | 'route';
      validator?: (value: string) => boolean;
      parser?: (value: string) => T[K];
      serializer?: (value: T[K]) => string;
      defaultValue?: T[K];
    };
  }
) {
  const {
    queryParams,
    routeParams,
    getQueryParam,
    getRouteParam,
    setQueryParams
  } = useUrlParams();

  // Get typed parameters
  const getTypedParams = useCallback((): Partial<T> => {
    const result: Partial<T> = {};

    Object.entries(paramConfig).forEach(([key, config]) => {
      const rawValue = config.type === 'query'
        ? getQueryParam(key)
        : getRouteParam(key);

      if (rawValue) {
        if (config.validator && !config.validator(rawValue)) {
          return; // Skip invalid values
        }

        result[key as keyof T] = config.parser
          ? config.parser(rawValue)
          : rawValue as T[keyof T];
      } else if (config.defaultValue !== undefined) {
        result[key as keyof T] = config.defaultValue;
      }
    });

    return result;
  }, [paramConfig, getQueryParam, getRouteParam]);

  // Set typed parameters
  const setTypedParams = useCallback((params: Partial<T>, options?: { replace?: boolean; preserve?: boolean }) => {
    const serializedParams: Record<string, string | null> = {};

    Object.entries(params).forEach(([key, value]) => {
      const config = paramConfig[key as keyof T];
      if (!config || config.type !== 'query') return; // Only handle query params

      if (value === null || value === undefined) {
        serializedParams[key] = null;
      } else {
        serializedParams[key] = config.serializer
          ? config.serializer(value)
          : String(value);
      }
    });

    if (Object.keys(serializedParams).length > 0) {
      setQueryParams(serializedParams, { ...options, merge: true });
    }
  }, [paramConfig, setQueryParams]);

  const typedParams = useMemo(() => getTypedParams(), [getTypedParams]);

  return {
    params: typedParams,
    setParams: setTypedParams,
    getTypedParams,

    // Raw access
    queryParams,
    routeParams
  };
}