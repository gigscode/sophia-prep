/**
 * Unified Navigation Manager
 * 
 * Centralized navigation state management that provides unified navigation
 * functionality through a single, consolidated system.
 */

import { 
  isValidPath, 
  normalizePath, 
  extractQueryParams,
  createUrlStateSnapshot
} from './navigation';

/**
 * Navigation state interface
 */
export interface NavigationState {
  currentPath: string;
  previousPath: string | null;
  isNavigating: boolean;
  pendingRedirect: string | null;
  navigationError: string | null;
  preservedParams: Record<string, string>;
  routeParams: Record<string, string>;
}

/**
 * Navigation configuration
 */
export interface NavigationConfig {
  enablePersistence: boolean;
  enableErrorRecovery: boolean;
  maxRetries: number;
  debugMode: boolean;
  maxAge?: number;
  storagePrefix?: string;
}

/**
 * Navigation error types
 */
export interface NavigationError {
  type: 'validation' | 'navigation' | 'persistence' | 'loop' | 'unknown' | 'initialization';
  message: string;
  path?: string;
  timestamp: number;
  stack?: string;
}

/**
 * Navigation event listener type
 */
export type NavigationEventListener = (state: NavigationState) => void;

/**
 * Batched state update interface
 */
interface BatchedStateUpdate {
  updates: Partial<NavigationState>;
  timestamp: number;
  priority: 'high' | 'normal' | 'low';
}

/**
 * Loop detection state
 */
interface LoopDetectionState {
  renderCount: number;
  lastRenderTime: number;
  pathHistory: string[];
  isCircuitBreakerActive: boolean;
  circuitBreakerActivatedAt: number | null;
  consecutiveFailures: number;
  rapidNavigationCount: number;
  lastNavigationTime: number;
}

/**
 * Loop detection configuration
 */
interface LoopDetectionConfig {
  maxRenderCount: number;
  maxConsecutiveFailures: number;
  rapidNavigationThreshold: number;
  rapidNavigationWindow: number;
  circuitBreakerTimeout: number;
  pathHistorySize: number;
}

/**
 * Unified Navigation Manager Class
 * 
 * Provides centralized navigation state management with URL parameter preservation,
 * browser history integration, error handling, and loop detection.
 */
export class NavigationManager {
  private state: NavigationState;
  private config: Required<NavigationConfig>;
  private listeners: Set<NavigationEventListener> = new Set();
  private loopDetection: LoopDetectionState;
  private loopDetectionConfig: LoopDetectionConfig;
  private storagePrefix: string;
  private retryCount: number = 0;
  private debugLogs: Array<{ timestamp: number; message: string; data?: any }> = [];
  
  // State update batching
  private pendingUpdates: Map<string, BatchedStateUpdate> = new Map();
  private batchTimeout: NodeJS.Timeout | null = null;
  private readonly BATCH_DELAY = 16; // ~1 frame at 60fps for optimal performance
  private readonly MAX_BATCH_SIZE = 10;
  private isProcessingBatch = false;

  constructor(config: Partial<NavigationConfig> = {}) {
    this.config = {
      enablePersistence: config.enablePersistence ?? true,
      enableErrorRecovery: config.enableErrorRecovery ?? true,
      maxRetries: config.maxRetries ?? 3,
      debugMode: config.debugMode ?? false,
      maxAge: config.maxAge ?? 60 * 60 * 1000, // 1 hour
      storagePrefix: config.storagePrefix ?? 'nav_unified'
    };

    this.storagePrefix = this.config.storagePrefix;

    // Initialize loop detection configuration
    this.loopDetectionConfig = {
      maxRenderCount: 50,
      maxConsecutiveFailures: 5,
      rapidNavigationThreshold: 10,
      rapidNavigationWindow: 1000, // 1 second
      circuitBreakerTimeout: 5000, // 5 seconds
      pathHistorySize: 20
    };

    // Initialize navigation state
    this.state = this.initializeState();

    // Initialize loop detection
    this.loopDetection = {
      renderCount: 0,
      lastRenderTime: Date.now(),
      pathHistory: [],
      isCircuitBreakerActive: false,
      circuitBreakerActivatedAt: null,
      consecutiveFailures: 0,
      rapidNavigationCount: 0,
      lastNavigationTime: 0
    };

    this.log('NavigationManager initialized', this.state);
  }

