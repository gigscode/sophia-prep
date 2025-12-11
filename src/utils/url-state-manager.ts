/**
 * URL State Manager
 * 
 * Advanced URL state management for preserving navigation state,
 * query parameters, and route parameters across page refreshes
 * and navigation events.
 */

import {
  extractQueryParams,
  buildPathWithParams,
  normalizePath
} from './navigation';

/**
 * URL state configuration
 */
export interface UrlStateConfig {
  preserveQueryParams?: string[]; // Specific query params to preserve
  preserveAllQueryParams?: boolean; // Preserve all query params
  preserveRouteParams?: boolean; // Preserve route parameters
  preserveHash?: boolean; // Preserve URL hash
  maxAge?: number; // Maximum age in milliseconds before state expires
  storageKey?: string; // Custom storage key prefix
}

/**
 * URL state snapshot
 */
export interface UrlStateSnapshot {
  pathname: string;
  search: string;
  hash: string;
  queryParams: Record<string, string>;
  routeParams: Record<string, string>;
  timestamp: number;
  routePath?: string; // Route pattern for parameter matching
}

/**
 * URL State Manager class for advanced URL persistence
 */
export class UrlStateManager {
  private config: Required<UrlStateConfig>;
  private storagePrefix: string;

  constructor(config: UrlStateConfig = {}) {
    this.config = {
      preserveQueryParams: config.preserveQueryParams || [],
      preserveAllQueryParams: config.preserveAllQueryParams || false,
      preserveRouteParams: config.preserveRouteParams || true,
      preserveHash: config.preserveHash || false,
      maxAge: config.maxAge || 60 * 60 * 1000, // 1 hour default
      storageKey: config.storageKey || 'urlState'
    };
    this.storagePrefix = `nav_${this.config.storageKey}`;
  }

  /**
   * Creates a snapshot of the current URL state
   */
  createSnapshot(
    location: { pathname: string; search: string; hash: string },
    routeParams: Record<string, string> = {},
    routePath?: string
  ): UrlStateSnapshot {
    const queryParams = extractQueryParams(location.pathname + location.search);

    // Filter query params if specific ones are configured to preserve
    const filteredQueryParams = this.config.preserveAllQueryParams
      ? queryParams
      : this.filterQueryParams(queryParams);

    return {
      pathname: normalizePath(location.pathname),
      search: location.search,
      hash: this.config.preserveHash ? location.hash : '',
      queryParams: filteredQueryParams,
      routeParams: this.config.preserveRouteParams ? routeParams : {},
      timestamp: Date.now(),
      routePath
    };
  }

  /**
   * Saves URL state snapshot to storage
   */
  saveSnapshot(snapshot: UrlStateSnapshot, key: string = 'current'): void {
    try {
      const storageKey = `${this.storagePrefix}_${key}`;
      sessionStorage.setItem(storageKey, JSON.stringify(snapshot));
    } catch (error) {
      console.warn('Failed to save URL state snapshot:', error);
    }
  }

  /**
   * Loads URL state snapshot from storage
   */
  loadSnapshot(key: string = 'current'): UrlStateSnapshot | null {
    try {
      const storageKey = `${this.storagePrefix}_${key}`;
      const stored = sessionStorage.getItem(storageKey);

      if (!stored) return null;

      const snapshot: UrlStateSnapshot = JSON.parse(stored);

      // Check if snapshot is expired
      if (Date.now() - snapshot.timestamp > this.config.maxAge) {
        this.clearSnapshot(key);
        return null;
      }

      return snapshot;
    } catch (error) {
      console.warn('Failed to load URL state snapshot:', error);
      return null;
    }
  }

  /**
   * Clears URL state snapshot from storage
   */
  clearSnapshot(key: string = 'current'): void {
    try {
      const storageKey = `${this.storagePrefix}_${key}`;
      sessionStorage.removeItem(storageKey);
    } catch (error) {
      console.warn('Failed to clear URL state snapshot:', error);
    }
  }

