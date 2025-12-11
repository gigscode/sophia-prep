/**
 * URL Parameter Persistence Utility
 * 
 * Comprehensive utility for managing URL parameter persistence
 * across navigation and page refreshes with validation support.
 */

import { 
  extractQueryParams, 
  buildPathWithParams, 
  normalizePath,
  preserveUrlState,
  getPreservedUrlState,
  clearPreservedUrlState
} from './navigation';
import { 
  validateSlug, 
  validateNumericId, 
  validateQuizMode, 
  validateClassCategory,
  sanitizeRouteParam,
  validateAndSanitizeUrl
} from './route-validation';
import { UrlStateManager, UrlStateSnapshot } from './url-state-manager';

/**
 * Parameter persistence configuration
 */
export interface ParameterPersistenceConfig {
  // Query parameter settings
  preserveAllQueryParams?: boolean;
  preserveSpecificQueryParams?: string[];
  queryParamValidators?: Record<string, (value: string) => boolean>;
  
  // Route parameter settings
  preserveRouteParams?: boolean;
  routeParamValidators?: Record<string, (value: string) => boolean>;
  
  // Persistence settings
  maxAge?: number; // Maximum age in milliseconds
  storagePrefix?: string;
  
  // Error handling
  onValidationError?: (errors: string[]) => void;
  fallbackPath?: string;
}

/**
 * Parameter persistence result
 */
export interface ParameterPersistenceResult {
  success: boolean;
  errors: string[];
  preservedParams?: {
    query: Record<string, string>;
    route: Record<string, string>;
  };
  sanitizedUrl?: string;
}

/**
 * URL Parameter Persistence Manager
 */
export class UrlParameterPersistence {
  private urlStateManager: UrlStateManager;
  private config: Required<ParameterPersistenceConfig>;

  constructor(config: ParameterPersistenceConfig = {}) {
    this.config = {
      preserveAllQueryParams: config.preserveAllQueryParams ?? true,
      preserveSpecificQueryParams: config.preserveSpecificQueryParams ?? [],
      queryParamValidators: config.queryParamValidators ?? {},
      preserveRouteParams: config.preserveRouteParams ?? true,
      routeParamValidators: config.routeParamValidators ?? {},
      maxAge: config.maxAge ?? 60 * 60 * 1000, // 1 hour
      storagePrefix: config.storagePrefix ?? 'urlParams',
      onValidationError: config.onValidationError ?? (() => {}),
      fallbackPath: config.fallbackPath ?? '/'
    };

    this.urlStateManager = new UrlStateManager({
      preserveAllQueryParams: this.config.preserveAllQueryParams,
      preserveQueryParams: this.config.preserveSpecificQueryParams,
      preserveRouteParams: this.config.preserveRouteParams,
      maxAge: this.config.maxAge,
      storageKey: this.config.storagePrefix
    });
  }

