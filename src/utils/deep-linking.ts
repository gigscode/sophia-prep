/**
 * Deep Linking Utilities
 * 
 * Provides comprehensive deep linking support for all route types,
 * bookmark functionality, and URL validation for external sharing.
 */

import { RouteConfig, getRouteConfig, extractRouteParams } from '../config/routes';
import { validateAndSanitizeUrl, validateRouteParams, validateQuizParams } from './route-validation';
import { UrlStateManager, UrlStateSnapshot } from './url-state-manager';
import { normalizePath, extractQueryParams, buildPathWithParams } from './navigation';

/**
 * Deep link validation result
 */
export interface DeepLinkValidation {
  isValid: boolean;
  routeConfig?: RouteConfig;
  routeParams?: Record<string, string>;
  queryParams?: Record<string, string>;
  errors: string[];
  sanitizedUrl?: string;
  requiresAuth?: boolean;
  requiresAdmin?: boolean;
}

/**
 * Bookmark data structure
 */
export interface BookmarkData {
  url: string;
  title: string;
  description?: string;
  timestamp: number;
  routePath?: string;
  isValid: boolean;
}

/**
 * Share URL configuration
 */
export interface ShareUrlConfig {
  includeQueryParams?: boolean;
  includeHash?: boolean;
  preserveState?: boolean;
  customTitle?: string;
  customDescription?: string;
}

/**
 * Deep Link Manager class for handling all deep linking functionality
 */
export class DeepLinkManager {
  private urlStateManager: UrlStateManager;

  constructor(urlStateManager?: UrlStateManager) {
    this.urlStateManager = urlStateManager || new UrlStateManager({
      preserveAllQueryParams: true,
      preserveRouteParams: true,
      preserveHash: true
    });
  }