  /**
   * Restores URL state from snapshot
   */
  restoreFromSnapshot(
    snapshot: UrlStateSnapshot,
    navigate: (path: string, options?: { replace?: boolean }) => void,
    options: { replace?: boolean; preserveCurrent?: boolean } = {}
  ): boolean {
    try {
      // Build the complete URL from snapshot
      let restoredPath = snapshot.pathname;

      // Add query parameters if they exist
      if (Object.keys(snapshot.queryParams).length > 0) {
        restoredPath = buildPathWithParams(restoredPath, snapshot.queryParams);
      }

      // Add hash if preserved
      if (snapshot.hash) {
        restoredPath += snapshot.hash;
      }

      // Save current state before navigating if requested
      if (options.preserveCurrent) {
        const currentLocation = {
          pathname: window.location.pathname,
          search: window.location.search,
          hash: window.location.hash
        };
        const currentSnapshot = this.createSnapshot(currentLocation);
        this.saveSnapshot(currentSnapshot, 'previous');
      }

      navigate(restoredPath, { replace: options.replace });
      return true;
    } catch (error) {
      console.warn('Failed to restore from URL state snapshot:', error);
      return false;
    }
  }

  /**
   * Preserves current URL state for later restoration
   */
  preserveCurrentState(
    location: { pathname: string; search: string; hash: string },
    routeParams: Record<string, string> = {},
    routePath?: string,
    key: string = 'preserved'
  ): void {
    const snapshot = this.createSnapshot(location, routeParams, routePath);
    this.saveSnapshot(snapshot, key);
  }

  /**
   * Restores preserved URL state
   */
  restorePreservedState(
    navigate: (path: string, options?: { replace?: boolean }) => void,
    key: string = 'preserved',
    options: { replace?: boolean } = {}
  ): boolean {
    const snapshot = this.loadSnapshot(key);
    if (!snapshot) return false;

    const success = this.restoreFromSnapshot(snapshot, navigate, options);
    if (success) {
      this.clearSnapshot(key); // Clear after successful restoration
    }

    return success;
  }

  /**
   * Merges query parameters with preserved state
   */
  mergeWithPreservedParams(
    newParams: Record<string, string>,
    key: string = 'current'
  ): Record<string, string> {
    const snapshot = this.loadSnapshot(key);
    if (!snapshot) return newParams;

    return { ...snapshot.queryParams, ...newParams };
  }

  /**
   * Checks if URL state should be restored on page load
   */
  shouldRestoreOnPageLoad(currentLocation: { pathname: string; search: string }): boolean {
    const snapshot = this.loadSnapshot('current');
    if (!snapshot) return false;

    // Don't restore if we're already on the same page with same params
    const currentPath = normalizePath(currentLocation.pathname);
    const currentParams = extractQueryParams(currentLocation.pathname + currentLocation.search);

    return !(
      snapshot.pathname === currentPath &&
      JSON.stringify(snapshot.queryParams) === JSON.stringify(currentParams)
    );
  }

  /**
   * Handles page refresh by preserving and restoring state
   */
  handlePageRefresh(
    currentLocation: { pathname: string; search: string; hash: string },
    navigate: (path: string, options?: { replace?: boolean }) => void,
    routeParams: Record<string, string> = {},
    routePath?: string
  ): void {
    // Check if we have preserved state to restore
    const preservedSnapshot = this.loadSnapshot('preserved');
    if (preservedSnapshot && this.shouldRestoreOnPageLoad(currentLocation)) {
      this.restoreFromSnapshot(preservedSnapshot, navigate, { replace: true });
      return;
    }

    // Otherwise, preserve current state for future use
    this.preserveCurrentState(currentLocation, routeParams, routePath, 'current');
  }

  /**
   * Handles navigation with parameter preservation
   */
  handleNavigationWithPersistence(
    targetPath: string,
    navigate: (path: string, options?: { replace?: boolean }) => void,
    options: {
      preserveQuery?: boolean;
      preserveRoute?: boolean;
      mergeParams?: Record<string, string>;
      replace?: boolean;
    } = {}
  ): void {
    try {
      let finalPath = targetPath;

      // Merge with preserved query parameters if requested
      if (options.preserveQuery) {
        const currentSnapshot = this.loadSnapshot('current');
        if (currentSnapshot && Object.keys(currentSnapshot.queryParams).length > 0) {
          const mergedParams = options.mergeParams
            ? { ...currentSnapshot.queryParams, ...options.mergeParams }
            : currentSnapshot.queryParams;

          const url = new URL(targetPath, window.location.origin);
          Object.entries(mergedParams).forEach(([key, value]) => {
            if (value && !url.searchParams.has(key)) {
              url.searchParams.set(key, value);
            }
          });
          finalPath = url.pathname + url.search + url.hash;
        }
      }

      navigate(finalPath, { replace: options.replace });
    } catch (error) {
      console.warn('Failed to handle navigation with persistence:', error);
      navigate(targetPath, { replace: options.replace });
    }
  }