  /**
   * Preserves URL parameters with validation
   */
  preserveParameters(
    location: { pathname: string; search: string; hash: string },
    routeParams: Record<string, string> = {},
    routePath?: string
  ): ParameterPersistenceResult {
    try {
      const errors: string[] = [];
      
      // Validate and sanitize the URL first
      const urlValidation = validateAndSanitizeUrl(
        location.pathname + location.search + location.hash
      );
      
      if (!urlValidation.isValid) {
        errors.push(...urlValidation.errors);
      }

      // Extract and validate query parameters
      const queryParams = extractQueryParams(location.pathname + location.search);
      const validatedQueryParams: Record<string, string> = {};
      
      Object.entries(queryParams).forEach(([key, value]) => {
        const validator = this.config.queryParamValidators[key];
        if (validator) {
          if (validator(value)) {
            validatedQueryParams[key] = sanitizeRouteParam(value);
          } else {
            errors.push(`Invalid query parameter: ${key}=${value}`);
          }
        } else {
          // No validator, just sanitize
          validatedQueryParams[key] = sanitizeRouteParam(value);
        }
      });

      // Validate route parameters
      const validatedRouteParams: Record<string, string> = {};
      
      Object.entries(routeParams).forEach(([key, value]) => {
        const validator = this.config.routeParamValidators[key];
        if (validator) {
          if (validator(value)) {
            validatedRouteParams[key] = sanitizeRouteParam(value);
          } else {
            errors.push(`Invalid route parameter: ${key}=${value}`);
          }
        } else {
          // No validator, just sanitize
          validatedRouteParams[key] = sanitizeRouteParam(value);
        }
      });

      // If validation passes, preserve the parameters
      if (errors.length === 0) {
        const snapshot = this.urlStateManager.createSnapshot(
          {
            pathname: location.pathname,
            search: buildPathWithParams('', validatedQueryParams).substring(1), // Remove leading ?
            hash: location.hash
          },
          validatedRouteParams,
          routePath
        );
        
        this.urlStateManager.saveSnapshot(snapshot);
        
        return {
          success: true,
          errors: [],
          preservedParams: {
            query: validatedQueryParams,
            route: validatedRouteParams
          },
          sanitizedUrl: urlValidation.sanitizedUrl
        };
      }

      // Validation failed
      this.config.onValidationError(errors);
      return {
        success: false,
        errors
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Parameter preservation failed';
      return {
        success: false,
        errors: [errorMessage]
      };
    }
  }

  /**
   * Restores preserved parameters
   */
  restoreParameters(
    navigate: (path: string, options?: any) => void,
    currentLocation: { pathname: string; search: string },
    options: { replace?: boolean; key?: string } = {}
  ): ParameterPersistenceResult {
    try {
      const snapshot = this.urlStateManager.loadSnapshot(options.key || 'current');
      
      if (!snapshot) {
        return {
          success: false,
          errors: ['No preserved parameters found']
        };
      }

      // Check if we should restore (different from current location)
      if (!this.urlStateManager.shouldRestoreOnPageLoad(currentLocation)) {
        return {
          success: false,
          errors: ['Parameters already match current location']
        };
      }

      // Restore the URL state
      const restored = this.urlStateManager.restoreFromSnapshot(
        snapshot,
        navigate,
        { replace: options.replace }
      );

      if (restored) {
        return {
          success: true,
          errors: [],
          preservedParams: {
            query: snapshot.queryParams,
            route: snapshot.routeParams
          }
        };
      }

      return {
        success: false,
        errors: ['Failed to restore parameters']
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Parameter restoration failed';
      return {
        success: false,
        errors: [errorMessage]
      };
    }
  }

  /**
   * Handles navigation with parameter preservation
   */
  navigateWithPreservation(
    targetPath: string,
    navigate: (path: string, options?: any) => void,
    options: {
      preserveQuery?: boolean;
      preserveRoute?: boolean;
      newParams?: Record<string, string>;
      replace?: boolean;
    } = {}
  ): ParameterPersistenceResult {
    try {
      this.urlStateManager.handleNavigationWithPersistence(
        targetPath,
        navigate,
        {
          preserveQuery: options.preserveQuery,
          preserveRoute: options.preserveRoute,
          mergeParams: options.newParams,
          replace: options.replace
        }
      );

      return {
        success: true,
        errors: []
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Navigation with preservation failed';
      return {
        success: false,
        errors: [errorMessage]
      };
    }
  }

  /**
   * Validates current URL parameters
   */
  validateCurrentParameters(
    location: { pathname: string; search: string; hash: string },
    routeParams: Record<string, string> = {}
  ): ParameterPersistenceResult {
    const validation = this.urlStateManager.validateAndPreserveParams(
      location,
      routeParams,
      {
        queryValidators: this.config.queryParamValidators,
        routeValidators: this.config.routeParamValidators
      }
    );

    if (!validation.isValid) {
      this.config.onValidationError(validation.errors);
    }

    return {
      success: validation.isValid,
      errors: validation.errors,
      preservedParams: validation.sanitizedSnapshot ? {
        query: validation.sanitizedSnapshot.queryParams,
        route: validation.sanitizedSnapshot.routeParams
      } : undefined
    };
  }

  /**
   * Clears all preserved parameters
   */
  clearAllParameters(): void {
    this.urlStateManager.clearAllState();
  }

  /**
   * Gets current configuration
   */
  getConfiguration(): Required<ParameterPersistenceConfig> {
    return { ...this.config };
  }

  /**
   * Updates configuration
   */
  updateConfiguration(newConfig: Partial<ParameterPersistenceConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.urlStateManager.updateConfig({
      preserveAllQueryParams: this.config.preserveAllQueryParams,
      preserveQueryParams: this.config.preserveSpecificQueryParams,
      preserveRouteParams: this.config.preserveRouteParams,
      maxAge: this.config.maxAge,
      storageKey: this.config.storagePrefix
    });
  }
}

/**
 * Default parameter validators for common route types
 */
export const defaultParameterValidators = {
  // Query parameter validators
  query: {
    subject: validateSlug,
    mode: validateQuizMode,
    category: validateClassCategory,
    id: validateNumericId,
    page: validateNumericId,
    limit: validateNumericId,
    timeLimit: (value: string) => validateNumericId(value) && parseInt(value, 10) <= 300,
    questionCount: (value: string) => validateNumericId(value) && parseInt(value, 10) <= 100
  },
  
  // Route parameter validators
  route: {
    slug: validateSlug,
    id: validateNumericId,
    mode: validateQuizMode,
    category: validateClassCategory
  }
};

/**
 * Creates a configured URL parameter persistence instance for the application
 */
export function createAppParameterPersistence(
  customConfig: ParameterPersistenceConfig = {}
): UrlParameterPersistence {
  return new UrlParameterPersistence({
    preserveAllQueryParams: true,
    preserveRouteParams: true,
    queryParamValidators: {
      ...defaultParameterValidators.query,
      ...customConfig.queryParamValidators
    },
    routeParamValidators: {
      ...defaultParameterValidators.route,
      ...customConfig.routeParamValidators
    },
    maxAge: 60 * 60 * 1000, // 1 hour
    storagePrefix: 'soprep',
    fallbackPath: '/',
    ...customConfig
  });
}

/**
 * Default application parameter persistence instance
 */
export const appParameterPersistence = createAppParameterPersistence();

/**
 * React hook for URL parameter persistence
 */
export function useParameterPersistence(config?: ParameterPersistenceConfig) {
  const persistence = config ? new UrlParameterPersistence(config) : appParameterPersistence;
  
  return {
    preserveParameters: persistence.preserveParameters.bind(persistence),
    restoreParameters: persistence.restoreParameters.bind(persistence),
    navigateWithPreservation: persistence.navigateWithPreservation.bind(persistence),
    validateCurrentParameters: persistence.validateCurrentParameters.bind(persistence),
    clearAllParameters: persistence.clearAllParameters.bind(persistence),
    getConfiguration: persistence.getConfiguration.bind(persistence),
    updateConfiguration: persistence.updateConfiguration.bind(persistence)
  };
}