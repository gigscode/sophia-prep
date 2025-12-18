/**
 * Update Manager Utility
 * Provides manual controls for testing the silent update system
 */

import { silentUpdateService } from '../services/silent-update-service';

export class UpdateManager {
  /**
   * Manually check for updates (for testing)
   */
  static async checkForUpdates(): Promise<void> {
    console.log('Manually checking for updates...');
    await silentUpdateService.checkNow();
  }

  /**
   * Force a cache clear and reload (for testing)
   */
  static async forceUpdate(): Promise<void> {
    console.log('Forcing app update...');
    
    // Clear all caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    }

    // Clear storage
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      // Storage might be disabled
    }

    // Force reload with cache busting
    const url = new URL(window.location.href);
    url.searchParams.set('_force_update', Date.now().toString());
    window.location.replace(url.toString());
  }

  /**
   * Get current app version
   */
  static getCurrentVersion(): string {
    const metaVersion = document.querySelector('meta[name="app-version"]')?.getAttribute('content');
    return metaVersion || 'unknown';
  }

  /**
   * Get build time
   */
  static getBuildTime(): string {
    const buildTime = document.querySelector('meta[name="build-time"]')?.getAttribute('content');
    return buildTime || 'unknown';
  }

  /**
   * Set custom update check interval (for testing)
   */
  static setUpdateInterval(seconds: number): void {
    silentUpdateService.setCheckInterval(seconds * 1000);
    console.log(`Update check interval set to ${seconds} seconds`);
  }
}

// Expose to window for testing in development
if (import.meta.env.DEV) {
  (window as any).updateManager = UpdateManager;
  console.log('UpdateManager available at window.updateManager for testing');
}