  /**
   * Initialize navigation state from current location or preserved state
   */
  private initializeState(): NavigationState {
    try {
      const currentLocation = {
        pathname: window.location.pathname,
        search: window.location.search,
        hash: window.location.hash
      };

      const currentPath = normalizePath(currentLocation.pathname + currentLocation.search + currentLocation.hash);
      
      // Try to restore preserved state
      const preservedState = this.loadPreservedState();
      
      return {
        currentPath,
        previousPath: preservedState?.previousPath || null,
        isNavigating: false,
        pendingRedirect: preservedState?.pendingRedirect || null,
        navigationError: null,
        preservedParams: preservedState?.preservedParams || {},
        routeParams: preservedState?.routeParams || {}
      };
    } catch (error) {
      this.handleError('initialization', 'Failed to initialize navigation state', error);
      
      // Return safe default state
      return {
        currentPath: '/',
        previousPath: null,
        isNavigating: false,
        pendingRedirect: null,
        navigationError: null,
        preservedParams: {},
        routeParams: {}
      };
    }
  }

  /**
   * Get current navigation state
   */
  getState(): NavigationState {
    return { ...this.state };
  }

  /**
   * Navigate to a new path with comprehensive error handling and parameter preservation
   */
  navigate(
    path: string, 
    options: { 
      replace?: boolean; 
      state?: any; 
      preserveParams?: boolean;
      skipValidation?: boolean;
    } = {}
  ): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        // Check circuit breaker first
        if (this.isCircuitBreakerActive()) {
          this.log('Navigation blocked by circuit breaker', { 
            path, 
            circuitBreakerActivatedAt: this.loopDetection.circuitBreakerActivatedAt,
            timeRemaining: this.getCircuitBreakerTimeRemaining()
          });
          resolve(false);
          return;
        }

        // Track rapid navigation attempts
        this.trackRapidNavigation();

        // Validate path unless explicitly skipped
        if (!options.skipValidation && !isValidPath(path)) {
          this.incrementFailureCount();
          throw new Error(`Invalid navigation path: ${path}`);
        }

        let finalPath = normalizePath(path);

        // Preserve parameters if requested
        if (options.preserveParams) {
          finalPath = this.mergePreservedParams(finalPath);
        }

        // Update loop detection before navigation
        this.updateLoopDetection(finalPath);

        // Check if loop was detected during update
        if (this.isCircuitBreakerActive()) {
          this.log('Navigation blocked - loop detected during path update', { path: finalPath });
          resolve(false);
          return;
        }

        // Set navigating state with high priority for immediate feedback
        this.updateState({
          isNavigating: true,
          navigationError: null,
          previousPath: this.state.currentPath
        }, 'high');

        // Perform navigation using browser history API
        if (options.replace) {
          window.history.replaceState(options.state, '', finalPath);
        } else {
          window.history.pushState(options.state, '', finalPath);
        }

        // Update state after successful navigation with normal priority for batching
        this.updateState({
          currentPath: finalPath,
          isNavigating: false
        }, 'normal');

        // Preserve state for future restoration
        if (this.config.enablePersistence) {
          this.preserveCurrentState();
        }

        // Reset failure count on successful navigation
        this.resetFailureCount();
        this.retryCount = 0;
        
