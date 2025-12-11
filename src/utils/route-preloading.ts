/**
 * Route Preloading Utilities
 * 
 * Provides intelligent preloading of route components and data
 * to improve navigation performance and user experience.
 */

import { RouteConfig } from '../config/routes';

/**
 * Preload status tracking
 */
interface PreloadStatus {
  component: boolean;
  data: boolean;
  error?: Error;
}

/**
 * Cache for preload status
 */
const preloadCache = new Map<string, PreloadStatus>();

/**
 * Cache for preloaded data
 */
const dataCache = new Map<string, any>();

/**
 * Preload a route component
 */
export const preloadRouteComponent = async (routeConfig: RouteConfig): Promise<void> => {
  const cacheKey = routeConfig.path;
  const status = preloadCache.get(cacheKey) || { component: false, data: false };
  
  if (status.component) {
    return; // Already preloaded
  }

  try {
    // The component is already lazy-loaded, so we just need to trigger the import
    // This will cause the component to be loaded into the browser cache
    await import(/* webpackMode: "lazy" */ '../pages/HomePage'); // This is just a placeholder
    
    status.component = true;
    preloadCache.set(cacheKey, status);
  } catch (error) {
    console.warn(`Failed to preload component for route ${routeConfig.path}:`, error);
    status.error = error as Error;
    preloadCache.set(cacheKey, status);
  }
};

/**
 * Preload route data
 */
export const preloadRouteData = async (routeConfig: RouteConfig): Promise<void> => {
  const cacheKey = routeConfig.path;
  const status = preloadCache.get(cacheKey) || { component: false, data: false };
  
  if (status.data || !routeConfig.preloadData) {
    return; // Already preloaded or no data to preload
  }

  try {
    const data = await routeConfig.preloadData();
    dataCache.set(cacheKey, data);
    
    status.data = true;
    preloadCache.set(cacheKey, status);
  } catch (error) {
    console.warn(`Failed to preload data for route ${routeConfig.path}:`, error);
    status.error = error as Error;
    preloadCache.set(cacheKey, status);
  }
};

/**
 * Get preloaded data for a route
 */
export const getPreloadedData = (routePath: string): any => {
  return dataCache.get(routePath);
};

/**
 * Clear preloaded data for a route
 */
export const clearPreloadedData = (routePath: string): void => {
  dataCache.delete(routePath);
  preloadCache.delete(routePath);
};

/**
 * Preload multiple routes
 */
export const preloadRoutes = async (routeConfigs: RouteConfig[]): Promise<void> => {
  const preloadPromises = routeConfigs.map(async (config) => {
    try {
      await Promise.all([
        preloadRouteComponent(config),
        preloadRouteData(config)
      ]);
    } catch (error) {
      console.warn(`Failed to preload route ${config.path}:`, error);
    }
  });

  await Promise.allSettled(preloadPromises);
};

/**
 * Intelligent route preloading based on user behavior
 */
export class RoutePreloader {
  private hoverTimeouts = new Map<string, NodeJS.Timeout>();
  private preloadedRoutes = new Set<string>();

  /**
   * Preload route on link hover with debouncing
   */
  onLinkHover = (routePath: string, routeConfig: RouteConfig, delay: number = 200): void => {
    // Clear existing timeout for this route
    const existingTimeout = this.hoverTimeouts.get(routePath);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Set new timeout
    const timeout = setTimeout(() => {
      if (!this.preloadedRoutes.has(routePath)) {
        this.preloadRoute(routeConfig);
        this.preloadedRoutes.add(routePath);
      }
    }, delay);

    this.hoverTimeouts.set(routePath, timeout);
  };

  /**
   * Cancel preload on link hover end
   */
  onLinkHoverEnd = (routePath: string): void => {
    const timeout = this.hoverTimeouts.get(routePath);
    if (timeout) {
      clearTimeout(timeout);
      this.hoverTimeouts.delete(routePath);
    }
  };

  /**
   * Preload route immediately
   */
  preloadRoute = async (routeConfig: RouteConfig): Promise<void> => {
    try {
      await Promise.all([
        preloadRouteComponent(routeConfig),
        preloadRouteData(routeConfig)
      ]);
    } catch (error) {
      console.warn(`Failed to preload route ${routeConfig.path}:`, error);
    }
  };

  /**
   * Preload critical routes on app initialization
   */
  preloadCriticalRoutes = async (criticalRoutes: RouteConfig[]): Promise<void> => {
    // Preload in batches to avoid overwhelming the browser
    const batchSize = 3;
    for (let i = 0; i < criticalRoutes.length; i += batchSize) {
      const batch = criticalRoutes.slice(i, i + batchSize);
      await preloadRoutes(batch);
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  };

  /**
   * Preload routes based on user's navigation history
   */
  preloadBasedOnHistory = (navigationHistory: string[], routeConfigs: RouteConfig[]): void => {
    // Find routes that are frequently visited together
    const routesToPreload = this.findRelatedRoutes(navigationHistory, routeConfigs);
    
    // Preload in background
    setTimeout(() => {
      preloadRoutes(routesToPreload);
    }, 1000); // Delay to not interfere with current navigation
  };

  /**
   * Find routes that are commonly visited together
   */
  private findRelatedRoutes = (history: string[], allRoutes: RouteConfig[]): RouteConfig[] => {
    if (history.length === 0) return [];

    const currentRoute = history[history.length - 1];
    const relatedPaths: string[] = [];

    // Simple heuristic: if user visited /subjects, they might visit /quiz
    if (currentRoute.startsWith('/subjects')) {
      relatedPaths.push('/quiz', '/study');
    } else if (currentRoute.startsWith('/quiz')) {
      relatedPaths.push('/quiz/results', '/subjects');
    } else if (currentRoute === '/') {
      relatedPaths.push('/subjects', '/quiz', '/study');
    }

    return allRoutes.filter(route => relatedPaths.includes(route.path));
  };

  /**
   * Clean up resources
   */
  cleanup = (): void => {
    // Clear all hover timeouts
    this.hoverTimeouts.forEach(timeout => clearTimeout(timeout));
    this.hoverTimeouts.clear();
    this.preloadedRoutes.clear();
  };
}

/**
 * Global route preloader instance
 */
export const routePreloader = new RoutePreloader();

/**
 * Hook for components to use route preloading
 */
export const useRoutePreloading = () => {
  return {
    preloadRoute: routePreloader.preloadRoute,
    onLinkHover: routePreloader.onLinkHover,
    onLinkHoverEnd: routePreloader.onLinkHoverEnd,
    preloadCriticalRoutes: routePreloader.preloadCriticalRoutes
  };
};