  /**
   * Validates a deep link URL and extracts route information
   */
  validateDeepLink(url: string): DeepLinkValidation {
    const errors: string[] = [];
    
    try {
      // First, validate and sanitize the URL
      const urlValidation = validateAndSanitizeUrl(url);
      if (!urlValidation.isValid) {
        return {
          isValid: false,
          errors: urlValidation.errors
        };
      }

      const sanitizedUrl = urlValidation.sanitizedUrl;
      const urlObj = new URL(sanitizedUrl, window.location.origin);
      const pathname = normalizePath(urlObj.pathname);
      
      // Find matching route configuration
      const routeConfig = getRouteConfig(pathname);
      if (!routeConfig) {
        errors.push(`No route configuration found for path: ${pathname}`);
        return {
          isValid: false,
          errors,
          sanitizedUrl
        };
      }

      // Extract route parameters
      const routeParams = extractRouteParams(pathname, routeConfig);
      
      // Validate route parameters if configuration exists
      if (routeConfig.paramValidation) {
        const paramValidation = validateRouteParams(routeParams, routeConfig.paramValidation);
        if (!paramValidation.isValid) {
          errors.push(...paramValidation.errors);
        }
      }

      // Extract and validate query parameters
      const queryParams = extractQueryParams(urlObj.pathname + urlObj.search);

      // Special validation for quiz routes
      if (routeConfig.path.startsWith('/quiz')) {
        const searchParams = new URLSearchParams(urlObj.search);
        const quizValidation = validateQuizParams(searchParams);
        if (!quizValidation.isValid) {
          errors.push(...quizValidation.errors);
        }
      }

      return {
        isValid: errors.length === 0,
        routeConfig,
        routeParams,
        queryParams,
        errors,
        sanitizedUrl,
        requiresAuth: routeConfig.requireAuth,
        requiresAdmin: routeConfig.requireAdmin
      };
    } catch (error) {
      errors.push(`Invalid URL format: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        isValid: false,
        errors
      };
    }
  }

  /**
   * Handles deep link navigation with proper authentication flow
   */
  async handleDeepLink(
    url: string,
    navigate: (path: string, options?: any) => void,
    currentUser?: { isAdmin?: boolean } | null
  ): Promise<{ success: boolean; redirectPath?: string; errors?: string[] }> {
    const validation = this.validateDeepLink(url);
    
    if (!validation.isValid) {
      return {
        success: false,
        errors: validation.errors
      };
    }

    const { routeConfig, sanitizedUrl, requiresAuth, requiresAdmin } = validation;
    
    // Check authentication requirements
    if (requiresAuth && !currentUser) {
      // Store intended destination for post-login redirect
      sessionStorage.setItem('pendingRedirect', sanitizedUrl!);
      return {
        success: true,
        redirectPath: '/login'
      };
    }

    // Check admin requirements
    if (requiresAdmin && (!currentUser || !currentUser.isAdmin)) {
      return {
        success: false,
        errors: ['Admin privileges required to access this page']
      };
    }

    // Create URL state snapshot for the deep link
    const urlObj = new URL(sanitizedUrl!, window.location.origin);
    const location = {
      pathname: urlObj.pathname,
      search: urlObj.search,
      hash: urlObj.hash
    };
    
    const snapshot = this.urlStateManager.createSnapshot(
      location,
      validation.routeParams || {},
      routeConfig?.path
    );
    
    // Save snapshot for state restoration
    this.urlStateManager.saveSnapshot(snapshot, 'deepLink');

    // Navigate to the deep link
    try {
      navigate(sanitizedUrl!, { replace: false });
      return { success: true };
    } catch (navError) {
      return {
        success: false,
        errors: [`Navigation failed: ${navError instanceof Error ? navError.message : 'Unknown error'}`]
      };
    }
  }

  /**
   * Creates a bookmark for the current page
   */
  createBookmark(
    currentLocation: { pathname: string; search: string; hash: string },
    routeConfig?: RouteConfig,
    customTitle?: string,
    customDescription?: string
  ): BookmarkData {
    const fullUrl = currentLocation.pathname + currentLocation.search + currentLocation.hash;
    
    // For bookmark creation, we're more lenient with validation
    // If we have a route config, assume it's valid, otherwise do basic validation
    let isValid = true;
    if (!routeConfig) {
      const validation = this.validateDeepLink(fullUrl);
      isValid = validation.isValid;
    }
    
    // Generate title from route config or use custom title
    let title = customTitle;
    if (!title && routeConfig?.title) {
      title = routeConfig.title;
    } else if (!title) {
      // Generate title from pathname
      const segments = currentLocation.pathname.split('/').filter(Boolean);
      title = segments.length > 0 
        ? segments.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' - ') + ' - Sophia Prep'
        : 'Sophia Prep';
    }

    // Generate description from route config or use custom description
    let description = customDescription;
    if (!description && routeConfig?.description) {
      description = routeConfig.description;
    }

    return {
      url: fullUrl,
      title,
      description,
      timestamp: Date.now(),
      routePath: routeConfig?.path,
      isValid
    };
  }

  /**
   * Creates a shareable URL with optional configuration
   */
  createShareUrl(
    currentLocation: { pathname: string; search: string; hash: string },
    config: ShareUrlConfig = {}
  ): { url: string; title: string; description?: string } {
    const {
      includeQueryParams = true,
      includeHash = false,
      preserveState = false,
      customTitle,
      customDescription
    } = config;

    let shareUrl = currentLocation.pathname;

    // Add query parameters if requested
    if (includeQueryParams && currentLocation.search) {
      shareUrl += currentLocation.search;
    }

    // Add hash if requested
    if (includeHash && currentLocation.hash) {
      shareUrl += currentLocation.hash;
    }

    // Preserve state if requested
    if (preserveState) {
      const routeConfig = getRouteConfig(currentLocation.pathname);
      const routeParams = routeConfig ? extractRouteParams(currentLocation.pathname, routeConfig) : {};
      
      const snapshot = this.urlStateManager.createSnapshot(
        currentLocation,
        routeParams,
        routeConfig?.path
      );
      
      this.urlStateManager.saveSnapshot(snapshot, 'shared');
    }

    // Get route configuration for metadata
    const routeConfig = getRouteConfig(currentLocation.pathname);
    
    const title = customTitle || routeConfig?.title || 'Sophia Prep';
    const description = customDescription || routeConfig?.description;

    return {
      url: shareUrl,
      title,
      description
    };
  }

  /**
   * Validates external URLs for safety
   */
  validateExternalUrl(url: string): { isValid: boolean; isSafe: boolean; errors: string[] } {
    const errors: string[] = [];
    let isValid = false;
    let isSafe = false;

    try {
      const urlObj = new URL(url);
      isValid = true;

      // Check protocol safety
      const safeProtocols = ['http:', 'https:', 'mailto:', 'tel:'];
      if (!safeProtocols.includes(urlObj.protocol)) {
        errors.push(`Unsafe protocol: ${urlObj.protocol}`);
      } else {
        isSafe = true;
      }

      // Check for suspicious patterns
      const suspiciousPatterns = [
        /javascript:/i,
        /data:/i,
        /vbscript:/i,
        /file:/i,
        /ftp:/i
      ];

      if (suspiciousPatterns.some(pattern => pattern.test(url))) {
        errors.push('URL contains suspicious patterns');
        isSafe = false;
      }

      // Check hostname for suspicious patterns
      if (urlObj.hostname) {
        const suspiciousHosts = [
          /localhost/i,
          /127\.0\.0\.1/,
          /0\.0\.0\.0/,
          /\d+\.\d+\.\d+\.\d+/ // Raw IP addresses (potentially suspicious)
        ];

        if (suspiciousHosts.some(pattern => pattern.test(urlObj.hostname))) {
          errors.push('URL points to potentially unsafe hostname');
          isSafe = false;
        }
      }

    } catch (error) {
      errors.push('Invalid URL format');
    }

    return { isValid, isSafe, errors };
  }

  /**
   * Generates a complete deep link with all necessary parameters
   */
  generateDeepLink(
    routePath: string,
    routeParams: Record<string, string> = {},
    queryParams: Record<string, string> = {},
    hash?: string
  ): { url: string; isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      // Find route configuration
      const routeConfig = getRouteConfig(routePath);
      if (!routeConfig) {
        errors.push(`No route configuration found for path: ${routePath}`);
        return { url: '', isValid: false, errors };
      }

      // Build path with route parameters
      let path = routeConfig.path;
      Object.entries(routeParams).forEach(([key, value]) => {
        path = path.replace(`:${key}`, encodeURIComponent(value));
      });

      // Validate that all required parameters are provided
      if (path.includes(':')) {
        const missingParams = path.match(/:(\w+)/g)?.map(p => p.substring(1)) || [];
        errors.push(`Missing required parameters: ${missingParams.join(', ')}`);
        return { url: '', isValid: false, errors };
      }

      // Add query parameters
      const fullPath = buildPathWithParams(path, queryParams);
      
      // Add hash if provided
      const finalUrl = fullPath + (hash ? `#${hash}` : '');

      // Validate the generated URL
      const validation = this.validateDeepLink(finalUrl);
      if (!validation.isValid) {
        errors.push(...validation.errors);
      }

      return {
        url: finalUrl,
        isValid: validation.isValid,
        errors
      };
    } catch (error) {
      errors.push(`Failed to generate deep link: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { url: '', isValid: false, errors };
    }
  }

  /**
   * Restores state from a shared URL
   */
  restoreSharedState(
    navigate: (path: string, options?: any) => void
  ): boolean {
    return this.urlStateManager.restorePreservedState(navigate, 'shared', { replace: true });
  }

  /**
   * Gets all supported route patterns for deep linking
   */
  getSupportedRoutes(): Array<{ path: string; requiresAuth: boolean; requiresAdmin: boolean; description?: string }> {
    // Import routeConfigs dynamically to avoid circular dependencies in tests
    try {
      const { routeConfigs } = require('../config/routes');
      
      return routeConfigs.map((config: RouteConfig) => ({
        path: config.path,
        requiresAuth: config.requireAuth || false,
        requiresAdmin: config.requireAdmin || false,
        description: config.description
      }));
    } catch (error) {
      // Fallback for tests or when routes are not available
      return [];
    }
  }

  /**
   * Checks if a URL is a valid internal deep link
   */
  isValidInternalDeepLink(url: string): boolean {
    try {
      // Handle relative URLs
      if (url.startsWith('/')) {
        // For relative URLs, just check if they have a valid format
        return this.validateDeepLink(url).isValid;
      }
      
      const urlObj = new URL(url, window.location.origin);
      
      // Must be same origin
      if (urlObj.origin !== window.location.origin) {
        return false;
      }

      const validation = this.validateDeepLink(urlObj.pathname + urlObj.search + urlObj.hash);
      return validation.isValid;
    } catch {
      return false;
    }
  }

  /**
   * Extracts route information from a deep link
   */
  extractRouteInfo(url: string): {
    routePath?: string;
    routeParams?: Record<string, string>;
    queryParams?: Record<string, string>;
    requiresAuth?: boolean;
    requiresAdmin?: boolean;
  } {
    const validation = this.validateDeepLink(url);
    
    if (!validation.isValid || !validation.routeConfig) {
      return {};
    }

    return {
      routePath: validation.routeConfig.path,
      routeParams: validation.routeParams,
      queryParams: validation.queryParams,
      requiresAuth: validation.requiresAuth,
      requiresAdmin: validation.requiresAdmin
    };
  }
}

/**
 * Default deep link manager instance
 */
export const defaultDeepLinkManager = new DeepLinkManager();

/**
 * Hook for using deep linking functionality in React components
 */
export function useDeepLinking(urlStateManager?: UrlStateManager) {
  const manager = urlStateManager ? new DeepLinkManager(urlStateManager) : defaultDeepLinkManager;
  
  return {
    validateDeepLink: manager.validateDeepLink.bind(manager),
    handleDeepLink: manager.handleDeepLink.bind(manager),
    createBookmark: manager.createBookmark.bind(manager),
    createShareUrl: manager.createShareUrl.bind(manager),
    validateExternalUrl: manager.validateExternalUrl.bind(manager),
    generateDeepLink: manager.generateDeepLink.bind(manager),
    restoreSharedState: manager.restoreSharedState.bind(manager),
    getSupportedRoutes: manager.getSupportedRoutes.bind(manager),
    isValidInternalDeepLink: manager.isValidInternalDeepLink.bind(manager),
    extractRouteInfo: manager.extractRouteInfo.bind(manager)
  };
}

/**
 * Utility functions for common deep linking operations
 */

/**
 * Creates a bookmark for the current page
 */
export function createCurrentPageBookmark(customTitle?: string, customDescription?: string): BookmarkData {
  const location = {
    pathname: window.location.pathname,
    search: window.location.search,
    hash: window.location.hash
  };
  
  const routeConfig = getRouteConfig(location.pathname);
  return defaultDeepLinkManager.createBookmark(location, routeConfig, customTitle, customDescription);
}

/**
 * Creates a shareable URL for the current page
 */
export function createCurrentPageShareUrl(config?: ShareUrlConfig): { url: string; title: string; description?: string } {
  const location = {
    pathname: window.location.pathname,
    search: window.location.search,
    hash: window.location.hash
  };
  
  return defaultDeepLinkManager.createShareUrl(location, config);
}

/**
 * Validates if a URL is safe to navigate to
 */
export function isSafeUrl(url: string): boolean {
  try {
    // Handle relative URLs (internal)
    if (url.startsWith('/')) {
      // Basic validation for internal paths
      return !url.includes('<') && !url.includes('>') && !url.includes('javascript:');
    }
    
    // Check if it's an internal URL first
    if (defaultDeepLinkManager.isValidInternalDeepLink(url)) {
      return true;
    }
    
    // Check external URL safety
    const validation = defaultDeepLinkManager.validateExternalUrl(url);
    return validation.isValid && validation.isSafe;
  } catch {
    return false;
  }
}

/**
 * Generates a deep link to a specific route
 */
export function generateRouteDeepLink(
  routePath: string,
  routeParams?: Record<string, string>,
  queryParams?: Record<string, string>,
  hash?: string
): string {
  const result = defaultDeepLinkManager.generateDeepLink(routePath, routeParams, queryParams, hash);
  return result.isValid ? result.url : '';
}