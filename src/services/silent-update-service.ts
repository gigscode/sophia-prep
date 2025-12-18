/**
 * Silent Update Service
 * 
 * Automatically detects new app versions and performs silent updates
 * by clearing cache and reloading the app in the background without
 * user notification or awareness.
 */

interface AppVersion {
  version: string;
  buildTime: string;
  hash: string;
}

class SilentUpdateService {
  private checkInterval: number = 30000; // Check every 30 seconds
  private intervalId: NodeJS.Timeout | null = null;
  private currentVersion: string | null = null;
  private isChecking = false;
  private maxRetries = 3;
  private retryCount = 0;

  /**
   * Initialize the silent update service
   */
  public init(): void {
    this.currentVersion = this.getCurrentVersion();
    this.startVersionChecking();
    
    // Also check on window focus (when user returns to tab)
    window.addEventListener('focus', () => {
      this.checkForUpdates();
    });

    // Check on page visibility change
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.checkForUpdates();
      }
    });
  }

  /**
   * Start periodic version checking
   */
  private startVersionChecking(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.intervalId = setInterval(() => {
      this.checkForUpdates();
    }, this.checkInterval);
  }

  /**
   * Get current app version from build
   */
  private getCurrentVersion(): string {
    // Try to get version from meta tag first
    const metaVersion = document.querySelector('meta[name="app-version"]')?.getAttribute('content');
    if (metaVersion) {
      return metaVersion;
    }

    // Fallback to build timestamp or hash from script tags
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    const mainScript = scripts.find(script => 
      script.getAttribute('src')?.includes('assets/') && 
      script.getAttribute('src')?.includes('.js')
    );

    if (mainScript) {
      const src = mainScript.getAttribute('src') || '';
      const hashMatch = src.match(/assets\/[^-]+-([a-f0-9]+)\.js/);
      if (hashMatch) {
        return hashMatch[1];
      }
    }

    // Final fallback
    return Date.now().toString();
  }

  /**
   * Check for app updates by fetching the current index.html
   */
  private async checkForUpdates(): Promise<void> {
    if (this.isChecking) return;
    
    this.isChecking = true;

    try {
      // Fetch the current index.html with cache-busting
      const response = await fetch(`/index.html?t=${Date.now()}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const html = await response.text();
      const newVersion = this.extractVersionFromHtml(html);

      if (newVersion && newVersion !== this.currentVersion) {
        console.log(`New version detected: ${newVersion} (current: ${this.currentVersion})`);
        await this.performSilentUpdate();
      }

      // Reset retry count on successful check
      this.retryCount = 0;
    } catch (error) {
      console.warn('Version check failed:', error);
      this.handleCheckError();
    } finally {
      this.isChecking = false;
    }
  }

  /**
   * Extract version information from HTML content
   */
  private extractVersionFromHtml(html: string): string | null {
    // Try to extract from meta tag
    const metaMatch = html.match(/<meta name="app-version" content="([^"]+)"/);
    if (metaMatch) {
      return metaMatch[1];
    }

    // Try to extract from script src hash
    const scriptMatch = html.match(/assets\/[^-]+-([a-f0-9]+)\.js/);
    if (scriptMatch) {
      return scriptMatch[1];
    }

    return null;
  }

  /**
   * Handle check errors with exponential backoff
   */
  private handleCheckError(): void {
    this.retryCount++;
    
    if (this.retryCount >= this.maxRetries) {
      // Increase check interval on repeated failures
      this.checkInterval = Math.min(this.checkInterval * 2, 300000); // Max 5 minutes
      this.startVersionChecking();
      this.retryCount = 0;
    }
  }

  /**
   * Perform silent update by clearing cache and reloading
   */
  private async performSilentUpdate(): Promise<void> {
    try {
      // Clear all caches
      await this.clearAllCaches();
      
      // Force reload the page to get new version
      this.forceReload();
    } catch (error) {
      console.warn('Silent update failed:', error);
      // Fallback to simple reload
      this.forceReload();
    }
  }

  /**
   * Clear all browser caches
   */
  private async clearAllCaches(): Promise<void> {
    try {
      // Clear Service Worker caches if available
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }

      // Clear localStorage and sessionStorage
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        // Storage might be disabled
      }

      // Unregister service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(
          registrations.map(registration => registration.unregister())
        );
      }
    } catch (error) {
      console.warn('Cache clearing failed:', error);
    }
  }

  /**
   * Force reload the page with cache busting
   */
  private forceReload(): void {
    // Add timestamp to force cache bypass
    const url = new URL(window.location.href);
    url.searchParams.set('_t', Date.now().toString());
    
    // Use location.replace to avoid back button issues
    window.location.replace(url.toString());
  }

  /**
   * Stop the update service
   */
  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Manually trigger update check
   */
  public async checkNow(): Promise<void> {
    await this.checkForUpdates();
  }

  /**
   * Set custom check interval
   */
  public setCheckInterval(interval: number): void {
    this.checkInterval = Math.max(interval, 10000); // Minimum 10 seconds
    this.startVersionChecking();
  }
}

// Export singleton instance
export const silentUpdateService = new SilentUpdateService();

// Auto-initialize in production
if (import.meta.env.PROD) {
  // Small delay to ensure app is fully loaded
  setTimeout(() => {
    silentUpdateService.init();
  }, 2000);
}