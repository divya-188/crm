/**
 * Performance Monitoring Utilities
 * 
 * Provides utilities for monitoring and optimizing frontend performance.
 * Includes metrics tracking, performance marks, and optimization helpers.
 */

interface PerformanceMetrics {
  name: string;
  duration: number;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private marks: Map<string, number> = new Map();

  /**
   * Start a performance measurement
   */
  startMark(name: string): void {
    this.marks.set(name, performance.now());
    
    // Use Performance API if available
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(`${name}-start`);
    }
  }

  /**
   * End a performance measurement and record the duration
   */
  endMark(name: string): number | null {
    const startTime = this.marks.get(name);
    if (!startTime) {
      console.warn(`No start mark found for: ${name}`);
      return null;
    }

    const duration = performance.now() - startTime;
    this.marks.delete(name);

    // Record metric
    this.metrics.push({
      name,
      duration,
      timestamp: Date.now(),
    });

    // Use Performance API if available
    if (typeof performance !== 'undefined' && performance.mark && performance.measure) {
      performance.mark(`${name}-end`);
      try {
        performance.measure(name, `${name}-start`, `${name}-end`);
      } catch (e) {
        // Ignore errors
      }
    }

    // Log slow operations (> 100ms)
    if (duration > 100) {
      console.warn(`Slow operation detected: ${name} took ${duration.toFixed(2)}ms`);
    }

    return duration;
  }

  /**
   * Get all recorded metrics
   */
  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  /**
   * Get metrics for a specific operation
   */
  getMetricsByName(name: string): PerformanceMetrics[] {
    return this.metrics.filter((m) => m.name === name);
  }

  /**
   * Get average duration for an operation
   */
  getAverageDuration(name: string): number {
    const metrics = this.getMetricsByName(name);
    if (metrics.length === 0) return 0;

    const total = metrics.reduce((sum, m) => sum + m.duration, 0);
    return total / metrics.length;
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
    this.marks.clear();
  }

  /**
   * Log performance summary
   */
  logSummary(): void {
    const uniqueNames = [...new Set(this.metrics.map((m) => m.name))];
    
    console.group('Performance Summary');
    uniqueNames.forEach((name) => {
      const avg = this.getAverageDuration(name);
      const count = this.getMetricsByName(name).length;
      console.log(`${name}: ${avg.toFixed(2)}ms avg (${count} calls)`);
    });
    console.groupEnd();
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * HOC to measure component render time
 */
export function withPerformanceTracking<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
): React.ComponentType<P> {
  return (props: P) => {
    performanceMonitor.startMark(`render-${componentName}`);
    
    React.useEffect(() => {
      performanceMonitor.endMark(`render-${componentName}`);
    });

    return React.createElement(Component, props);
  };
}

/**
 * Hook to measure async operations
 */
export function usePerformanceTracking(operationName: string) {
  const start = React.useCallback(() => {
    performanceMonitor.startMark(operationName);
  }, [operationName]);

  const end = React.useCallback(() => {
    return performanceMonitor.endMark(operationName);
  }, [operationName]);

  return { start, end };
}

/**
 * Measure function execution time
 */
export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  performanceMonitor.startMark(name);
  try {
    const result = await fn();
    performanceMonitor.endMark(name);
    return result;
  } catch (error) {
    performanceMonitor.endMark(name);
    throw error;
  }
}

/**
 * Get Web Vitals metrics
 */
export function getWebVitals(): void {
  if (typeof window === 'undefined') return;

  // First Contentful Paint (FCP)
  const paintEntries = performance.getEntriesByType('paint');
  const fcp = paintEntries.find((entry) => entry.name === 'first-contentful-paint');
  if (fcp) {
    console.log(`FCP: ${fcp.startTime.toFixed(2)}ms`);
  }

  // Largest Contentful Paint (LCP)
  if ('PerformanceObserver' in window) {
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        console.log(`LCP: ${lastEntry.startTime.toFixed(2)}ms`);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      // Ignore errors
    }
  }

  // First Input Delay (FID)
  if ('PerformanceObserver' in window) {
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          console.log(`FID: ${entry.processingStart - entry.startTime}ms`);
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
    } catch (e) {
      // Ignore errors
    }
  }

  // Cumulative Layout Shift (CLS)
  if ('PerformanceObserver' in window) {
    try {
      let clsScore = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsScore += entry.value;
          }
        });
        console.log(`CLS: ${clsScore.toFixed(4)}`);
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      // Ignore errors
    }
  }
}

/**
 * Report bundle size information
 */
export function reportBundleSize(): void {
  if (typeof window === 'undefined') return;

  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  const jsResources = resources.filter((r) => r.name.endsWith('.js'));
  const cssResources = resources.filter((r) => r.name.endsWith('.css'));

  const totalJsSize = jsResources.reduce((sum, r) => sum + (r.transferSize || 0), 0);
  const totalCssSize = cssResources.reduce((sum, r) => sum + (r.transferSize || 0), 0);

  console.group('Bundle Size Report');
  console.log(`Total JS: ${(totalJsSize / 1024).toFixed(2)} KB`);
  console.log(`Total CSS: ${(totalCssSize / 1024).toFixed(2)} KB`);
  console.log(`Total: ${((totalJsSize + totalCssSize) / 1024).toFixed(2)} KB`);
  console.groupEnd();
}

// Import React for HOC
import React from 'react';

export default performanceMonitor;
