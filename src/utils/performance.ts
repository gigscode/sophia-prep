/**
 * Performance Monitoring Utilities
 * 
 * Provides utilities for monitoring and optimizing application performance.
 * Tracks Core Web Vitals and provides performance metrics.
 * 
 * Requirements: 13.1 - Home screen loads within 2 seconds
 */

export interface PerformanceMetrics {
  fcp?: number; // First Contentful Paint
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  ttfb?: number; // Time to First Byte
  tti?: number; // Time to Interactive
}

/**
 * Measure First Contentful Paint (FCP)
 * Target: < 1.5s
 */
export function measureFCP(): Promise<number | undefined> {
  return new Promise((resolve) => {
    if (!('PerformanceObserver' in window)) {
      resolve(undefined);
      return;
    }

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const fcpEntry = entries.find((entry) => entry.name === 'first-contentful-paint');
        if (fcpEntry) {
          resolve(fcpEntry.startTime);
          observer.disconnect();
        }
      });

      observer.observe({ entryTypes: ['paint'] });

      // Timeout after 10 seconds
      setTimeout(() => {
        observer.disconnect();
        resolve(undefined);
      }, 10000);
    } catch (error) {
      console.error('Error measuring FCP:', error);
      resolve(undefined);
    }
  });
}

/**
 * Measure Largest Contentful Paint (LCP)
 * Target: < 2.5s
 */
export function measureLCP(): Promise<number | undefined> {
  return new Promise((resolve) => {
    if (!('PerformanceObserver' in window)) {
      resolve(undefined);
      return;
    }

    try {
      let lcpValue: number | undefined;

      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        lcpValue = lastEntry.startTime;
      });

      observer.observe({ entryTypes: ['largest-contentful-paint'] });

      // Wait for page to be fully loaded
      window.addEventListener('load', () => {
        setTimeout(() => {
          observer.disconnect();
          resolve(lcpValue);
        }, 0);
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        observer.disconnect();
        resolve(lcpValue);
      }, 10000);
    } catch (error) {
      console.error('Error measuring LCP:', error);
      resolve(undefined);
    }
  });
}

/**
 * Measure Cumulative Layout Shift (CLS)
 * Target: < 0.1
 */
export function measureCLS(): Promise<number | undefined> {
  return new Promise((resolve) => {
    if (!('PerformanceObserver' in window)) {
      resolve(undefined);
      return;
    }

    try {
      let clsValue = 0;

      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
      });

      observer.observe({ entryTypes: ['layout-shift'] });

      // Wait for page to be fully loaded
      window.addEventListener('load', () => {
        setTimeout(() => {
          observer.disconnect();
          resolve(clsValue);
        }, 0);
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        observer.disconnect();
        resolve(clsValue);
      }, 10000);
    } catch (error) {
      console.error('Error measuring CLS:', error);
      resolve(undefined);
    }
  });
}

/**
 * Measure Time to First Byte (TTFB)
 */
export function measureTTFB(): number | undefined {
  if (!('performance' in window) || !performance.timing) {
    return undefined;
  }

  const { responseStart, requestStart } = performance.timing;
  return responseStart - requestStart;
}

/**
 * Get all performance metrics
 */
export async function getPerformanceMetrics(): Promise<PerformanceMetrics> {
  const [fcp, lcp, cls] = await Promise.all([
    measureFCP(),
    measureLCP(),
    measureCLS(),
  ]);

  return {
    fcp,
    lcp,
    cls,
    ttfb: measureTTFB(),
  };
}

/**
 * Log performance metrics to console (development only)
 */
export async function logPerformanceMetrics(): Promise<void> {
  if (import.meta.env.PROD) {
    return;
  }

  const metrics = await getPerformanceMetrics();

  console.group('📊 Performance Metrics');
  
  if (metrics.fcp) {
    const fcpStatus = metrics.fcp < 1500 ? '✅' : '⚠️';
    console.log(`${fcpStatus} FCP: ${metrics.fcp.toFixed(2)}ms (target: <1500ms)`);
  }
  
  if (metrics.lcp) {
    const lcpStatus = metrics.lcp < 2500 ? '✅' : '⚠️';
    console.log(`${lcpStatus} LCP: ${metrics.lcp.toFixed(2)}ms (target: <2500ms)`);
  }
  
  if (metrics.cls !== undefined) {
    const clsStatus = metrics.cls < 0.1 ? '✅' : '⚠️';
    console.log(`${clsStatus} CLS: ${metrics.cls.toFixed(3)} (target: <0.1)`);
  }
  
  if (metrics.ttfb) {
    console.log(`⏱️ TTFB: ${metrics.ttfb.toFixed(2)}ms`);
  }
  
  console.groupEnd();
}

/**
 * Check if performance budget is met
 * Requirements: 13.1 - Home screen loads within 2 seconds
 */
export async function checkPerformanceBudget(): Promise<boolean> {
  const metrics = await getPerformanceMetrics();
  
  // Check if LCP is within 2 seconds (2000ms)
  if (metrics.lcp && metrics.lcp > 2000) {
    console.warn(`⚠️ Performance budget exceeded: LCP ${metrics.lcp.toFixed(2)}ms > 2000ms`);
    return false;
  }
  
  return true;
}

/**
 * Preload critical resources
 */
export function preloadCriticalResources(resources: string[]): void {
  resources.forEach((resource) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = resource;
    
    // Determine resource type and set 'as' attribute
    if (resource.endsWith('.css')) {
      link.setAttribute('as', 'style');
    } else if (resource.endsWith('.js')) {
      link.setAttribute('as', 'script');
    } else if (resource.match(/\.(woff|woff2|ttf|eot)$/)) {
      link.setAttribute('as', 'font');
      link.crossOrigin = 'anonymous';
    } else if (resource.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) {
      link.setAttribute('as', 'image');
    }
    
    document.head.appendChild(link);
  });
}

/**
 * Prefetch resources for next navigation
 */
export function prefetchResources(resources: string[]): void {
  resources.forEach((resource) => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = resource;
    document.head.appendChild(link);
  });
}

/**
 * Mark component as interactive (for TTI measurement)
 */
export function markInteractive(componentName: string): void {
  if ('performance' in window && performance.mark) {
    performance.mark(`${componentName}-interactive`);
  }
}

/**
 * Measure component render time
 */
export function measureComponentRender(componentName: string, startMark: string): void {
  if ('performance' in window && performance.measure) {
    try {
      performance.measure(
        `${componentName}-render`,
        startMark,
        `${componentName}-interactive`
      );
    } catch (error) {
      // Marks might not exist, ignore
    }
  }
}
