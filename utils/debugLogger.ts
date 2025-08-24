import { Platform } from 'react-native';

export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'trace';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
  stack?: string;
  context?: Record<string, any>;
}

interface DebugConfig {
  enabled: boolean;
  level: LogLevel;
  includeTimestamp: boolean;
  includeStack: boolean;
  persistLogs: boolean;
  maxLogs: number;
  enablePerformanceLogging: boolean;
  enableFirebaseLogging: boolean;
  enableNetworkLogging: boolean;
}

class DebugLogger {
  private static instance: DebugLogger;
  private config: DebugConfig;
  private logs: LogEntry[] = [];
  private performanceMarks: Map<string, number> = new Map();
  private networkRequests: Map<string, any> = new Map();
  private originalConsole: any = {};
  
  private readonly levels: Record<LogLevel, number> = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
    trace: 4,
  };
  
  private readonly colors = {
    error: '\x1b[31m', // Red
    warn: '\x1b[33m',  // Yellow
    info: '\x1b[36m',  // Cyan
    debug: '\x1b[32m', // Green
    trace: '\x1b[35m', // Magenta
    reset: '\x1b[0m',
  };
  
  private constructor() {
    this.config = {
      enabled: __DEV__ || process.env.NODE_ENV === 'development',
      level: (process.env.EXPO_PUBLIC_DEBUG_LEVEL as LogLevel) || 'info',
      includeTimestamp: true,
      includeStack: __DEV__,
      persistLogs: true,
      maxLogs: 1000,
      enablePerformanceLogging: true,
      enableFirebaseLogging: true,
      enableNetworkLogging: true,
    };
    
    if (__DEV__) {
      this.setupDevTools();
      this.setupGlobalErrorHandlers();
    }
  }
  
  static getInstance(): DebugLogger {
    if (!DebugLogger.instance) {
      DebugLogger.instance = new DebugLogger();
    }
    return DebugLogger.instance;
  }
  
  private setupDevTools(): void {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      // Expose debug utilities to browser console
      (window as any).DEBUG = {
        logger: this,
        logs: () => this.getLogs(),
        clearLogs: () => this.clearLogs(),
        setLevel: (level: LogLevel) => this.setLevel(level),
        performance: () => this.getPerformanceMetrics(),
        network: () => this.getNetworkRequests(),
        measure: (name: string, fn: () => any) => this.measurePerformance(name, fn),
      };
      
      // Override console methods in development
      this.overrideConsole();
    }
  }
  
  private overrideConsole(): void {
    // Store original console methods to prevent recursion
    this.originalConsole = {
      log: console.log.bind(console),
      error: console.error.bind(console),
      warn: console.warn.bind(console),
      info: console.info.bind(console)
    };
    
    console.log = (...args) => {
      this.debug('console.log', ...args);
      this.originalConsole.log(...args);
    };
    
    console.error = (...args) => {
      this.error('console.error', ...args);
      this.originalConsole.error(...args);
    };
    
    console.warn = (...args) => {
      this.warn('console.warn', ...args);
      this.originalConsole.warn(...args);
    };
    
    console.info = (...args) => {
      this.info('console.info', ...args);
      this.originalConsole.info(...args);
    };
  }
  
  private setupGlobalErrorHandlers(): void {
    // Handle unhandled promise rejections
    const originalHandler = global.onunhandledrejection;
    global.onunhandledrejection = (event: any) => {
      this.error('Unhandled Promise Rejection', {
        reason: event.reason,
        promise: event.promise,
      });
      if (originalHandler) {
        (originalHandler as any)(event);
      }
    };
    
    // Handle global errors
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.error('Global Error', {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          error: event.error,
        });
      });
    }
  }
  
  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) return false;
    return this.levels[level] <= this.levels[this.config.level];
  }
  
  private formatMessage(level: LogLevel, message: string, data?: any): string {
    const timestamp = this.config.includeTimestamp 
      ? `[${new Date().toISOString()}] ` 
      : '';
    const levelTag = `[${level.toUpperCase()}]`;
    const color = Platform.OS === 'web' ? this.colors[level] : '';
    const reset = Platform.OS === 'web' ? this.colors.reset : '';
    
    let formatted = `${color}${timestamp}${levelTag} ${message}${reset}`;
    
    if (data !== undefined) {
      if (typeof data === 'object') {
        try {
          formatted += '\n' + JSON.stringify(data, null, 2);
        } catch (e) {
          formatted += '\n[Circular or non-serializable object]';
        }
      } else {
        formatted += ' ' + String(data);
      }
    }
    
    return formatted;
  }
  
  private createLogEntry(level: LogLevel, message: string, data?: any): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
    };
    
    if (this.config.includeStack && (level === 'error' || level === 'warn')) {
      entry.stack = new Error().stack;
    }
    
    return entry;
  }
  
  private persistLog(entry: LogEntry): void {
    if (!this.config.persistLogs) return;
    
    this.logs.push(entry);
    
    // Maintain max log size
    if (this.logs.length > this.config.maxLogs) {
      this.logs.shift();
    }
  }
  
  private log(level: LogLevel, message: string, ...args: any[]): void {
    if (!this.shouldLog(level)) return;
    
    const data = args.length === 1 ? args[0] : args.length > 1 ? args : undefined;
    const entry = this.createLogEntry(level, message, data);
    
    this.persistLog(entry);
    
    // Output to console using original methods to prevent recursion
    const formatted = this.formatMessage(level, message, data);
    
    // Use original console methods or fallback if not available
    const safeConsole = this.originalConsole || console;
    
    switch (level) {
      case 'error':
        (safeConsole.error || console.error)(formatted);
        break;
      case 'warn':
        (safeConsole.warn || console.warn)(formatted);
        break;
      case 'info':
        (safeConsole.info || console.info)(formatted);
        break;
      case 'debug':
      case 'trace':
        (safeConsole.log || console.log)(formatted);
        break;
    }
  }
  
  // Public logging methods
  error(message: string, ...args: any[]): void {
    this.log('error', message, ...args);
  }
  
  warn(message: string, ...args: any[]): void {
    this.log('warn', message, ...args);
  }
  
  info(message: string, ...args: any[]): void {
    this.log('info', message, ...args);
  }
  
  debug(message: string, ...args: any[]): void {
    this.log('debug', message, ...args);
  }
  
  trace(message: string, ...args: any[]): void {
    this.log('trace', message, ...args);
  }
  
  // Performance logging
  startPerformanceMark(label: string): void {
    if (!this.config.enablePerformanceLogging) return;
    this.performanceMarks.set(label, Date.now());
    this.debug(`Performance mark started: ${label}`);
  }
  
  endPerformanceMark(label: string): number | null {
    if (!this.config.enablePerformanceLogging) return null;
    
    const startTime = this.performanceMarks.get(label);
    if (!startTime) {
      this.warn(`Performance mark not found: ${label}`);
      return null;
    }
    
    const duration = Date.now() - startTime;
    this.performanceMarks.delete(label);
    
    this.info(`Performance: ${label}`, { duration: `${duration}ms` });
    return duration;
  }
  
  measurePerformance<T>(label: string, fn: () => T): T {
    this.startPerformanceMark(label);
    try {
      const result = fn();
      if (result instanceof Promise) {
        return result.finally(() => {
          this.endPerformanceMark(label);
        }) as any;
      }
      this.endPerformanceMark(label);
      return result;
    } catch (error) {
      this.endPerformanceMark(label);
      throw error;
    }
  }
  
  // Firebase operation logging
  logFirebaseOperation(operation: string, data?: any, error?: any): void {
    if (!this.config.enableFirebaseLogging) return;
    
    if (error) {
      this.error(`Firebase ${operation} failed`, { data, error });
    } else {
      this.debug(`Firebase ${operation}`, data);
    }
  }
  
  // Network logging
  logNetworkRequest(id: string, request: any): void {
    if (!this.config.enableNetworkLogging) return;
    
    this.networkRequests.set(id, {
      request,
      startTime: Date.now(),
    });
    
    this.debug('Network request started', {
      id,
      method: request.method,
      url: request.url,
    });
  }
  
  logNetworkResponse(id: string, response: any): void {
    if (!this.config.enableNetworkLogging) return;
    
    const requestInfo = this.networkRequests.get(id);
    if (!requestInfo) return;
    
    const duration = Date.now() - requestInfo.startTime;
    
    this.debug('Network response received', {
      id,
      status: response.status,
      duration: `${duration}ms`,
      url: requestInfo.request.url,
    });
    
    this.networkRequests.delete(id);
  }
  
  // Utility methods
  setLevel(level: LogLevel): void {
    this.config.level = level;
    this.info(`Debug level set to: ${level}`);
  }
  
  enable(): void {
    this.config.enabled = true;
    this.info('Debug logging enabled');
  }
  
  disable(): void {
    this.config.enabled = false;
  }
  
  getLogs(level?: LogLevel): LogEntry[] {
    if (!level) return [...this.logs];
    return this.logs.filter(log => log.level === level);
  }
  
  clearLogs(): void {
    this.logs = [];
    this.info('Logs cleared');
  }
  
  getPerformanceMetrics(): Map<string, number> {
    return new Map(this.performanceMarks);
  }
  
  getNetworkRequests(): Map<string, any> {
    return new Map(this.networkRequests);
  }
  
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
  
  // React component logging
  logComponent(componentName: string, action: string, props?: any): void {
    this.debug(`[${componentName}] ${action}`, props);
  }
  
  // Hook logging
  logHook(hookName: string, action: string, data?: any): void {
    this.trace(`[Hook: ${hookName}] ${action}`, data);
  }
  
  // State logging
  logState(stateName: string, previousValue: any, newValue: any): void {
    this.debug(`State update: ${stateName}`, {
      previous: previousValue,
      new: newValue,
      diff: this.getStateDiff(previousValue, newValue),
    });
  }
  
  private getStateDiff(prev: any, next: any): any {
    if (typeof prev !== 'object' || typeof next !== 'object') {
      return { changed: prev !== next };
    }
    
    const diff: any = {};
    const allKeys = new Set([...Object.keys(prev), ...Object.keys(next)]);
    
    for (const key of allKeys) {
      if (prev[key] !== next[key]) {
        diff[key] = {
          prev: prev[key],
          next: next[key],
        };
      }
    }
    
    return diff;
  }
  
  // Group logging
  group(label: string): void {
    if (console.group) {
      console.group(label);
    }
    this.debug(`=== ${label} ===`);
  }
  
  groupEnd(): void {
    if (console.groupEnd) {
      console.groupEnd();
    }
  }
  
  // Table logging for structured data
  table(data: any[], columns?: string[]): void {
    if (console.table) {
      console.table(data, columns);
    } else {
      this.info('Table data', data);
    }
  }
  
  // Assert for debugging
  assert(condition: boolean, message: string, data?: any): void {
    if (!condition) {
      this.error(`Assertion failed: ${message}`, data);
      if (__DEV__) {
        throw new Error(`Assertion failed: ${message}`);
      }
    }
  }
}

