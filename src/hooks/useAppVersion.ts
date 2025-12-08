import { useState, useEffect, useCallback } from 'react';

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
 * Hook return value
 */
interface UseAppVersionReturn {
    hasUpdate: boolean;
    currentVersion: string | null;
    newVersion: string | null;
    loading: boolean;
    checkForUpdates: () => Promise<void>;
    applyUpdate: () => void;
}

const VERSION_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
const STORAGE_KEY = 'app-version-info';

/**
 * Custom hook to detect app version updates
 * 
 * Features:
 * - Polls /version.json every 5 minutes
 * - Compares with locally stored version
 * - Provides update status and reload function
 * 
 * @returns Object with update status and control functions
 */
export function useAppVersion(): UseAppVersionReturn {
    const [hasUpdate, setHasUpdate] = useState(false);
    const [currentVersion, setCurrentVersion] = useState<string | null>(null);
    const [newVersion, setNewVersion] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    /**
     * Fetch and check version from server
     */
    const checkForUpdates = useCallback(async () => {
        try {
            // Fetch version.json with cache-busting
            const response = await fetch(`/version.json?t=${Date.now()}`, {
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache',
                },
            });

            if (!response.ok) {
                console.warn('Failed to fetch version info');
                return;
            }

            const serverVersion: VersionInfo = await response.json();

            // Get stored version from localStorage
            const storedVersionStr = localStorage.getItem(STORAGE_KEY);
            const storedVersion: VersionInfo | null = storedVersionStr
                ? JSON.parse(storedVersionStr)
                : null;

            // First time or no stored version
            if (!storedVersion) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(serverVersion));
                setCurrentVersion(serverVersion.version);
                setLoading(false);
                return;
            }

            // Compare versions using buildId (most reliable)
            // or fallback to version number
            const isNewVersion =
                serverVersion.buildId !== storedVersion.buildId ||
                serverVersion.version !== storedVersion.version;

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
            } else {
                setCurrentVersion(storedVersion.version);
            }

            setLoading(false);
        } catch (error) {
            console.error('Error checking for updates:', error);
            setLoading(false);
        }
    }, []);

    /**
     * Apply the update by reloading the page and clearing cache
     */
    const applyUpdate = useCallback(() => {
        // Clear all caches
        if ('caches' in window) {
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        console.log('Deleting cache:', cacheName);
                        return caches.delete(cacheName);
                    })
                );
            }).then(() => {
                // Update stored version before reload
                fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' })
                    .then(res => res.json())
                    .then((newVersionInfo: VersionInfo) => {
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(newVersionInfo));
                        // Force reload from server
                        (window.location as any).reload();
                    })
                    .catch(() => {
                        // Reload anyway even if version fetch fails
                        (window.location as any).reload();
                    });
            });
        } else {
            // No cache API, just reload
            (window.location as any).reload();
        }
    }, []);

    // Check for updates on mount
    useEffect(() => {
        checkForUpdates();
    }, [checkForUpdates]);

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
    };
}
