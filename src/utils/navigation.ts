/**
 * Navigation utilities for URL and history management
 * Supports the NavigationStateProvider with helper functions
 */

/**
 * Validates if a URL path is valid for the application
 * @param path - The path to validate
 * @returns boolean indicating if the path is valid
 */
export function isValidPath(path: string): boolean {
  try {
    // Basic validation - must start with /
    if (!path.startsWith('/')) {
      return false;
    }

    // Check for dangerous characters
    const dangerousChars = ['<', '>', '"', "'", '&'];
    if (dangerousChars.some(char => path.includes(char))) {
      return false;
    }

    // Try to create a URL to validate structure
    new URL(path, 'http://localhost');
    return true;
  } catch {
    return false;
  }
}

/**
 * Extracts query parameters from a URL path
 * @param path - The full path including query string
 * @returns Object containing query parameters
 */
export function extractQueryParams(path: string): Record<string, string> {
  try {
    const url = new URL(path, 'http://localhost');
    const params: Record<string, string> = {};
    
    url.searchParams.forEach((value, key) => {
      params[key] = value;
    });
    
    return params;
  } catch {
    return {};
  }
}

/**
 * Builds a URL path with query parameters
 * @param basePath - The base path without query string
 * @param params - Object containing query parameters
 * @returns Complete path with query string
 */
export function buildPathWithParams(basePath: string, params: Record<string, string>): string {
  try {
    const url = new URL(basePath, 'http://localhost');
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, value);
      }
    });
    
    return url.pathname + url.search + url.hash;
  } catch {
    return basePath;
  }
}

/**
 * Normalizes a path by removing duplicate slashes and ensuring proper format
 * @param path - The path to normalize
 * @returns Normalized path
 */
export function normalizePath(path: string): string {
  if (!path) return '/';
  
  // Remove duplicate slashes
  let normalized = path.replace(/\/+/g, '/');
  
  // Ensure starts with /
  if (!normalized.startsWith('/')) {
    normalized = '/' + normalized;
  }
  
  // Remove trailing slash unless it's the root
  if (normalized.length > 1 && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }
  
  return normalized;
}

/**
 * Checks if the current path matches a pattern
 * @param currentPath - The current path
 * @param pattern - The pattern to match (supports wildcards with *)
 * @returns boolean indicating if the path matches
 */
export function pathMatches(currentPath: string, pattern: string): boolean {
  // Convert pattern to regex
  const regexPattern = pattern
    .replace(/\*/g, '.*')
    .replace(/\?/g, '\\?');
  
  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(currentPath);
}

/**
 * Gets the route segments from a path
 * @param path - The path to parse
 * @returns Array of route segments
 */
export function getRouteSegments(path: string): string[] {
  const cleanPath = path.split('?')[0].split('#')[0]; // Remove query and hash
  return cleanPath.split('/').filter(segment => segment.length > 0);
}

/**
 * Checks if a path requires authentication based on common patterns
 * @param path - The path to check
 * @returns boolean indicating if authentication is likely required
 */
export function pathRequiresAuth(path: string): boolean {
  const authRequiredPatterns = [
    '/profile',
    '/admin',
    '/dashboard',
    '/settings',
    '/account'
  ];
  
  return authRequiredPatterns.some(pattern => 
    path.startsWith(pattern) || pathMatches(path, pattern + '/*')
  );
}

/**
 * Preserves URL state across navigation by storing in sessionStorage
 * @param key - Storage key
 * @param value - Value to store
 */
export function preserveUrlState(key: string, value: any): void {
  try {
    sessionStorage.setItem(`nav_${key}`, JSON.stringify(value));
  } catch (error) {
    console.warn('Failed to preserve URL state:', error);
  }
}

/**
 * Retrieves preserved URL state from sessionStorage
 * @param key - Storage key
 * @returns Retrieved value or null
 */
export function getPreservedUrlState(key: string): any {
  try {
    const stored = sessionStorage.getItem(`nav_${key}`);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.warn('Failed to retrieve URL state:', error);
    return null;
  }
}

/**
 * Clears preserved URL state
 * @param key - Storage key to clear, or undefined to clear all navigation state
 */
export function clearPreservedUrlState(key?: string): void {
  try {
    if (key) {
      sessionStorage.removeItem(`nav_${key}`);
    } else {
      // Clear all navigation-related state
      for (let i = 0; i < sessionStorage.length; i++) {
        const storageKey = sessionStorage.key(i);
        if (storageKey && storageKey.startsWith('nav_')) {
          sessionStorage.removeItem(storageKey);
          i--; // Adjust index since we removed an item
        }
      }
    }
  } catch (error) {
    console.warn('Failed to clear URL state:', error);
  }
}