// Export singleton instance
export const logger = DebugLogger.getInstance();

// Export convenient helper functions
export const logError = (message: string, ...args: any[]) => logger.error(message, ...args);
export const logWarn = (message: string, ...args: any[]) => logger.warn(message, ...args);
export const logInfo = (message: string, ...args: any[]) => logger.info(message, ...args);
export const logDebug = (message: string, ...args: any[]) => logger.debug(message, ...args);
export const logTrace = (message: string, ...args: any[]) => logger.trace(message, ...args);
export const measurePerformance = <T>(label: string, fn: () => T) => logger.measurePerformance(label, fn);

// Debug-only code execution
export const debugOnly = (fn: () => void): void => {
  if (__DEV__) {
    fn();
  }
};

// Create debug context for components
export const createDebugContext = (componentName: string) => ({
  log: (action: string, data?: any) => logger.logComponent(componentName, action, data),
  error: (message: string, error?: any) => logger.error(`[${componentName}] ${message}`, error),
  warn: (message: string, data?: any) => logger.warn(`[${componentName}] ${message}`, data),
  info: (message: string, data?: any) => logger.info(`[${componentName}] ${message}`, data),
  debug: (message: string, data?: any) => logger.debug(`[${componentName}] ${message}`, data),
  measure: <T>(label: string, fn: () => T) => logger.measurePerformance(`${componentName}.${label}`, fn),
});

export default logger;