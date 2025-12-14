/**
 * Route Parameter Validator Component
 * 
 * Validates route parameters and provides error handling
 * for invalid or malformed parameters.
 */

import { ReactNode, useEffect, useState } from 'react';
import { useParams, useSearchParams, Navigate, useLocation } from 'react-router-dom';
import { RouteConfig, extractRouteParams } from '../../config/routes';
import { validateRouteParams, validateQuizParams, validateAndSanitizeUrl } from '../../utils/route-validation';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useNavigation } from '../../hooks/useNavigation';
import { appParameterPersistence } from '../../utils/url-parameter-persistence';

interface RouteParamValidatorProps {
  children: ReactNode;
  routeConfig: RouteConfig;
  fallbackPath?: string;
}

/**
 * RouteParamValidator validates route parameters based on configuration
 * and provides appropriate error handling for invalid parameters.
 */
export function RouteParamValidator({
  children,
  routeConfig,
  fallbackPath = '/404'
}: RouteParamValidatorProps) {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { updateRouteParams, preserveCurrentParams } = useNavigation();
  const [validationState, setValidationState] = useState<{
    isValidating: boolean;
    isValid: boolean;
    errors: string[];
    sanitizedUrl?: string;
  }>({
    isValidating: true,
    isValid: false,
    errors: []
  });

  useEffect(() => {
    const validateParameters = async () => {
      setValidationState({ isValidating: true, isValid: false, errors: [] });

      try {
        const errors: string[] = [];
        let sanitizedUrl: string | undefined;

        // First, validate and sanitize the complete URL
        const fullUrl = location.pathname + location.search + location.hash;
        const urlValidation = validateAndSanitizeUrl(fullUrl);
        
        if (!urlValidation.isValid) {
          errors.push(...urlValidation.errors);
        } else {
          sanitizedUrl = urlValidation.sanitizedUrl;
        }

        // Validate route parameters if configuration exists
        if (routeConfig.paramValidation) {
          const routeParamValidation = validateRouteParams(params, routeConfig.paramValidation);
          if (!routeParamValidation.isValid) {
            errors.push(...routeParamValidation.errors);
          }
        }

        // Special validation for quiz routes with query parameters
        if (routeConfig.path.startsWith('/quiz')) {
          const quizParamValidation = validateQuizParams(searchParams);
          if (!quizParamValidation.isValid) {
            errors.push(...quizParamValidation.errors);
          }
        }

        // Additional custom validation based on route path
        if (routeConfig.path === '/subjects/:slug') {
          const slug = params.slug;
          if (slug && slug.length > 100) {
            errors.push('Subject identifier is too long');
          }
        }

        // If validation passes, update route parameters and preserve state
        if (errors.length === 0) {
          updateRouteParams(params as Record<string, string>);
          
          // Preserve query parameters for important routes
          const importantRoutes = ['/quiz', '/practice', '/study'];
          if (importantRoutes.some(route => routeConfig.path.startsWith(route))) {
            preserveCurrentParams();
          }
          
          // Use the enhanced parameter persistence utility
          const preservationResult = appParameterPersistence.preserveParameters(
            location,
            params as Record<string, string>,
            routeConfig.path
          );
          
          if (!preservationResult.success) {
            errors.push(...preservationResult.errors);
          }
        }

        setValidationState({
          isValidating: false,
          isValid: errors.length === 0,
          errors,
          sanitizedUrl
        });
      } catch (error) {
        console.error('Route parameter validation failed:', error);
        setValidationState({
          isValidating: false,
          isValid: false,
          errors: ['Parameter validation failed']
        });
      }
    };

    validateParameters();
  }, [params, searchParams, routeConfig, location, updateRouteParams, preserveCurrentParams]);

  // Show loading while validating
  if (validationState.isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Redirect to fallback if validation failed
  if (!validationState.isValid) {
    console.warn('Route parameter validation failed:', {
      path: routeConfig.path,
      params,
      searchParams: Object.fromEntries(searchParams.entries()),
      errors: validationState.errors
    });

    // For development, show detailed error information
    if (import.meta.env.DEV) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
          <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">Invalid Parameters</h1>
            <p className="text-gray-600 mb-4 text-center">
              The URL contains invalid parameters.
            </p>
            <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
              <h3 className="font-semibold text-red-800 mb-2">Validation Errors:</h3>
              <ul className="text-sm text-red-700 space-y-1">
                {validationState.errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => window.history.back()}
                className="w-full py-2 px-4 bg-gray-900 text-white rounded hover:bg-gray-800 transition-colors"
              >
                Go Back
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="w-full py-2 px-4 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
              >
                Go to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    // In production, redirect to fallback path
    return <Navigate to={fallbackPath} replace />;
  }

  // Parameters are valid, render children
  return <>{children}</>;
}

/**
 * Higher-order component to wrap routes with parameter validation
 */
export function withRouteParamValidation<P extends object>(
  Component: React.ComponentType<P>,
  routeConfig: RouteConfig,
  fallbackPath?: string
) {
  return function ValidatedRoute(props: P) {
    return (
      <RouteParamValidator routeConfig={routeConfig} fallbackPath={fallbackPath}>
        <Component {...props} />
      </RouteParamValidator>
    );
  };
}

/**
 * Hook to get validated route parameters
 */
export function useValidatedParams(routeConfig: RouteConfig) {
  const params = useParams();
  const [searchParams] = useSearchParams();
  
  return {
    params,
    searchParams,
    extractedParams: extractRouteParams(window.location.pathname, routeConfig)
  };
}