  /**
   * Validates and preserves URL parameters
   */
  validateAndPreserveParams(
    location: { pathname: string; search: string; hash: string },
    routeParams: Record<string, string>,
    validators?: {
      queryValidators?: Record<string, (value: string) => boolean>;
      routeValidators?: Record<string, (value: string) => boolean>;
    }
  ): { isValid: boolean; errors: string[]; sanitizedSnapshot?: UrlStateSnapshot } {
    const errors: string[] = [];

    try {
      const snapshot = this.createSnapshot(location, routeParams);

      // Validate query parameters
      if (validators?.queryValidators) {
        Object.entries(validators.queryValidators).forEach(([key, validator]) => {
          const value = snapshot.queryParams[key];
          if (value && !validator(value)) {
            errors.push(`Invalid query parameter: ${key}`);
          }
        });
      }

      // Validate route parameters
      if (validators?.routeValidators) {
        Object.entries(validators.routeValidators).forEach(([key, validator]) => {
          const value = snapshot.routeParams[key];
          if (value && !validator(value)) {
            errors.push(`Invalid route parameter: ${key}`);
          }
        });
      }

      // If validation passes, preserve the snapshot
      if (errors.length === 0) {
        this.saveSnapshot(snapshot);
        return { isValid: true, errors: [], sanitizedSnapshot: snapshot };
      }

      return { isValid: false, errors };
    } catch (error) {
      console.warn('Failed to validate and preserve parameters:', error);
      return { isValid: false, errors: ['Parameter validation failed'] };
    }
  }

  /**
   * Filters query parameters based on configuration
   */
  private filterQueryParams(queryParams: Record<string, string>): Record<string, string> {
    if (this.config.preserveAllQueryParams) {
      return queryParams;
    }

    if (this.config.preserveQueryParams.length === 0) {
      return {};
    }

    const filtered: Record<string, string> = {};
    this.config.preserveQueryParams.forEach(paramName => {
      if (queryParams[paramName] !== undefined) {
        filtered[paramName] = queryParams[paramName];
      }
    });

    return filtered;
  }

  /**
   * Clears all stored URL state
   */
  clearAllState(): void {
    try {
      const keys = ['current', 'preserved', 'previous'];
      keys.forEach(key => this.clearSnapshot(key));
    } catch (error) {
      console.warn('Failed to clear all URL state:', error);
    }
  }

  /**
   * Gets configuration
   */
  getConfig(): Required<UrlStateConfig> {
    return { ...this.config };
  }

  /**
   * Updates configuration
   */
  updateConfig(newConfig: Partial<UrlStateConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

/**
 * Default URL state manager instance
 */
export const defaultUrlStateManager = new UrlStateManager({
  preserveAllQueryParams: true,
  preserveRouteParams: true,
  preserveHash: false,
  maxAge: 60 * 60 * 1000 // 1 hour
});

/**
 * Hook for using URL state management in React components
 */
export function useUrlStateManager(config?: UrlStateConfig) {
  const manager = config ? new UrlStateManager(config) : defaultUrlStateManager;

  return {
    createSnapshot: manager.createSnapshot.bind(manager),
    saveSnapshot: manager.saveSnapshot.bind(manager),
    loadSnapshot: manager.loadSnapshot.bind(manager),
    clearSnapshot: manager.clearSnapshot.bind(manager),
    restoreFromSnapshot: manager.restoreFromSnapshot.bind(manager),
    preserveCurrentState: manager.preserveCurrentState.bind(manager),
    restorePreservedState: manager.restorePreservedState.bind(manager),
    mergeWithPreservedParams: manager.mergeWithPreservedParams.bind(manager),
    shouldRestoreOnPageLoad: manager.shouldRestoreOnPageLoad.bind(manager),
    handlePageRefresh: manager.handlePageRefresh.bind(manager),
    clearAllState: manager.clearAllState.bind(manager),
    getConfig: manager.getConfig.bind(manager),
    updateConfig: manager.updateConfig.bind(manager),
    handleNavigationWithPersistence: manager.handleNavigationWithPersistence.bind(manager),
    validateAndPreserveParams: manager.validateAndPreserveParams.bind(manager)
  };
}