/**
 * Preserves query parameters across navigation
 * @param currentParams - Current URLSearchParams
 * @param paramsToPreserve - Array of parameter names to preserve
 * @returns Preserved parameters as object
 */
export function preserveQueryParams(
  currentParams: URLSearchParams, 
  paramsToPreserve: string[]
): Record<string, string> {
  const preserved: Record<string, string> = {};
  
  paramsToPreserve.forEach(paramName => {
    const value = currentParams.get(paramName);
    if (value !== null) {
      preserved[paramName] = value;
    }
  });
  
  // Store in session storage for persistence across refreshes
  preserveUrlState('queryParams', preserved);
  
  return preserved;
}

/**
 * Merges preserved query parameters with new parameters
 * @param newParams - New parameters to add
 * @param preserveExisting - Whether to preserve existing parameters
 * @returns Merged parameters
 */
export function mergeQueryParams(
  newParams: Record<string, string>,
  preserveExisting: boolean = true
): Record<string, string> {
  let merged = { ...newParams };
  
  if (preserveExisting) {
    const preserved = getPreservedUrlState('queryParams') || {};
    merged = { ...preserved, ...newParams };
  }
  
  return merged;
}

/**
 * Restores query parameters from storage and applies them to current URL
 * @param navigate - React Router navigate function
 * @param currentPath - Current path without query parameters
 */
export function restoreQueryParams(
  navigate: (path: string, options?: any) => void,
  currentPath: string
): void {
  try {
    const preserved = getPreservedUrlState('queryParams');
    if (preserved && Object.keys(preserved).length > 0) {
      const newPath = buildPathWithParams(currentPath, preserved);
      if (newPath !== currentPath) {
        navigate(newPath, { replace: true });
      }
    }
  } catch (error) {
    console.warn('Failed to restore query parameters:', error);
  }
}

/**
 * Validates and preserves route parameters across navigation
 * @param routeParams - Current route parameters
 * @param routePath - Current route path pattern
 */
export function preserveRouteParams(
  routeParams: Record<string, string>,
  routePath: string
): void {
  try {
    const routeState = {
      params: routeParams,
      path: routePath,
      timestamp: Date.now()
    };
    
    preserveUrlState('routeParams', routeState);
  } catch (error) {
    console.warn('Failed to preserve route parameters:', error);
  }
}

/**
 * Gets preserved route parameters for a specific route
 * @param routePath - Route path pattern to match
 * @returns Preserved parameters or null
 */
export function getPreservedRouteParams(routePath: string): Record<string, string> | null {
  try {
    const routeState = getPreservedUrlState('routeParams');
    if (routeState && routeState.path === routePath) {
      // Check if the preserved state is not too old (1 hour)
      const maxAge = 60 * 60 * 1000; // 1 hour in milliseconds
      if (Date.now() - routeState.timestamp < maxAge) {
        return routeState.params;
      }
    }
    return null;
  } catch (error) {
    console.warn('Failed to get preserved route parameters:', error);
    return null;
  }
}

/**
 * Creates a complete URL state snapshot for persistence
 * @param location - Current location object
 * @param params - Route parameters
 * @returns URL state snapshot
 */
export function createUrlStateSnapshot(
  location: { pathname: string; search: string; hash: string },
  params: Record<string, string> = {}
): {
  pathname: string;
  search: string;
  hash: string;
  params: Record<string, string>;
  queryParams: Record<string, string>;
  timestamp: number;
} {
  return {
    pathname: location.pathname,
    search: location.search,
    hash: location.hash,
    params,
    queryParams: extractQueryParams(location.pathname + location.search),
    timestamp: Date.now()
  };
}

/**
 * Restores complete URL state from snapshot
 * @param snapshot - URL state snapshot
 * @param navigate - React Router navigate function
 * @param options - Navigation options
 */
export function restoreUrlStateFromSnapshot(
  snapshot: ReturnType<typeof createUrlStateSnapshot>,
  navigate: (path: string, options?: any) => void,
  options: { replace?: boolean } = {}
): void {
  try {
    const fullPath = snapshot.pathname + snapshot.search + snapshot.hash;
    navigate(fullPath, options);
  } catch (error) {
    console.warn('Failed to restore URL state from snapshot:', error);
  }
}