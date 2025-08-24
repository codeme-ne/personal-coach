import { useEffect, useRef, useCallback } from 'react';
import logger from './debugLogger';

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
}

interface ComponentMetrics {
  renderCount: number;
  renderTime: number[];
  mountTime?: number;
  unmountTime?: number;
  updateTime: number[];
  averageRenderTime?: number;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private componentMetrics: Map<string, ComponentMetrics> = new Map();
  private frameRates: number[] = [];
  private lastFrameTime: number = 0;
  private animationFrameId?: number;
  
  private constructor() {
    if (__DEV__ && typeof window !== 'undefined') {
      this.startFrameRateMonitoring();
      this.setupPerformanceObserver();
    }
  }
  
  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }
  
  // Frame rate monitoring
  private startFrameRateMonitoring(): void {
    if (typeof requestAnimationFrame === 'undefined') return;
    
    const measureFrameRate = (timestamp: number) => {
      if (this.lastFrameTime) {
        const delta = timestamp - this.lastFrameTime;
        const fps = 1000 / delta;
        
        this.frameRates.push(fps);
        
        // Keep only last 60 frames
        if (this.frameRates.length > 60) {
          this.frameRates.shift();
        }
        
        // Log if FPS drops below 30
        if (fps < 30) {
          logger.warn(`Low frame rate detected: ${fps.toFixed(1)} FPS`);
        }
      }
      
      this.lastFrameTime = timestamp;
      this.animationFrameId = requestAnimationFrame(measureFrameRate);
    };
    
    this.animationFrameId = requestAnimationFrame(measureFrameRate);
  }
  
  stopFrameRateMonitoring(): void {
    if (this.animationFrameId && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(this.animationFrameId);
    }
  }
  
  // Performance Observer for web vitals
  private setupPerformanceObserver(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }
    
    try {
      // Observe different performance entry types
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.handlePerformanceEntry(entry);
        }
      });
      
      // Observe various performance metrics
      observer.observe({ 
        entryTypes: ['measure', 'navigation', 'resource', 'paint', 'largest-contentful-paint'] 
      });
    } catch (error) {
      logger.debug('Performance Observer setup failed', error);
    }
  }
  
  private handlePerformanceEntry(entry: PerformanceEntry): void {
    switch (entry.entryType) {
      case 'paint':
        if (entry.name === 'first-contentful-paint') {
          this.recordMetric('FCP', entry.startTime, 'ms');
        }
        break;
        
      case 'largest-contentful-paint':
        const lcpEntry = entry as any;
        this.recordMetric('LCP', lcpEntry.renderTime || lcpEntry.loadTime, 'ms');
        break;
        
      case 'measure':
        this.recordMetric(entry.name, entry.duration, 'ms');
        break;
        
      case 'navigation':
        const navEntry = entry as PerformanceNavigationTiming;
        this.recordMetric('Page Load', navEntry.loadEventEnd - navEntry.fetchStart, 'ms');
        this.recordMetric('DOM Content Loaded', navEntry.domContentLoadedEventEnd - navEntry.fetchStart, 'ms');
        break;
    }
  }
  
  // Record custom metrics
  recordMetric(name: string, value: number, unit: string = 'ms'): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
    };
    
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const metrics = this.metrics.get(name)!;
    metrics.push(metric);
    
    // Keep only last 100 metrics per name
    if (metrics.length > 100) {
      metrics.shift();
    }
    
    logger.debug(`Performance metric: ${name}`, { value, unit });
  }
  
  // Component performance tracking
  trackComponentRender(componentName: string, renderTime: number): void {
    if (!this.componentMetrics.has(componentName)) {
      this.componentMetrics.set(componentName, {
        renderCount: 0,
        renderTime: [],
        updateTime: [],
      });
    }
    
    const metrics = this.componentMetrics.get(componentName)!;
    metrics.renderCount++;
    metrics.renderTime.push(renderTime);
    
    // Keep only last 50 render times
    if (metrics.renderTime.length > 50) {
      metrics.renderTime.shift();
    }
    
    // Calculate average
    metrics.averageRenderTime = 
      metrics.renderTime.reduce((a, b) => a + b, 0) / metrics.renderTime.length;
    
    // Warn if render time is too high
    if (renderTime > 16) { // More than one frame at 60fps
      logger.warn(`Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
    }
  }
  
  trackComponentMount(componentName: string, mountTime: number): void {
    if (!this.componentMetrics.has(componentName)) {
      this.componentMetrics.set(componentName, {
        renderCount: 0,
        renderTime: [],
        updateTime: [],
      });
    }
    
    const metrics = this.componentMetrics.get(componentName)!;
    metrics.mountTime = mountTime;
    
    logger.debug(`Component mounted: ${componentName}`, { mountTime: `${mountTime}ms` });
  }
  
  trackComponentUnmount(componentName: string): void {
    const metrics = this.componentMetrics.get(componentName);
    if (metrics) {
      metrics.unmountTime = Date.now();
      logger.debug(`Component unmounted: ${componentName}`);
    }
  }
  
  trackComponentUpdate(componentName: string, updateTime: number): void {
    const metrics = this.componentMetrics.get(componentName);
    if (metrics) {
      metrics.updateTime.push(updateTime);
      
      // Keep only last 50 update times
      if (metrics.updateTime.length > 50) {
        metrics.updateTime.shift();
      }
    }
  }
  
  // Get performance reports
  getFrameRate(): number {
    if (this.frameRates.length === 0) return 60;
    
    const sum = this.frameRates.reduce((a, b) => a + b, 0);
    return sum / this.frameRates.length;
  }
  
  getMetrics(name?: string): PerformanceMetric[] | Map<string, PerformanceMetric[]> {
    if (name) {
      return this.metrics.get(name) || [];
    }
    return new Map(this.metrics);
  }
  
  getComponentMetrics(componentName?: string): ComponentMetrics | Map<string, ComponentMetrics> {
    if (componentName) {
      return this.componentMetrics.get(componentName) || {
        renderCount: 0,
        renderTime: [],
        updateTime: [],
      };
    }
    return new Map(this.componentMetrics);
  }
  
  getPerformanceReport() {
    const report = {
      frameRate: {
        current: this.getFrameRate(),
        min: Math.min(...this.frameRates),
        max: Math.max(...this.frameRates),
      },
      metrics: Object.fromEntries(this.metrics),
      components: Object.fromEntries(
        Array.from(this.componentMetrics.entries()).map(([name, metrics]) => [
          name,
          {
            ...metrics,
            slowRenders: metrics.renderTime.filter(t => t > 16).length,
          },
        ])
      ),
      memory: this.getMemoryUsage(),
    };
    
    return report;
  }
  
  private getMemoryUsage() {
    if (typeof window !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024),
      };
    }
    return null;
  }
  
  // Clear metrics
  clearMetrics(): void {
    this.metrics.clear();
    this.componentMetrics.clear();
    this.frameRates = [];
    logger.info('Performance metrics cleared');
  }
  
  // Export metrics
  exportMetrics(): string {
    return JSON.stringify(this.getPerformanceReport(), null, 2);
  }
}

// React Hook for component performance monitoring
export const usePerformanceMonitor = (componentName: string) => {
  const monitor = PerformanceMonitor.getInstance();
  const renderStartTime = useRef<number>();
  const mountStartTime = useRef<number>();
  
  // Track mount time
  useEffect(() => {
    mountStartTime.current = performance.now();
    
    return () => {
      if (mountStartTime.current) {
        const mountTime = performance.now() - mountStartTime.current;
        monitor.trackComponentMount(componentName, mountTime);
      }
      
      monitor.trackComponentUnmount(componentName);
    };
  }, []);
  
  // Track render time
  useEffect(() => {
    if (renderStartTime.current) {
      const renderTime = performance.now() - renderStartTime.current;
      monitor.trackComponentRender(componentName, renderTime);
    }
    renderStartTime.current = performance.now();
  });
  
  // Track update time
  const trackUpdate = useCallback((updateName: string) => {
    const startTime = performance.now();
    
    return () => {
      const updateTime = performance.now() - startTime;
      monitor.trackComponentUpdate(`${componentName}.${updateName}`, updateTime);
    };
  }, [componentName]);
  
  return {
    trackUpdate,
    recordMetric: (name: string, value: number, unit?: string) => 
      monitor.recordMetric(`${componentName}.${name}`, value, unit),
  };
};

// Performance measurement decorator
export function MeasurePerformance(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;
  const monitor = PerformanceMonitor.getInstance();
  
  descriptor.value = function (...args: any[]) {
    const startTime = performance.now();
    const result = originalMethod.apply(this, args);
    
    if (result instanceof Promise) {
      return result.finally(() => {
        const duration = performance.now() - startTime;
        monitor.recordMetric(`${target.constructor.name}.${propertyKey}`, duration);
      });
    }
    
    const duration = performance.now() - startTime;
    monitor.recordMetric(`${target.constructor.name}.${propertyKey}`, duration);
    
    return result;
  };
  
  return descriptor;
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

export default performanceMonitor;