import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

/**
 * Version information from version.json
 */
interface VersionInfo {
    version: string;
    buildTime: string;
    buildId: string;
    cacheName: string;
}

/**
 * Configuration for silent updates
 */
interface SilentUpdateConfig {
    enabled: boolean;
    delayMs: number; // Delay before applying update
    respectUserActivity: boolean; // Wait for user inactivity
    inactivityThreshold: number; // milliseconds of inactivity required
    maxRetries: number;
    retryDelayMs: number;
}

/**
 * User activity tracking state
 */
interface UserActivity {
    isActive: boolean;
    lastActivityTime: Date;
    inactivityThreshold: number;
}

/**
 * Update state tracking
 */
interface UpdateState {
    status: 'idle' | 'checking' | 'update-available' | 'applying' | 'completed' | 'failed';
    lastCheck: Date;
    updateScheduledAt?: Date;
    retryCount: number;
    error?: string;
}

/**
 * Queued update information for sequential handling
 */
interface QueuedUpdate {
    id: string;
    version: VersionInfo;
    timestamp: Date;
    priority: number;
    retryCount: number;
}

/**
 * Persistent update queue for handling multiple sequential updates
 */
interface UpdateQueue {
    updates: QueuedUpdate[];
    processing: boolean;
    lastProcessed?: Date;
}

/**
 * Hook return value - enhanced with silent update capabilities
 */
interface UseAppVersionReturn {
    hasUpdate: boolean;
    currentVersion: string | null;
    newVersion: string | null;
    loading: boolean;
    checkForUpdates: () => Promise<void>;
    applyUpdate: () => void;
    // New properties for silent updates
    autoUpdateEnabled: boolean;
    lastUpdateCheck: Date | null;
    updateInProgress: boolean;
}

const VERSION_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
const STORAGE_KEY = 'app-version-info';
const STORAGE_BACKUP_KEY = 'app-version-info-backup';
const UPDATE_QUEUE_KEY = 'app-update-queue';

/**
 * Default configuration for silent updates
 */
const DEFAULT_SILENT_CONFIG: SilentUpdateConfig = {
    enabled: true,
    delayMs: 2000, // 2 second delay before applying
    respectUserActivity: true,
    inactivityThreshold: 30000, // 30 seconds
    maxRetries: 3,
    retryDelayMs: 5000
};

/**
 * Robust storage manager for version persistence with error handling and backup
 */
class VersionStorageManager {
    private maxRetries = 3;
    private retryDelayMs = 1000;

    /**
     * Store version information with backup and error handling
     */
    public async storeVersion(version: VersionInfo): Promise<boolean> {
        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                // Store primary version
                const versionData = JSON.stringify(version);
                localStorage.setItem(STORAGE_KEY, versionData);

                // Store backup copy
                localStorage.setItem(STORAGE_BACKUP_KEY, versionData);

                // Verify storage was successful
                const stored = localStorage.getItem(STORAGE_KEY);
                if (stored !== versionData) {
                    throw new Error('Version storage verification failed');
                }

                console.log('Version stored successfully:', version.version);
                return true;

            } catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                console.warn(`Version storage attempt ${attempt}/${this.maxRetries} failed:`, error);

                if (attempt < this.maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, this.retryDelayMs * attempt));
                }
            }
        }

        console.error('Failed to store version after all retries:', lastError);
        return false;
    }

    /**
     * Retrieve version information with fallback to backup
     */
    public getStoredVersion(): VersionInfo | null {
        try {
            // Try primary storage first
            const storedVersionStr = localStorage.getItem(STORAGE_KEY);
            if (storedVersionStr) {
                const version = JSON.parse(storedVersionStr);
                if (this.isValidVersionInfo(version)) {
                    return version;
                }
            }

            // Fallback to backup storage
            const backupVersionStr = localStorage.getItem(STORAGE_BACKUP_KEY);
            if (backupVersionStr) {
                const version = JSON.parse(backupVersionStr);
                if (this.isValidVersionInfo(version)) {
                    // Restore primary from backup
                    localStorage.setItem(STORAGE_KEY, backupVersionStr);
                    console.log('Restored version from backup');
                    return version;
                }
            }

            return null;

        } catch (error) {
            console.error('Failed to retrieve stored version:', error);
            return null;
        }
    }

    /**
     * Validate version info structure
     */
    private isValidVersionInfo(obj: any): obj is VersionInfo {
        return obj &&
            typeof obj.version === 'string' &&
            typeof obj.buildTime === 'string' &&
            typeof obj.buildId === 'string' &&
            typeof obj.cacheName === 'string';
    }

    /**
     * Clear version storage (for testing or reset)
     */
    public clearVersionStorage(): void {
        try {
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(STORAGE_BACKUP_KEY);
        } catch (error) {
            console.error('Failed to clear version storage:', error);
        }
    }
}

/**
 * Sequential update queue manager for handling multiple updates
 */
class UpdateQueueManager {
    private maxRetries = 3;