        this.log('Navigation successful', { path: finalPath, options });
        resolve(true);

      } catch (error) {
        this.incrementFailureCount();
        this.handleNavigationError(error, path, resolve);
      }
    });
  }

  /**
   * Navigate using browser back button
   */
  goBack(): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        if (this.isCircuitBreakerActive()) {
          this.log('Back navigation blocked by circuit breaker');
          resolve(false);
          return;
        }

        this.trackRapidNavigation();
        this.updateState({ isNavigating: true, navigationError: null }, 'high');
        
        window.history.back();
        
        // Browser navigation is async, so we'll update state in the popstate handler
        this.log('Back navigation initiated');
        resolve(true);

      } catch (error) {
        this.incrementFailureCount();
        this.handleError('navigation', 'Back navigation failed', error);
        this.updateState({ isNavigating: false }, 'high');
        resolve(false);
      }
    });
  }

  /**
   * Navigate using browser forward button
   */
  goForward(): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        if (this.isCircuitBreakerActive()) {
          this.log('Forward navigation blocked by circuit breaker');
          resolve(false);
          return;
        }

        this.trackRapidNavigation();
        this.updateState({ isNavigating: true, navigationError: null }, 'high');
        
        window.history.forward();
        
        this.log('Forward navigation initiated');
        resolve(true);

      } catch (error) {
        this.incrementFailureCount();
        this.handleError('navigation', 'Forward navigation failed', error);
        this.updateState({ isNavigating: false }, 'high');
        resolve(false);
      }
    });
  }

  /**
   * Set pending redirect for post-authentication navigation
   */
  setPendingRedirect(path: string | null): void {
    this.updateState({ pendingRedirect: path }, 'normal');
    
    if (this.config.enablePersistence) {
      if (path) {
        this.saveToStorage('pendingRedirect', path);
      } else {
        this.removeFromStorage('pendingRedirect');
      }
    }
  }

  /**
   * Execute pending redirect if one exists
   */
  async executePendingRedirect(): Promise<boolean> {
    if (this.state.pendingRedirect && !this.state.isNavigating) {
      const redirectPath = this.state.pendingRedirect;
      this.setPendingRedirect(null);
      return await this.navigate(redirectPath);
    }
    return false;
  }

  /**
   * Preserve current URL parameters
   */
  preserveCurrentParams(paramsToPreserve?: string[]): void {
    try {
      const currentParams = extractQueryParams(window.location.pathname + window.location.search);
      
      let preserved: Record<string, string>;
      if (paramsToPreserve) {
        preserved = {};
        paramsToPreserve.forEach(key => {
          if (currentParams[key] !== undefined) {
            preserved[key] = currentParams[key];
          }
        });
      } else {
        preserved = currentParams;
      }

      this.updateState({
        preservedParams: { ...this.state.preservedParams, ...preserved }
      }, 'low');

      if (this.config.enablePersistence) {
        this.saveToStorage('preservedParams', this.state.preservedParams);
      }

    } catch (error) {
      this.handleError('persistence', 'Failed to preserve current parameters', error);
    }
  }

  /**
   * Update route parameters
   */
  updateRouteParams(params: Record<string, string>): void {
    this.updateState({
      routeParams: { ...this.state.routeParams, ...params }
    }, 'low');

    if (this.config.enablePersistence) {
      this.saveToStorage('routeParams', this.state.routeParams);
    }
  }

  /**
   * Clear preserved parameters
   */
  clearPreservedParams(): void {
    this.updateState({ preservedParams: {} }, 'low');
    
    if (this.config.enablePersistence) {
      this.removeFromStorage('preservedParams');
    }
  }

  /**
   * Handle browser navigation events (back/forward)
   */
  handlePopState = (event: PopStateEvent): void => {
    try {
      const newPath = normalizePath(window.location.pathname + window.location.search + window.location.hash);
      
      this.updateLoopDetection(newPath);
      
      this.updateState({
        previousPath: this.state.currentPath,
        currentPath: newPath,
        isNavigating: false
      }, 'normal');

      if (this.config.enablePersistence) {
        this.preserveCurrentState();
      }

      this.log('PopState handled', { newPath, event });

    } catch (error) {
      this.handleError('navigation', 'PopState handling failed', error);
    }
  };

  /**
   * Initialize browser event listeners
   */
  initializeEventListeners(): void {
    window.addEventListener('popstate', this.handlePopState);
    
    // Handle page visibility changes for tab switching
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    
    // Handle page unload to preserve state
    window.addEventListener('beforeunload', this.handleBeforeUnload);
  }

  /**
   * Clean up event listeners and batching mechanisms
   */
  cleanup(): void {
    window.removeEventListener('popstate', this.handlePopState);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    window.removeEventListener('beforeunload', this.handleBeforeUnload);
    
    // Clean up batching
    this.clearBatchTimeout();
    this.pendingUpdates.clear();
    
    this.listeners.clear();
  }

  /**
   * Add state change listener
   */
  addListener(listener: NavigationEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Clear navigation error
   */
  clearNavigationError(): void {
    this.updateState({ navigationError: null }, 'normal');
  }

  /**
   * Reset circuit breaker and loop detection
   */
  resetCircuitBreaker(): void {
    this.loopDetection = {
      renderCount: 0,
      lastRenderTime: Date.now(),
      pathHistory: [],
      isCircuitBreakerActive: false,
      circuitBreakerActivatedAt: null,
      consecutiveFailures: 0,
      rapidNavigationCount: 0,
      lastNavigationTime: 0
    };
    this.log('Circuit breaker reset');
  }

  /**
   * Check if circuit breaker is currently active
   */
  isCircuitBreakerActive(): boolean {
    if (!this.loopDetection.isCircuitBreakerActive) {
      return false;
    }

    // Check if circuit breaker timeout has expired
    if (this.loopDetection.circuitBreakerActivatedAt) {
      const timeElapsed = Date.now() - this.loopDetection.circuitBreakerActivatedAt;
      if (timeElapsed >= this.loopDetectionConfig.circuitBreakerTimeout) {
        this.log('Circuit breaker timeout expired, auto-resetting');
        this.resetCircuitBreaker();
        return false;
      }
    }

    return true;
  }

  /**
   * Get remaining time for circuit breaker timeout
   */
  getCircuitBreakerTimeRemaining(): number {
    if (!this.loopDetection.isCircuitBreakerActive || !this.loopDetection.circuitBreakerActivatedAt) {
      return 0;
    }

    const timeElapsed = Date.now() - this.loopDetection.circuitBreakerActivatedAt;
    const remaining = this.loopDetectionConfig.circuitBreakerTimeout - timeElapsed;
    return Math.max(0, remaining);
  }

  /**
   * Get comprehensive loop detection status and debugging information
   */
  getLoopDetectionDebugInfo(): {
    status: LoopDetectionState;
    config: LoopDetectionConfig;
    recentLogs: Array<{ timestamp: number; message: string; data?: any }>;
    analysis: {
      isLoopDetected: boolean;
      circularNavigationDetected: boolean;
      rapidNavigationDetected: boolean;
      consecutiveFailuresExceeded: boolean;
      renderCountExceeded: boolean;
    };
  } {
    const recentLogs = this.debugLogs.slice(-10); // Last 10 log entries
    
    return {
      status: { ...this.loopDetection },
      config: { ...this.loopDetectionConfig },
      recentLogs,
      analysis: {
        isLoopDetected: this.isCircuitBreakerActive(),
        circularNavigationDetected: this.detectCircularNavigation(),
        rapidNavigationDetected: this.detectRapidNavigation(),
        consecutiveFailuresExceeded: this.loopDetection.consecutiveFailures >= this.loopDetectionConfig.maxConsecutiveFailures,
        renderCountExceeded: this.loopDetection.renderCount >= this.loopDetectionConfig.maxRenderCount
      }
    };
  }

  /**
   * Get loop detection status
   */
  getLoopDetectionStatus(): LoopDetectionState {
    return { ...this.loopDetection };
  }

  // Private helper methods

  /**
   * Update state with batching for optimal performance
   * Batches related navigation state updates to minimize re-renders
   */
  private updateState(updates: Partial<NavigationState>, priority: 'high' | 'normal' | 'low' = 'normal'): void {
    // For high priority updates (like navigation errors), apply immediately
    if (priority === 'high' || this.isProcessingBatch) {
      this.applyStateUpdates(updates);
      return;
    }

    // In test environment or when debugging, apply updates immediately for predictable behavior
    if (this.config.debugMode || 
        (typeof window !== 'undefined' && (window as any).__VITEST__) ||
        (typeof global !== 'undefined' && (global as any).__VITEST__) ||
        (typeof process !== 'undefined' && process.env.NODE_ENV === 'test')) {
      this.applyStateUpdates(updates);
      return;
    }

    // Add to batch for normal and low priority updates
    const updateKey = this.generateUpdateKey(updates);
    this.pendingUpdates.set(updateKey, {
      updates,
      timestamp: Date.now(),
      priority
    });

    // Schedule batch processing if not already scheduled
    if (!this.batchTimeout) {
      this.scheduleBatchProcessing();
    }

    // If batch is getting too large, process immediately to prevent memory issues
    if (this.pendingUpdates.size >= this.MAX_BATCH_SIZE) {
      this.processBatchedUpdates();
    }
  }

  /**
   * Generate a unique key for state updates to enable merging of similar updates
   */
  private generateUpdateKey(updates: Partial<NavigationState>): string {
    const keys = Object.keys(updates).sort();
    return keys.join('|');
  }

  /**
   * Schedule batch processing using requestAnimationFrame for optimal timing
   */
  private scheduleBatchProcessing(): void {
    this.batchTimeout = setTimeout(() => {
      // Use requestAnimationFrame for optimal render timing
      requestAnimationFrame(() => {
        this.processBatchedUpdates();
      });
    }, this.BATCH_DELAY);
  }

  /**
   * Process all batched state updates efficiently
   */
  private processBatchedUpdates(): void {
    if (this.pendingUpdates.size === 0) {
      this.clearBatchTimeout();
      return;
    }

    this.isProcessingBatch = true;

    try {
      // Sort updates by priority and timestamp
      const sortedUpdates = Array.from(this.pendingUpdates.values()).sort((a, b) => {
        // High priority first
        if (a.priority === 'high' && b.priority !== 'high') return -1;
        if (b.priority === 'high' && a.priority !== 'high') return 1;
        
        // Then by timestamp (older first)
        return a.timestamp - b.timestamp;
      });

      // Merge all updates into a single state change
      const mergedUpdates: Partial<NavigationState> = {};
      
      for (const batch of sortedUpdates) {
        Object.assign(mergedUpdates, batch.updates);
      }

      // Apply merged updates in a single operation
      this.applyStateUpdates(mergedUpdates);

      // Clear processed updates
      this.pendingUpdates.clear();
      
      this.log('Processed batched state updates', {
        updateCount: sortedUpdates.length,
        mergedKeys: Object.keys(mergedUpdates),
        batchDelay: this.BATCH_DELAY
      });

    } catch (error) {
      this.log('Error processing batched updates', error);
      // Fallback: apply updates individually
      for (const batch of this.pendingUpdates.values()) {
        try {
          this.applyStateUpdates(batch.updates);
        } catch (individualError) {
          this.log('Error applying individual update', individualError);
        }
      }
      this.pendingUpdates.clear();
    } finally {
      this.isProcessingBatch = false;
      this.clearBatchTimeout();
    }
  }

  /**
   * Force immediate processing of all pending batched updates
   * Useful for testing or when immediate state consistency is required
   */
  flushPendingUpdates(): void {
    if (this.pendingUpdates.size > 0) {
      this.processBatchedUpdates();
    }
  }

  /**
   * Apply state updates immediately without batching
   */
  private applyStateUpdates(updates: Partial<NavigationState>): void {
    const previousState = { ...this.state };
    this.state = { ...this.state, ...updates };
    
    // Only notify listeners if state actually changed
    if (this.hasStateChanged(previousState, this.state)) {
      this.notifyListeners();
    }
  }

  /**
   * Check if state has meaningfully changed to avoid unnecessary notifications
   */
  private hasStateChanged(previous: NavigationState, current: NavigationState): boolean {
    // Check each property for changes
    return (
      previous.currentPath !== current.currentPath ||
      previous.previousPath !== current.previousPath ||
      previous.isNavigating !== current.isNavigating ||
      previous.pendingRedirect !== current.pendingRedirect ||
      previous.navigationError !== current.navigationError ||
      !this.areObjectsEqual(previous.preservedParams, current.preservedParams) ||
      !this.areObjectsEqual(previous.routeParams, current.routeParams)
    );
  }

  /**
   * Deep equality check for objects
   */
  private areObjectsEqual(obj1: Record<string, string>, obj2: Record<string, string>): boolean {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    
    if (keys1.length !== keys2.length) return false;
    
    return keys1.every(key => obj1[key] === obj2[key]);
  }

  /**
   * Clear batch timeout
   */
  private clearBatchTimeout(): void {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.state);
      } catch (error) {
        console.warn('Navigation listener error:', error);
      }
    });
  }

  private mergePreservedParams(path: string): string {
    try {
      if (Object.keys(this.state.preservedParams).length === 0) {
        return path;
      }

      const url = new URL(path, window.location.origin);
      Object.entries(this.state.preservedParams).forEach(([key, value]) => {
        if (!url.searchParams.has(key)) {
          url.searchParams.set(key, value);
        }
      });

      return url.pathname + url.search + url.hash;
    } catch (error) {
      this.log('Failed to merge preserved params', error);
      return path;
    }
  }

  private updateLoopDetection(path: string): void {
    const now = Date.now();
    const timeDiff = now - this.loopDetection.lastRenderTime;

    // Reset render count if enough time has passed (1 second window)
    if (timeDiff > 1000) {
      this.loopDetection.renderCount = 0;
      // Don't clear path history immediately - keep it for pattern detection
    }

    this.loopDetection.renderCount++;
    this.loopDetection.lastRenderTime = now;
    this.loopDetection.pathHistory.push(path);

    // Keep only recent history based on configuration
    if (this.loopDetection.pathHistory.length > this.loopDetectionConfig.pathHistorySize) {
      this.loopDetection.pathHistory = this.loopDetection.pathHistory.slice(-this.loopDetectionConfig.pathHistorySize);
    }

    // Log render count tracking for debugging
    this.log('Loop detection update', {
      path,
      renderCount: this.loopDetection.renderCount,
      pathHistoryLength: this.loopDetection.pathHistory.length,
      timeDiff,
      consecutiveFailures: this.loopDetection.consecutiveFailures
    });

    // Check for various loop conditions
    const shouldActivateCircuitBreaker = 
      this.loopDetection.renderCount >= this.loopDetectionConfig.maxRenderCount ||
      this.detectCircularNavigation() ||
      this.detectRapidNavigation() ||
      this.loopDetection.consecutiveFailures >= this.loopDetectionConfig.maxConsecutiveFailures;

    if (shouldActivateCircuitBreaker && !this.isCircuitBreakerActive()) {
      this.activateCircuitBreaker();
    }
  }

  private detectCircularNavigation(): boolean {
    const history = this.loopDetection.pathHistory;
    if (history.length < 4) return false;

    // Check for immediate back-and-forth navigation (A -> B -> A -> B)
    if (history.length >= 4) {
      const recent4 = history.slice(-4);
      if (recent4[0] === recent4[2] && recent4[1] === recent4[3] && recent4[0] !== recent4[1]) {
        this.log('Detected back-and-forth navigation pattern', { pattern: recent4 });
        return true;
      }
    }

    // Check for repeated patterns of length 2-4
    for (let patternLength = 2; patternLength <= 4; patternLength++) {
      if (history.length >= patternLength * 2) {
        const recent = history.slice(-patternLength * 2);
        const pattern = recent.slice(0, patternLength);
        const next = recent.slice(patternLength);
        
        if (JSON.stringify(pattern) === JSON.stringify(next)) {
          this.log('Detected circular navigation pattern', { 
            patternLength, 
            pattern, 
            fullHistory: history.slice(-10) 
          });
          return true;
        }
      }
    }

    // Check for same path repeated multiple times in short succession
    if (history.length >= 3) {
      const lastPath = history[history.length - 1];
      const recentSamePath = history.slice(-5).filter(path => path === lastPath);
      if (recentSamePath.length >= 3) {
        this.log('Detected repeated same-path navigation', { 
          path: lastPath, 
          count: recentSamePath.length 
        });
        return true;
      }
    }

    return false;
  }

  private activateCircuitBreaker(): void {
    this.loopDetection.isCircuitBreakerActive = true;
    this.loopDetection.circuitBreakerActivatedAt = Date.now();
    
    const debugInfo = this.getLoopDetectionDebugInfo();
    
    this.handleError('loop', 'Infinite navigation loop detected - circuit breaker activated', null, undefined);
    
    this.log('Circuit breaker activated', {
      reason: 'Loop detection triggered',
      renderCount: this.loopDetection.renderCount,
      consecutiveFailures: this.loopDetection.consecutiveFailures,
      pathHistory: this.loopDetection.pathHistory.slice(-10),
      debugInfo: debugInfo.analysis
    });

    // Create fallback navigation state
    this.createFallbackNavigationState();
    
    // Auto-reset circuit breaker after configured timeout
    setTimeout(() => {
      if (this.isCircuitBreakerActive()) {
        this.log('Auto-resetting circuit breaker after timeout');
        this.resetCircuitBreaker();
      }
    }, this.loopDetectionConfig.circuitBreakerTimeout);
  }

  /**
   * Create a safe fallback navigation state when loops are detected
   */
  private createFallbackNavigationState(): void {
    try {
      // Set a safe fallback state
      const fallbackPath = '/';
      
      this.updateState({
        currentPath: fallbackPath,
        previousPath: this.state.currentPath,
        isNavigating: false,
        navigationError: 'Navigation loop detected - reverted to safe state',
        pendingRedirect: null
      }, 'high');

      this.log('Fallback navigation state created', { 
        fallbackPath,
        previousPath: this.state.previousPath 
      });

    } catch (error) {
      this.log('Failed to create fallback navigation state', error);
    }
  }

  /**
   * Track rapid navigation attempts
   */
  private trackRapidNavigation(): void {
    const now = Date.now();
    const timeSinceLastNavigation = now - this.loopDetection.lastNavigationTime;

    // Reset rapid navigation count if enough time has passed
    if (timeSinceLastNavigation > this.loopDetectionConfig.rapidNavigationWindow) {
      this.loopDetection.rapidNavigationCount = 0;
    }

    this.loopDetection.rapidNavigationCount++;
    this.loopDetection.lastNavigationTime = now;

    this.log('Rapid navigation tracking', {
      count: this.loopDetection.rapidNavigationCount,
      timeSinceLastNavigation,
      threshold: this.loopDetectionConfig.rapidNavigationThreshold
    });
  }

  /**
   * Detect rapid navigation patterns
   */
  private detectRapidNavigation(): boolean {
    return this.loopDetection.rapidNavigationCount >= this.loopDetectionConfig.rapidNavigationThreshold;
  }

  /**
   * Increment failure count for consecutive failure tracking
   */
  private incrementFailureCount(): void {
    this.loopDetection.consecutiveFailures++;
    this.log('Navigation failure count incremented', {
      consecutiveFailures: this.loopDetection.consecutiveFailures,
      maxAllowed: this.loopDetectionConfig.maxConsecutiveFailures
    });
  }

  /**
   * Reset failure count on successful navigation
   */
  private resetFailureCount(): void {
    if (this.loopDetection.consecutiveFailures > 0) {
      this.log('Resetting failure count after successful navigation', {
        previousFailures: this.loopDetection.consecutiveFailures
      });
      this.loopDetection.consecutiveFailures = 0;
    }
  }

  private handleNavigationError(error: any, path: string, resolve: (value: boolean) => void): void {
    const errorMessage = error instanceof Error ? error.message : 'Navigation failed';
    
    // Don't retry validation errors - they will always fail
    if (this.config.enableErrorRecovery && 
        this.retryCount < this.config.maxRetries && 
        !errorMessage.includes('Invalid navigation path')) {
      this.retryCount++;
      this.log(`Navigation retry ${this.retryCount}/${this.config.maxRetries}`, { path, error: errorMessage });
      
      // Retry with a slight delay
      setTimeout(() => {
        this.navigate(path, { skipValidation: true }).then(resolve);
      }, 100 * this.retryCount);
    } else {
      this.handleError('navigation', errorMessage, error, path);
      this.updateState({ isNavigating: false }, 'high');
      resolve(false);
    }
  }

  private handleError(
    type: NavigationError['type'], 
    message: string, 
    error?: any, 
    path?: string
  ): void {
    const navigationError: NavigationError = {
      type,
      message,
      path,
      timestamp: Date.now(),
      stack: error?.stack
    };

    this.updateState({ 
      navigationError: message,
      isNavigating: false 
    }, 'high');

    this.log('Navigation error', navigationError);

    if (this.config.debugMode) {
      console.error('NavigationManager Error:', navigationError);
    }
  }

  private preserveCurrentState(): void {
    try {
      const snapshot = createUrlStateSnapshot(
        {
          pathname: window.location.pathname,
          search: window.location.search,
          hash: window.location.hash
        },
        this.state.routeParams
      );

      const stateToPreserve = {
        ...this.state,
        snapshot,
        timestamp: Date.now()
      };

      this.saveToStorage('currentState', stateToPreserve);
    } catch (error) {
      this.log('Failed to preserve current state', error);
    }
  }

  private loadPreservedState(): Partial<NavigationState> | null {
    try {
      const preserved = this.loadFromStorage('currentState');
      if (!preserved || !preserved.timestamp) return null;

      // Check if state is expired
      if (Date.now() - preserved.timestamp > this.config.maxAge) {
        this.removeFromStorage('currentState');
        return null;
      }

      return preserved;
    } catch (error) {
      this.log('Failed to load preserved state', error);
      return null;
    }
  }

  private saveToStorage(key: string, value: any): void {
    try {
      const storageKey = `${this.storagePrefix}_${key}`;
      sessionStorage.setItem(storageKey, JSON.stringify(value));
    } catch (error) {
      this.log('Failed to save to storage', { key, error });
    }
  }

  private loadFromStorage(key: string): any {
    try {
      const storageKey = `${this.storagePrefix}_${key}`;
      const stored = sessionStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      this.log('Failed to load from storage', { key, error });
      return null;
    }
  }

  private removeFromStorage(key: string): void {
    try {
      const storageKey = `${this.storagePrefix}_${key}`;
      sessionStorage.removeItem(storageKey);
    } catch (error) {
      this.log('Failed to remove from storage', { key, error });
    }
  }

  private handleVisibilityChange = (): void => {
    if (!document.hidden && this.config.enablePersistence) {
      // Page became visible, preserve current state
      this.preserveCurrentState();
    }
  };

  private handleBeforeUnload = (): void => {
    if (this.config.enablePersistence) {
      this.preserveCurrentState();
    }
  };

  private log(message: string, data?: any): void {
    const logEntry = {
      timestamp: Date.now(),
      message,
      data
    };

    // Store in debug logs for later analysis
    this.debugLogs.push(logEntry);
    
    // Keep only recent logs to prevent memory issues
    if (this.debugLogs.length > 100) {
      this.debugLogs = this.debugLogs.slice(-50);
    }

    if (this.config.debugMode) {
      console.log(`[NavigationManager] ${message}`, data || '');
    }
  }

  /**
   * Get recent debug logs for troubleshooting
   */
  getDebugLogs(count: number = 20): Array<{ timestamp: number; message: string; data?: any }> {
    return this.debugLogs.slice(-count);
  }

  /**
   * Clear debug logs
   */
  clearDebugLogs(): void {
    this.debugLogs = [];
    this.log('Debug logs cleared');
  }
}

/**
 * Default navigation manager instance
 */
export const defaultNavigationManager = new NavigationManager({
  enablePersistence: true,
  enableErrorRecovery: true,
  maxRetries: 3,
  debugMode: false
});