    /**
     * Add update to queue
     */
    public async queueUpdate(version: VersionInfo): Promise<string> {
        try {
            const queue = this.getQueue();
            const updateId = `update-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            const queuedUpdate: QueuedUpdate = {
                id: updateId,
                version,
                timestamp: new Date(),
                priority: Date.now(), // Higher timestamp = higher priority
                retryCount: 0
            };

            // Remove any existing updates for the same version
            queue.updates = queue.updates.filter(u => u.version.buildId !== version.buildId);

            // Add new update
            queue.updates.push(queuedUpdate);

            // Sort by priority (newest first)
            queue.updates.sort((a, b) => b.priority - a.priority);

            // Persist queue
            await this.persistQueue(queue);

            console.log('Update queued:', updateId, version.version);
            return updateId;

        } catch (error) {
            console.error('Failed to queue update:', error);
            throw error;
        }
    }

    /**
     * Get next update from queue
     */
    public getNextUpdate(): QueuedUpdate | null {
        try {
            const queue = this.getQueue();
            return queue.updates.length > 0 ? queue.updates[0] : null;
        } catch (error) {
            console.error('Failed to get next update:', error);
            return null;
        }
    }

    /**
     * Mark update as completed and remove from queue
     */
    public async completeUpdate(updateId: string): Promise<void> {
        try {
            const queue = this.getQueue();
            queue.updates = queue.updates.filter(u => u.id !== updateId);
            queue.lastProcessed = new Date();
            await this.persistQueue(queue);
            console.log('Update completed and removed from queue:', updateId);
        } catch (error) {
            console.error('Failed to complete update:', error);
        }
    }

    /**
     * Mark update as failed and handle retry logic
     */
    public async failUpdate(updateId: string, error: string): Promise<boolean> {
        try {
            const queue = this.getQueue();
            const update = queue.updates.find(u => u.id === updateId);

            if (!update) {
                return false;
            }

            update.retryCount++;

            if (update.retryCount >= this.maxRetries) {
                // Remove failed update after max retries
                queue.updates = queue.updates.filter(u => u.id !== updateId);
                console.error('Update failed permanently after max retries:', updateId, error);
                await this.persistQueue(queue);
                return false;
            } else {
                // Keep for retry
                console.warn(`Update failed, will retry (${update.retryCount}/${this.maxRetries}):`, updateId, error);
                await this.persistQueue(queue);
                return true;
            }
        } catch (persistError) {
            console.error('Failed to handle update failure:', persistError);
            return false;
        }
    }

    /**
     * Get current queue state
     */
    private getQueue(): UpdateQueue {
        try {
            const queueStr = localStorage.getItem(UPDATE_QUEUE_KEY);
            if (queueStr) {
                const queue = JSON.parse(queueStr);
                // Ensure updates array exists and convert timestamp strings back to Date objects
                if (queue.updates && Array.isArray(queue.updates)) {
                    queue.updates.forEach((update: any) => {
                        update.timestamp = new Date(update.timestamp);
                    });
                } else {
                    queue.updates = [];
                }
                if (queue.lastProcessed) {
                    queue.lastProcessed = new Date(queue.lastProcessed);
                }
                return queue;
            }
        } catch (error) {
            console.error('Failed to parse update queue:', error);
        }

        // Return empty queue if parsing fails
        return {
            updates: [],
            processing: false
        };
    }

    /**
     * Persist queue to storage
     */
    private async persistQueue(queue: UpdateQueue): Promise<void> {
        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                const queueData = JSON.stringify(queue);
                localStorage.setItem(UPDATE_QUEUE_KEY, queueData);

                // Verify storage
                const stored = localStorage.getItem(UPDATE_QUEUE_KEY);
                if (stored !== queueData) {
                    throw new Error('Queue storage verification failed');
                }

                return;

            } catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                console.warn(`Queue persistence attempt ${attempt}/${this.maxRetries} failed:`, error);

                if (attempt < this.maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                }
            }
        }

        throw lastError || new Error('Failed to persist queue after all retries');
    }

    /**
     * Clear the update queue
     */
    public clearQueue(): void {
        try {
            localStorage.removeItem(UPDATE_QUEUE_KEY);
        } catch (error) {
            console.error('Failed to clear update queue:', error);
        }
    }

    /**
     * Get queue status for debugging
     */
    public getQueueStatus(): { count: number; processing: boolean; lastProcessed?: Date } {
        const queue = this.getQueue();
        return {
            count: queue.updates.length,
            processing: queue.processing,
            lastProcessed: queue.lastProcessed
        };
    }
}

/**
 * User activity tracker class with comprehensive error handling
 */
class UserActivityTracker {
    private isActive = true;
    private lastActivityTime = new Date();
    private listeners: (() => void)[] = [];
    private eventTypes = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    private eventHandlers: Map<string, EventListener> = new Map();
    private inactivityCheckInterval: number | null = null;
    private hasSetupFailed = false;
    private fallbackMode = false;

    constructor(private inactivityThreshold: number) {
        this.setupEventListeners();
    }

    private setupEventListeners() {
        try {
            const handleActivity = () => {
                try {
                    this.isActive = true;
                    this.lastActivityTime = new Date();
                } catch (error) {
                    console.warn('Error updating activity state:', error);
                    // Continue with fallback behavior
                    this.fallbackMode = true;
                }
            };

            // Store handlers for proper cleanup
            this.eventTypes.forEach(eventType => {
                try {
                    const handler = handleActivity;
                    this.eventHandlers.set(eventType, handler);
                    document.addEventListener(eventType, handler, { passive: true });
                } catch (error) {
                    console.warn(`Failed to add event listener for ${eventType}:`, error);
                    this.hasSetupFailed = true;
                }
            });

            // Set up inactivity checking with error handling
            try {
                this.inactivityCheckInterval = window.setInterval(() => {
                    try {
                        const now = new Date();
                        const timeSinceLastActivity = now.getTime() - this.lastActivityTime.getTime();

                        if (timeSinceLastActivity > this.inactivityThreshold) {
                            this.isActive = false;
                            this.notifyListeners();
                        }
                    } catch (error) {
                        console.warn('Error in inactivity check:', error);
                        // Default to inactive state on error
                        this.isActive = false;
                        this.notifyListeners();
                    }
                }, 1000);
            } catch (error) {
                console.error('Failed to set up inactivity checking:', error);
                this.hasSetupFailed = true;
                // Fall back to always considering user inactive after threshold
                this.fallbackMode = true;
            }

            if (this.hasSetupFailed) {
                console.warn('User activity tracking setup had failures, using fallback mode');
            }
        } catch (error) {
            console.error('Critical failure in user activity tracker setup:', error);
            this.hasSetupFailed = true;
            this.fallbackMode = true;
        }
    }

    private notifyListeners() {
        try {
            this.listeners.forEach(listener => {
                try {
                    listener();
                } catch (error) {
                    console.warn('Error in activity listener callback:', error);
                }
            });
        } catch (error) {
            console.error('Error notifying activity listeners:', error);
        }
    }

    public getActivity(): UserActivity {
        try {
            // In fallback mode, use conservative estimates
            if (this.fallbackMode) {
                const now = new Date();
                const timeSinceLastActivity = now.getTime() - this.lastActivityTime.getTime();
                return {
                    isActive: timeSinceLastActivity < this.inactivityThreshold,
                    lastActivityTime: this.lastActivityTime,
                    inactivityThreshold: this.inactivityThreshold
                };
            }

            return {
                isActive: this.isActive,
                lastActivityTime: this.lastActivityTime,
                inactivityThreshold: this.inactivityThreshold
            };
        } catch (error) {
            console.error('Error getting activity state:', error);
            // Return safe defaults
            return {
                isActive: false, // Conservative default
                lastActivityTime: new Date(0),
                inactivityThreshold: this.inactivityThreshold
            };
        }
    }

    public onInactivity(callback: () => void) {
        try {
            this.listeners.push(callback);
            return () => {
                try {
                    const index = this.listeners.indexOf(callback);
                    if (index > -1) {
                        this.listeners.splice(index, 1);
                    }
                } catch (error) {
                    console.warn('Error removing activity listener:', error);
                }
            };
        } catch (error) {
            console.error('Error adding activity listener:', error);
            // Return no-op cleanup function
            return () => { };
        }
    }

    public cleanup() {
        try {
            // Clean up event listeners using stored handlers
            this.eventHandlers.forEach((handler, eventType) => {
                try {
                    document.removeEventListener(eventType, handler);
                } catch (error) {
                    console.warn(`Failed to remove event listener for ${eventType}:`, error);
                }
            });
            this.eventHandlers.clear();

            // Clear inactivity check interval
            if (this.inactivityCheckInterval !== null) {
                clearInterval(this.inactivityCheckInterval);
                this.inactivityCheckInterval = null;
            }

            // Clear listeners array
            this.listeners = [];
        } catch (error) {
            console.error('Error during activity tracker cleanup:', error);
        }
    }

    /**
     * Check if the tracker is in a healthy state
     */
    public isHealthy(): boolean {
        return !this.hasSetupFailed && !this.fallbackMode;
    }

    /**
     * Get diagnostic information about the tracker state
     */
    public getDiagnostics(): {
        hasSetupFailed: boolean;
        fallbackMode: boolean;
        listenersCount: number;
        eventHandlersCount: number;
        hasInactivityCheck: boolean;
    } {
        return {
            hasSetupFailed: this.hasSetupFailed,
            fallbackMode: this.fallbackMode,
            listenersCount: this.listeners.length,
            eventHandlersCount: this.eventHandlers.size,
            hasInactivityCheck: this.inactivityCheckInterval !== null
        };
    }
}

/**
 * Update timing manager for determining optimal update moments with error recovery
 */
class UpdateTimingManager {
    private scheduledUpdateId: number | null = null;
    private fallbackMode = false;
    private maxWaitTime = 60000; // Maximum wait time for user inactivity (1 minute)

    constructor(
        private userActivityTracker: UserActivityTracker | null,
        private config: SilentUpdateConfig
    ) {
        // Check if we need to use fallback mode
        if (!userActivityTracker || !config.respectUserActivity) {
            this.fallbackMode = true;
        } else {
            try {
                // Test the activity tracker
                userActivityTracker.getActivity();
                if (!userActivityTracker.isHealthy()) {
                    console.warn('Activity tracker is unhealthy, using fallback timing');
                    this.fallbackMode = true;
                }
            } catch (error) {
                console.warn('Activity tracker test failed, using fallback timing:', error);
                this.fallbackMode = true;
            }
        }
    }

    public shouldApplyUpdate(): boolean {
        if (this.fallbackMode || !this.config.respectUserActivity) {
            return true;
        }

        try {
            if (!this.userActivityTracker) {
                return true;
            }

            const activity = this.userActivityTracker.getActivity();
            return !activity.isActive;
        } catch (error) {
            console.warn('Error checking user activity, defaulting to apply update:', error);
            this.fallbackMode = true;
            return true;
        }
    }

    public scheduleUpdate(callback: () => void): void {
        this.cancelScheduledUpdate();

        try {
            if (this.fallbackMode || this.shouldApplyUpdate()) {
                // Apply immediately with configured delay
                this.scheduledUpdateId = window.setTimeout(() => {
                    try {
                        callback();
                    } catch (error) {
                        console.error('Error in scheduled update callback:', error);
                    }
                }, this.config.delayMs);
                return;
            }

            // Wait for user inactivity with timeout fallback
            if (this.userActivityTracker) {
                let hasExecuted = false;

                const executeUpdate = () => {
                    if (hasExecuted) return;
                    hasExecuted = true;

                    try {
                        callback();
                    } catch (error) {
                        console.error('Error in activity-based update callback:', error);
                    }
                };

                try {
                    const unsubscribe = this.userActivityTracker.onInactivity(() => {
                        try {
                            unsubscribe();
                            setTimeout(executeUpdate, this.config.delayMs);
                        } catch (error) {
                            console.warn('Error in inactivity callback:', error);
                            executeUpdate();
                        }
                    });

                    // Fallback timeout - don't wait forever for user inactivity
                    this.scheduledUpdateId = window.setTimeout(() => {
                        try {
                            unsubscribe();
                        } catch (error) {
                            console.warn('Error unsubscribing from activity tracker:', error);
                        }

                        console.log('User activity timeout reached, applying update anyway');
                        executeUpdate();
                    }, this.maxWaitTime);

                } catch (error) {
                    console.warn('Error setting up activity-based scheduling:', error);
                    // Fall back to immediate execution
                    setTimeout(executeUpdate, this.config.delayMs);
                }
            } else {
                // No activity tracker available, apply immediately
                this.scheduledUpdateId = window.setTimeout(() => {
                    try {
                        callback();
                    } catch (error) {
                        console.error('Error in fallback update callback:', error);
                    }
                }, this.config.delayMs);
            }
        } catch (error) {
            console.error('Error in scheduleUpdate:', error);
            // Ultimate fallback - execute immediately
            try {
                callback();
            } catch (callbackError) {
                console.error('Error in emergency update callback:', callbackError);
            }
        }
    }

    public cancelScheduledUpdate(): void {
        try {
            if (this.scheduledUpdateId !== null) {
                clearTimeout(this.scheduledUpdateId);
                this.scheduledUpdateId = null;
            }
        } catch (error) {
            console.warn('Error canceling scheduled update:', error);
        }
    }

    /**
     * Get diagnostic information about the timing manager
     */
    public getDiagnostics(): {
        fallbackMode: boolean;
        hasScheduledUpdate: boolean;
        activityTrackerHealthy: boolean;
        respectUserActivity: boolean;
    } {
        return {
            fallbackMode: this.fallbackMode,
            hasScheduledUpdate: this.scheduledUpdateId !== null,
            activityTrackerHealthy: this.userActivityTracker?.isHealthy() ?? false,
            respectUserActivity: this.config.respectUserActivity
        };
    }
}

// Import the enhanced cache management utilities
import { CacheManager, DEFAULT_CACHE_CONFIG } from '../utils/cache-management';
// Import comprehensive error recovery system
import { withErrorRecovery } from '../utils/error-recovery';

/**
 * Custom hook to detect app version updates with silent update capabilities
 * 
 * Features:
 * - Polls /version.json every 5 minutes
 * - Compares with locally stored version
 * - Provides update status and reload function
 * - Supports silent automatic updates with user activity awareness
 * - Maintains backward compatibility with existing interface
 * 
 * @param silentConfig Optional configuration for silent updates
 * @returns Object with update status and control functions
 */
export function useAppVersion(silentConfig?: Partial<SilentUpdateConfig>): UseAppVersionReturn {
    const [hasUpdate, setHasUpdate] = useState(false);
    const [currentVersion, setCurrentVersion] = useState<string | null>(null);
    const [newVersion, setNewVersion] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [updateState, setUpdateState] = useState<UpdateState>({
        status: 'idle',
        lastCheck: new Date(),
        retryCount: 0
    });

    // Merge provided config with defaults and memoize
    const config = useMemo(() => ({ ...DEFAULT_SILENT_CONFIG, ...silentConfig }), [
        silentConfig?.enabled,
        silentConfig?.delayMs,
        silentConfig?.respectUserActivity,
        silentConfig?.inactivityThreshold,
        silentConfig?.maxRetries,
        silentConfig?.retryDelayMs
    ]);

    // Refs for cleanup and persistence
    const userActivityTrackerRef = useRef<UserActivityTracker | null>(null);
    const updateTimingManagerRef = useRef<UpdateTimingManager | null>(null);
    const cacheManagerRef = useRef<CacheManager>(new CacheManager(DEFAULT_CACHE_CONFIG));
    const retryTimeoutRef = useRef<number | null>(null);
    const storageManagerRef = useRef<VersionStorageManager>(new VersionStorageManager());
    const queueManagerRef = useRef<UpdateQueueManager>(new UpdateQueueManager());
    const processingUpdateRef = useRef<string | null>(null);

    // Initialize activity tracking and timing manager with comprehensive error recovery
    useEffect(() => {
        if (config.enabled && config.respectUserActivity) {
            let activityTracker: UserActivityTracker | null = null;
            let timingManager: UpdateTimingManager | null = null;

            // Enhanced activity tracker initialization with multiple fallback strategies
            const initializeActivityTracking = async () => {
                const initStrategies = [
                    {
                        name: 'full activity tracking',
                        fn: () => new UserActivityTracker(config.inactivityThreshold)
                    },
                    {
                        name: 'reduced event tracking',
                        fn: () => new UserActivityTracker(config.inactivityThreshold * 0.5) // Shorter threshold
                    },
                    {
                        name: 'minimal activity tracking',
                        fn: () => new UserActivityTracker(Math.max(config.inactivityThreshold * 0.25, 5000)) // Very short threshold
                    }
                ];

                for (const strategy of initStrategies) {
                    try {
                        console.log(`Attempting activity tracker initialization: ${strategy.name}`);
                        activityTracker = strategy.fn();

                        // Test the tracker immediately
                        const testActivity = activityTracker.getActivity();
                        const diagnostics = activityTracker.getDiagnostics();

                        console.log('Activity tracker test results:', {
                            isHealthy: activityTracker.isHealthy(),
                            diagnostics,
                            testActivity: {
                                isActive: testActivity.isActive,
                                threshold: testActivity.inactivityThreshold
                            }
                        });

                        if (activityTracker.isHealthy()) {
                            console.log(`Activity tracker initialized successfully using: ${strategy.name}`);
                            break;
                        } else {
                            console.warn(`Activity tracker unhealthy with ${strategy.name}, trying next strategy`);
                            activityTracker.cleanup();
                            activityTracker = null;
                        }

                    } catch (strategyError) {
                        console.warn(`Activity tracker strategy '${strategy.name}' failed:`, strategyError);
                        if (activityTracker) {
                            try {
                                activityTracker.cleanup();
                            } catch (cleanupError) {
                                console.warn('Error cleaning up failed activity tracker:', cleanupError);
                            }
                            activityTracker = null;
                        }
                    }
                }

                return activityTracker;
            };

            // Enhanced timing manager initialization with error recovery
            const initializeTimingManager = (tracker: UserActivityTracker | null) => {
                const timingStrategies = [
                    {
                        name: 'full timing with activity tracking',
                        fn: () => new UpdateTimingManager(tracker, config)
                    },
                    {
                        name: 'timing without activity respect',
                        fn: () => new UpdateTimingManager(tracker, { ...config, respectUserActivity: false })
                    },
                    {
                        name: 'immediate timing fallback',
                        fn: () => new UpdateTimingManager(null, { ...config, respectUserActivity: false, delayMs: 0 })
                    }
                ];

                for (const strategy of timingStrategies) {
                    try {
                        console.log(`Attempting timing manager initialization: ${strategy.name}`);
                        const manager = strategy.fn();

                        // Test the timing manager
                        const shouldApply = manager.shouldApplyUpdate();
                        const diagnostics = manager.getDiagnostics();

                        console.log('Timing manager test results:', {
                            shouldApplyUpdate: shouldApply,
                            diagnostics
                        });

                        console.log(`Timing manager initialized successfully using: ${strategy.name}`);
                        return manager;

                    } catch (strategyError) {
                        console.warn(`Timing manager strategy '${strategy.name}' failed:`, strategyError);
                    }
                }

                console.error('All timing manager strategies failed, updates will be immediate');
                return null;
            };

            // Execute initialization with comprehensive error handling
            const performInitialization = async () => {
                try {
                    // Initialize activity tracking
                    activityTracker = await initializeActivityTracking();
                    userActivityTrackerRef.current = activityTracker;

                    if (!activityTracker) {
                        console.warn('All activity tracking strategies failed, using timing-only approach');
                    }

                    // Initialize timing manager
                    timingManager = initializeTimingManager(activityTracker);
                    updateTimingManagerRef.current = timingManager;

                    if (!timingManager) {
                        console.warn('All timing manager strategies failed, updates will be immediate');
                    }

                    // Set up health monitoring for ongoing error recovery
                    const healthCheckInterval = setInterval(() => {
                        try {
                            if (activityTracker && !activityTracker.isHealthy()) {
                                console.warn('Activity tracker became unhealthy, switching to fallback mode');
                                clearInterval(healthCheckInterval);

                                // Reinitialize with fallback configuration
                                try {
                                    activityTracker.cleanup();
                                } catch (cleanupError) {
                                    console.warn('Error cleaning up unhealthy tracker:', cleanupError);
                                }

                                updateTimingManagerRef.current = new UpdateTimingManager(
                                    null,
                                    { ...config, respectUserActivity: false }
                                );
                                userActivityTrackerRef.current = null;
                            }
                        } catch (healthCheckError) {
                            console.warn('Health check failed:', healthCheckError);
                            clearInterval(healthCheckInterval);
                        }
                    }, 30000); // Check every 30 seconds

                    // Store interval for cleanup
                    (userActivityTrackerRef as any).healthCheckInterval = healthCheckInterval;

                } catch (initError) {
                    console.error('Complete initialization failed:', initError);

                    // Ultimate fallback - create minimal timing manager
                    try {
                        updateTimingManagerRef.current = new UpdateTimingManager(
                            null,
                            { ...config, respectUserActivity: false, delayMs: 1000 }
                        );
                        console.warn('Using ultimate fallback timing manager');
                    } catch (ultimateError) {
                        console.error('Even ultimate fallback failed:', ultimateError);
                        // Continue without timing manager - updates will be immediate
                        updateTimingManagerRef.current = null;
                    }
                }
            };

            // Execute initialization asynchronously to avoid blocking
            performInitialization().catch(error => {
                console.error('Async initialization failed:', error);
            });
        }

        return () => {
            try {
                // Enhanced cleanup with error handling
                if ((userActivityTrackerRef as any).healthCheckInterval) {
                    try {
                        clearInterval((userActivityTrackerRef as any).healthCheckInterval);
                    } catch (intervalError) {
                        console.warn('Error clearing health check interval:', intervalError);
                    }
                }

                if (userActivityTrackerRef.current) {
                    try {
                        userActivityTrackerRef.current.cleanup();
                    } catch (cleanupError) {
                        console.warn('Error during activity tracker cleanup:', cleanupError);
                    }
                }

                if (updateTimingManagerRef.current) {
                    try {
                        updateTimingManagerRef.current.cancelScheduledUpdate();
                    } catch (cancelError) {
                        console.warn('Error canceling scheduled update:', cancelError);
                    }
                }

                if (retryTimeoutRef.current) {
                    try {
                        clearTimeout(retryTimeoutRef.current);
                    } catch (timeoutError) {
                        console.warn('Error clearing retry timeout:', timeoutError);
                    }
                }

                // Cancel any processing updates
                processingUpdateRef.current = null;

            } catch (error) {
                console.error('Error during useAppVersion cleanup:', error);
            }
        };
    }, [config, config.enabled, config.respectUserActivity, config.inactivityThreshold]);

    /**
     * Process queued updates sequentially with comprehensive error recovery
     */
    const processUpdateQueue = useCallback(async () => {
        if (processingUpdateRef.current) {
            console.log('Update already in progress, skipping queue processing');
            return;
        }

        const nextUpdate = queueManagerRef.current.getNextUpdate();
        if (!nextUpdate) {
            return;
        }

        processingUpdateRef.current = nextUpdate.id;
        let criticalError = false;

        try {
            setUpdateState(prev => ({ ...prev, status: 'applying' }));
            console.log('Processing queued update:', nextUpdate.id, nextUpdate.version.version);

            // Step 1: Clear caches with comprehensive error recovery
            let cacheResult;
            try {
                cacheResult = await withErrorRecovery(
                    () => cacheManagerRef.current.clearAllCaches(),
                    `cache-clearing-${nextUpdate.id}`
                );

                if (!cacheResult.success) {
                    console.warn('Cache clearing had issues:', cacheResult.errors);

                    // Determine if cache failures are critical
                    const hasCriticalCacheFailure = cacheResult.errors.some(error =>
                        error.includes('Service Worker cache clearing failed') ||
                        error.includes('Browser cache clearing failed')
                    );

                    if (hasCriticalCacheFailure && cacheResult.errors.length > 2) {
                        console.warn('Multiple critical cache failures detected, but continuing with update');
                    }
                }
            } catch (cacheError) {
                console.error('Cache clearing completely failed after recovery attempts:', cacheError);

                // Try one final emergency cache clearing approach
                try {
                    console.log('Attempting emergency cache clearing as final fallback');
                    if ('caches' in window) {
                        const cacheNames = await caches.keys();
                        await Promise.allSettled(cacheNames.map(name => caches.delete(name)));
                    }

                    cacheResult = {
                        success: true,
                        operations: {
                            serviceWorkerCaches: true,
                            browserCaches: false,
                            applicationStorage: false,
                            serviceWorkerUpdate: false
                        },
                        errors: ['Emergency cache clearing used']
                    };
                } catch (emergencyError) {
                    console.error('Emergency cache clearing also failed:', emergencyError);
                    // Continue with degraded functionality
                    cacheResult = {
                        success: false,
                        operations: {
                            serviceWorkerCaches: false,
                            browserCaches: false,
                            applicationStorage: false,
                            serviceWorkerUpdate: false
                        },
                        errors: [`Complete cache clearing failure: ${cacheError}`]
                    };
                }
            }

            // Step 2: Store version with comprehensive error recovery
            try {
                await withErrorRecovery(
                    () => storageManagerRef.current.storeVersion(nextUpdate.version),
                    `version-storage-${nextUpdate.id}`,
                    { maxRetries: 3, baseDelayMs: 1000 }
                );
            } catch (storageError) {
                console.error('Version storage failed after recovery attempts:', storageError);

                // Multi-level emergency storage fallback
                const emergencyStrategies = [
                    {
                        name: 'localStorage emergency backup',
                        fn: () => localStorage.setItem('emergency-version-backup', JSON.stringify({
                            version: nextUpdate.version,
                            timestamp: Date.now(),
                            updateId: nextUpdate.id
                        }))
                    },
                    {
                        name: 'sessionStorage emergency backup',
                        fn: () => sessionStorage.setItem('emergency-version-backup', JSON.stringify({
                            version: nextUpdate.version,
                            timestamp: Date.now(),
                            updateId: nextUpdate.id
                        }))
                    },
                    {
                        name: 'memory-only storage',
                        fn: () => {
                            (window as any).emergencyVersionBackup = {
                                version: nextUpdate.version,
                                timestamp: Date.now(),
                                updateId: nextUpdate.id
                            };
                        }
                    }
                ];

                let emergencySuccess = false;
                for (const strategy of emergencyStrategies) {
                    try {
                        strategy.fn();
                        console.warn(`Used emergency storage strategy: ${strategy.name}`);
                        emergencySuccess = true;
                        break;
                    } catch (emergencyError) {
                        console.warn(`Emergency storage strategy '${strategy.name}' failed:`, emergencyError);
                    }
                }

                if (!emergencySuccess) {
                    console.error('All emergency storage strategies failed');
                    criticalError = true;
                    throw new Error('Complete version storage failure - cannot proceed safely');
                }
            }

            // Step 3: Mark update as completed (with error handling)
            try {
                await queueManagerRef.current.completeUpdate(nextUpdate.id);
            } catch (queueError) {
                console.error('Failed to mark update as completed in queue:', queueError);
                // Try to clear the queue manually as fallback
                try {
                    queueManagerRef.current.clearQueue();
                    console.warn('Cleared entire update queue as fallback');
                } catch (clearError) {
                    console.error('Failed to clear update queue:', clearError);
                }
            }

            setUpdateState(prev => ({ ...prev, status: 'completed' }));

            // Step 4: Force reload with comprehensive error handling
            try {
                // Add a small delay to ensure state updates are processed
                await new Promise(resolve => setTimeout(resolve, 100));

                cacheManagerRef.current.forceReloadFromServer();
            } catch (reloadError) {
                console.error('Force reload failed:', reloadError);

                // Try alternative reload methods
                try {
                    console.log('Attempting alternative reload method...');
                    window.location.href = window.location.href + (window.location.href.includes('?') ? '&' : '?') + 'update_reload=' + Date.now();
                } catch (altReloadError) {
                    console.error('Alternative reload also failed:', altReloadError);
                    // Final fallback - standard reload
                    try {
                        window.location.reload();
                    } catch (finalReloadError) {
                        console.error('All reload methods failed:', finalReloadError);
                        criticalError = true;
                        throw new Error('Complete reload failure - manual refresh required');
                    }
                }
            }

        } catch (error) {
            console.error('Queued update failed:', error);

            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const isRecoverableError = !criticalError &&
                !errorMessage.includes('Complete') &&
                !errorMessage.includes('manual refresh required');

            // Enhanced error recovery logic
            let shouldRetry = false;
            if (isRecoverableError) {
                try {
                    shouldRetry = await queueManagerRef.current.failUpdate(nextUpdate.id, errorMessage);
                } catch (failHandlingError) {
                    console.error('Failed to handle update failure:', failHandlingError);
                    // Force retry decision based on error type and attempt count
                    shouldRetry = nextUpdate.retryCount < 2 && !criticalError;
                }
            }

            setUpdateState(prev => ({
                ...prev,
                status: shouldRetry ? 'update-available' : 'failed',
                error: errorMessage,
                retryCount: nextUpdate.retryCount
            }));

            // Schedule retry with exponential backoff and jitter
            if (shouldRetry) {
                const baseDelay = config.retryDelayMs || 5000;
                const retryDelay = baseDelay * Math.pow(2, nextUpdate.retryCount) + Math.random() * 1000;

                console.log(`Scheduling update retry in ${Math.round(retryDelay)}ms (attempt ${nextUpdate.retryCount + 1})`);

                retryTimeoutRef.current = window.setTimeout(() => {
                    console.log('Executing scheduled update retry');
                    processUpdateQueue();
                }, retryDelay);
            } else {
                console.error('Update failed permanently:', errorMessage);

                // If it's a critical error, notify user
                if (criticalError) {
                    console.error('Critical update failure - user intervention may be required');
                    // Could potentially show a user notification here in the future
                }
            }
        } finally {
            processingUpdateRef.current = null;
        }
    }, [config.retryDelayMs]);

    /**
     * Apply automatic update with enhanced queue handling
     */
    const applyAutomaticUpdate = useCallback(async (serverVersion: VersionInfo) => {
        try {
            // Add update to queue for sequential processing
            const updateId = await queueManagerRef.current.queueUpdate(serverVersion);
            console.log('Update queued for processing:', updateId);

            // Process the queue
            await processUpdateQueue();

        } catch (error) {
            console.error('Failed to queue automatic update:', error);

            setUpdateState(prev => ({
                ...prev,
                status: 'failed',
                error: error instanceof Error ? error.message : 'Unknown error',
                retryCount: prev.retryCount + 1
            }));
        }
    }, [processUpdateQueue]);

    /**
     * Enhanced network request with comprehensive retry logic and error recovery
     */
    const fetchVersionWithRetry = useCallback(async (retryCount = 0): Promise<VersionInfo> => {
        const maxRetries = config.maxRetries || 3;
        const baseDelay = config.retryDelayMs || 1000;

        try {
            // Calculate timeout based on retry attempt with progressive increase
            const timeoutMs = Math.min(5000 + (retryCount * 2000), 15000); // Cap at 15 seconds

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

            try {
                // Enhanced request with multiple fallback strategies
                const requestOptions = {
                    cache: 'no-store' as RequestCache,
                    headers: {
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache',
                        'Expires': '0',
                        'Accept': 'application/json',
                        'X-Retry-Attempt': retryCount.toString()
                    },
                    signal: controller.signal,
                    mode: 'cors' as RequestMode,
                    credentials: 'same-origin' as RequestCredentials
                };

                // Try multiple URL strategies for better reliability
                const urlStrategies = [
                    `/version.json?t=${Date.now()}&retry=${retryCount}`,
                    `/version.json?cache_bust=${Date.now()}&attempt=${retryCount}`,
                    `./version.json?nocache=${Date.now()}&r=${retryCount}`
                ];

                let lastFetchError: Error | null = null;

                for (let urlIndex = 0; urlIndex < urlStrategies.length; urlIndex++) {
                    try {
                        const response = await fetch(urlStrategies[urlIndex], requestOptions);

                        if (!response.ok) {
                            // Enhanced HTTP error handling
                            // Specific handling for different HTTP errors
                            if (response.status === 404) {
                                throw new Error(`Version file not found (404) at ${response.url}`);
                            } else if (response.status >= 500) {
                                throw new Error(`Server error (${response.status}): ${response.statusText}`);
                            } else if (response.status === 429) {
                                throw new Error(`Rate limited (429) - too many requests`);
                            } else {
                                throw new Error(`HTTP ${response.status}: ${response.statusText} (${response.url})`);
                            }
                        }

                        // Enhanced response validation
                        const contentType = response.headers.get('content-type');
                        if (!contentType || !contentType.includes('application/json')) {
                            console.warn('Unexpected content type:', contentType);
                        }

                        const responseText = await response.text();
                        if (!responseText.trim()) {
                            throw new Error('Empty response received from server');
                        }

                        let serverVersion: VersionInfo;
                        try {
                            serverVersion = JSON.parse(responseText);
                        } catch (parseError) {
                            throw new Error(`Invalid JSON response: ${parseError}`);
                        }

                        // Enhanced validation with detailed error messages
                        const validationErrors: string[] = [];
                        if (!serverVersion || typeof serverVersion !== 'object') {
                            validationErrors.push('Response is not a valid object');
                        } else {
                            if (typeof serverVersion.version !== 'string' || !serverVersion.version.trim()) {
                                validationErrors.push('Missing or invalid version field');
                            }
                            if (typeof serverVersion.buildId !== 'string' || !serverVersion.buildId.trim()) {
                                validationErrors.push('Missing or invalid buildId field');
                            }
                            if (typeof serverVersion.buildTime !== 'string' || !serverVersion.buildTime.trim()) {
                                validationErrors.push('Missing or invalid buildTime field');
                            }
                            if (typeof serverVersion.cacheName !== 'string' || !serverVersion.cacheName.trim()) {
                                validationErrors.push('Missing or invalid cacheName field');
                            }
                        }

                        if (validationErrors.length > 0) {
                            throw new Error(`Invalid version response structure: ${validationErrors.join(', ')}`);
                        }

                        // Success - clear timeout and return
                        clearTimeout(timeoutId);
                        console.log(`Version fetch successful on attempt ${retryCount + 1}, URL strategy ${urlIndex + 1}`);
                        return serverVersion;

                    } catch (fetchError) {
                        lastFetchError = fetchError instanceof Error ? fetchError : new Error(String(fetchError));
                        console.warn(`URL strategy ${urlIndex + 1} failed:`, lastFetchError.message);

                        // If this isn't the last URL strategy, continue to next
                        if (urlIndex < urlStrategies.length - 1) {
                            continue;
                        }

                        // All URL strategies failed, throw the last error
                        throw lastFetchError;
                    }
                }

            } finally {
                clearTimeout(timeoutId);
            }

        } catch (error) {
            // Enhanced error classification and recovery
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorName = (error as any)?.name || 'UnknownError';

            const isNetworkError = error instanceof TypeError ||
                errorName === 'AbortError' ||
                errorName === 'NetworkError' ||
                errorMessage.includes('fetch') ||
                errorMessage.includes('network') ||
                (error as any)?.code === 'NETWORK_ERROR';

            const isTimeoutError = errorName === 'AbortError' ||
                errorMessage.includes('timeout') ||
                errorMessage.includes('aborted');

            const isServerError = (error as any)?.status >= 500 ||
                errorMessage.includes('Server error');

            const isRateLimitError = (error as any)?.status === 429 ||
                errorMessage.includes('Rate limited');

            const isRetryableError = isNetworkError ||
                isTimeoutError ||
                isServerError ||
                isRateLimitError ||
                (error as any)?.status === 408; // Request timeout

            console.warn(`Version fetch attempt ${retryCount + 1}/${maxRetries + 1} failed:`, {
                error: errorMessage,
                errorName,
                isNetworkError,
                isTimeoutError,
                isServerError,
                isRateLimitError,
                isRetryableError,
                retryCount,
                willRetry: retryCount < maxRetries && isRetryableError
            });

            if (retryCount < maxRetries && isRetryableError) {
                // Enhanced exponential backoff with jitter and rate limit handling
                let delay = baseDelay * Math.pow(2, retryCount) + Math.random() * 1000;

                // Special handling for rate limits - longer delay
                if (isRateLimitError) {
                    delay = Math.max(delay, 10000 + Math.random() * 5000); // 10-15 second delay
                }

                // Cap maximum delay
                delay = Math.min(delay, 30000); // Max 30 seconds

                console.log(`Retrying version fetch in ${Math.round(delay)}ms... (${isRateLimitError ? 'rate limit backoff' : 'standard retry'})`);

                await new Promise(resolve => setTimeout(resolve, delay));
                return fetchVersionWithRetry(retryCount + 1);
            }

            // Enhanced final failure handling with recovery suggestions
            let enhancedErrorMessage = `Failed to fetch version after ${retryCount + 1} attempts: ${errorMessage}`;

            if (isNetworkError) {
                enhancedErrorMessage += ' (Network connectivity issue - check internet connection)';
            } else if (isServerError) {
                enhancedErrorMessage += ' (Server error - service may be temporarily unavailable)';
            } else if (isRateLimitError) {
                enhancedErrorMessage += ' (Rate limited - too many requests, try again later)';
            } else if (errorMessage.includes('404')) {
                enhancedErrorMessage += ' (Version file not found - deployment issue)';
            }

            throw new Error(enhancedErrorMessage);
        }

        throw new Error('Unreachable');
    }, [config.maxRetries, config.retryDelayMs]);

    /**
     * Fetch and check version from server with silent update support and comprehensive error recovery
     */
    const checkForUpdates = useCallback(async () => {
        try {
            setUpdateState(prev => ({ ...prev, status: 'checking', lastCheck: new Date() }));

            const serverVersion = await withErrorRecovery(
                () => fetchVersionWithRetry(),
                'version-check',
                { maxRetries: config.maxRetries, baseDelayMs: config.retryDelayMs }
            );

            // Get stored version using enhanced storage manager
            const storedVersion = storageManagerRef.current.getStoredVersion();

            // First time or no stored version
            if (!storedVersion) {
                const storageSuccess = await storageManagerRef.current.storeVersion(serverVersion);
                if (!storageSuccess) {
                    console.warn('Failed to store initial version, continuing anyway');
                }
                setCurrentVersion(serverVersion.version);
                setLoading(false);
                setUpdateState(prev => ({ ...prev, status: 'idle' }));
                return;
            }

            // Compare versions using buildId (most reliable)
            // buildId takes priority - if buildIds are the same, no update needed
            const isNewVersion = serverVersion.buildId !== storedVersion.buildId;

            if (isNewVersion) {
                console.log('🔔 New version detected:', {
                    current: storedVersion.version,
                    new: serverVersion.version,
                    currentBuildId: storedVersion.buildId,
                    newBuildId: serverVersion.buildId,
                });

                setHasUpdate(true);
                setCurrentVersion(storedVersion.version);
                setNewVersion(serverVersion.version);
                setUpdateState(prev => ({ ...prev, status: 'update-available' }));

                // Apply silent update if enabled
                if (config.enabled) {
                    if (updateTimingManagerRef.current) {
                        updateTimingManagerRef.current.scheduleUpdate(() => {
                            applyAutomaticUpdate(serverVersion);
                        });
                    } else {
                        // Apply immediately if no timing manager
                        setTimeout(() => {
                            applyAutomaticUpdate(serverVersion);
                        }, config.delayMs);
                    }
                }
            } else {
                setCurrentVersion(storedVersion.version);
                setUpdateState(prev => ({ ...prev, status: 'idle' }));
            }

            setLoading(false);
        } catch (error) {
            console.error('Error checking for updates:', error);
            setLoading(false);
            setUpdateState(prev => ({
                ...prev,
                status: 'failed',
                error: error instanceof Error ? error.message : 'Unknown error'
            }));
        }
    }, [config.enabled, config.delayMs, applyAutomaticUpdate]);

    /**
     * Apply the update by reloading the page and clearing cache (manual trigger)
     */
    const applyUpdate = useCallback(async () => {
        try {
            setUpdateState(prev => ({ ...prev, status: 'applying' }));

            // Use enhanced cache manager
            const result = await cacheManagerRef.current.clearAllCaches();

            if (!result.success) {
                console.warn('Some cache clearing operations failed:', result.errors);
                // Continue anyway - partial cache clearing is better than none
            }

            // Update stored version before reload using enhanced storage
            try {
                const response = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' });
                const newVersionInfo: VersionInfo = await response.json();
                const storageSuccess = await storageManagerRef.current.storeVersion(newVersionInfo);
                if (!storageSuccess) {
                    console.warn('Failed to store version before reload, continuing anyway');
                }
            } catch (error) {
                console.warn('Failed to fetch latest version before reload:', error);
            }

            // Force reload from server
            cacheManagerRef.current.forceReloadFromServer();

        } catch (error) {
            console.error('Manual update failed:', error);
            // Fallback to simple reload using cache manager
            cacheManagerRef.current.forceReloadFromServer();
        }
    }, []);

    // Check for updates on mount and process any queued updates
    useEffect(() => {
        // Process any pending updates from previous sessions
        const queueStatus = queueManagerRef.current.getQueueStatus();
        if (queueStatus.count > 0) {
            console.log(`Found ${queueStatus.count} pending updates from previous session`);
            processUpdateQueue();
        }

        checkForUpdates();
    }, [checkForUpdates, processUpdateQueue]);

    // Set up periodic checking
    useEffect(() => {
        const interval = setInterval(() => {
            checkForUpdates();
        }, VERSION_CHECK_INTERVAL);

        return () => clearInterval(interval);
    }, [checkForUpdates]);

    // Listen for visibility change to check when user returns
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                checkForUpdates();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [checkForUpdates]);

    return {
        hasUpdate,
        currentVersion,
        newVersion,
        loading,
        checkForUpdates,
        applyUpdate,
        // New properties for silent updates
        autoUpdateEnabled: config.enabled,
        lastUpdateCheck: updateState.lastCheck,
        updateInProgress: updateState.status === 'applying',
    };
}
