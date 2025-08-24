# Debug and Trace Setup Guide

## Overview

This project has been configured with comprehensive debugging and tracing capabilities for the Personal Coach React Native application. The setup includes VS Code integration, structured logging, performance monitoring, Firebase debugging, and error boundaries.

## Quick Start

### 1. Debug Commands

```bash
# Start with debug logging enabled
npm run debug              # Web with trace logging
npm run debug:ios          # iOS with trace logging
npm run debug:android      # Android with trace logging

# Advanced debugging
npm run debug:inspect      # Start with Node inspector
npm run debug:chrome       # Web with HTTPS for Chrome DevTools
npm run debug:clear        # Clear cache and start fresh
npm run debug:test         # Debug Jest tests
npm run debug:profile      # CPU and heap profiling

# Code quality
npm run typecheck          # TypeScript type checking
npm run lint              # ESLint checking
```

### 2. VS Code Debugging

Press `F5` or use the debug panel to select from:
- **Debug Expo Web** - Debug in Chrome
- **Debug React Native (Android)** - Debug on Android
- **Debug React Native (iOS)** - Debug on iOS
- **Debug Jest Tests** - Debug all tests
- **Debug Current Test File** - Debug active test file
- **Attach to Metro** - Attach to running Metro bundler

### 3. Debug Dashboard

In development mode, a floating debug button (🐛) appears in the bottom-right corner. Click it to open the debug dashboard with:
- **Logs** - View and export application logs
- **Performance** - Monitor frame rates and component performance
- **Firebase** - Track Firestore operations and errors
- **Network** - Monitor API requests and responses

## Core Debug Utilities

### 1. Debug Logger (`utils/debugLogger.ts`)

```typescript
import { logger, createDebugContext } from './utils/debugLogger';

// Basic logging
logger.error('Error occurred', error);
logger.warn('Warning message', data);
logger.info('Info message', data);
logger.debug('Debug message', data);
logger.trace('Trace message', data);

// Component-specific logging
const debug = createDebugContext('MyComponent');
debug.log('render', props);
debug.error('Failed to load', error);
debug.measure('expensive-operation', () => {
  // Code to measure
});

// Performance measurement
logger.measurePerformance('operation-name', () => {
  // Code to measure
});
```

### 2. React Native Debug Tools (`utils/reactNativeDebug.ts`)

```typescript
import { rnDebugger, withDebug, setupNetworkDebugging } from './utils/reactNativeDebug';

// Wrap components for automatic debugging
export default withDebug(MyComponent, 'MyComponent');

// Setup network debugging
setupNetworkDebugging();
```

### 3. Firebase Debugging (`utils/firebaseDebug.ts`)

```typescript
import { firebaseDebugger, debugFirestore, withFirebaseDebug } from './utils/firebaseDebug';

// Debug Firestore collections
await debugFirestore.collection('habits');
await debugFirestore.document('habits', 'documentId');

// Wrap Firebase operations
await withFirebaseDebug('fetch-habits', async () => {
  return await getHabits();
});

// Get Firebase stats
const stats = debugFirestore.stats();
console.log(stats);

// Export debug data
const debugData = debugFirestore.export();
```

### 4. Performance Monitoring (`utils/performanceMonitor.ts`)

```typescript
import { usePerformanceMonitor, performanceMonitor } from './utils/performanceMonitor';

// In React components
function MyComponent() {
  const { trackUpdate, recordMetric } = usePerformanceMonitor('MyComponent');
  
  const handleClick = trackUpdate('click-handler');
  
  useEffect(() => {
    recordMetric('data-load', loadTime, 'ms');
  }, []);
}

// Get performance report
const report = performanceMonitor.getPerformanceReport();
```

### 5. Error Boundaries (`components/ErrorBoundary.tsx`)

```typescript
import { ErrorBoundary, withErrorBoundary } from './components/ErrorBoundary';

// Wrap components
<ErrorBoundary onError={handleError}>
  <MyComponent />
</ErrorBoundary>

// Or use HOC
export default withErrorBoundary(MyComponent, {
  onError: (error, errorInfo) => {
    console.error('Component error:', error);
  }
});
```

## Environment Variables

Set these in your `.env` file or environment:

```bash
# Debug level (error, warn, info, debug, trace)
EXPO_PUBLIC_DEBUG_LEVEL=debug

# Enable specific features
ENABLE_REMOTE_DEBUG=true
ENABLE_TRACING=true
ENABLE_PROFILING=true
ENABLE_MEMORY_MONITORING=true
```

## Debug Menu (React Native)

On device/simulator, shake or press `Cmd+D` (iOS) / `Cmd+M` (Android) to access:
- 🔍 Show Debug Info
- 📊 Show Performance Metrics
- 🗄️ Export Debug Logs
- 🧹 Clear All Data
- 🔄 Reload with Cache Clear
- 📱 Show Device Info
- 🎯 Toggle Element Inspector
- 🎨 Toggle Design Mode

## Browser DevTools (Web)

When running on web, access debug utilities via browser console:

```javascript
// Access debug utilities
DEBUG.logger           // Logger instance
DEBUG.logs()          // Get all logs
DEBUG.clearLogs()     // Clear logs
DEBUG.setLevel('trace') // Set log level
DEBUG.performance()   // Performance metrics
DEBUG.network()       // Network requests
DEBUG.measure('test', () => { /* code */ }) // Measure performance

// Firebase debugging
FIREBASE_DEBUG.operations()    // View operations
FIREBASE_DEBUG.stats()         // Get statistics
FIREBASE_DEBUG.clearOperations() // Clear history
FIREBASE_DEBUG.exportData()    // Export debug data
```

## Common Debugging Scenarios

### 1. Debugging Slow Renders

```typescript
// Enable performance monitoring
const debug = createDebugContext('SlowComponent');

function SlowComponent() {
  const renderStart = performance.now();
  
  useEffect(() => {
    const renderTime = performance.now() - renderStart;
    debug.log('render-time', { duration: renderTime });
    
    if (renderTime > 16) {
      debug.warn('Slow render detected', { renderTime });
    }
  });
}
```

### 2. Debugging Firebase Operations

```typescript
// Wrap service methods with debugging
class HabitService {
  @FirebaseDebug('fetch-habits')
  async getHabits() {
    // Automatically logged
    return await fetchHabits();
  }
}
```

### 3. Debugging State Changes

```typescript
logger.logState('habitList', previousState, newState);
```

### 4. Memory Leak Detection

The system automatically monitors memory usage and warns when potential leaks are detected. Check the Performance tab in the Debug Dashboard.

### 5. Network Request Debugging

All network requests are automatically logged. View them in:
- Debug Dashboard > Network tab
- Browser DevTools > Network panel
- Console: `DEBUG.network()`

## Production Debugging

In production builds, debugging is disabled by default. To enable safe production debugging:

1. Set environment variable: `PRODUCTION_DEBUG=true`
2. Provide debug token in headers: `X-Debug-Token: your-token`
3. Access debug endpoints (if configured):
   - `/debug/heap` - Heap snapshot
   - `/debug/profile` - CPU profile
   - `/debug/metrics` - System metrics

## Troubleshooting

### Issue: Debug Dashboard not appearing
- Ensure you're in development mode (`__DEV__` is true)
- Check if the floating button is hidden behind other elements
- Try refreshing the page/app

### Issue: Logs not appearing
- Check log level: `logger.setLevel('trace')`
- Ensure debug logging is enabled
- Verify `__DEV__` environment

### Issue: Performance metrics missing
- Performance monitoring may not be available on all platforms
- Check browser compatibility for Performance Observer API
- Ensure performance monitoring is enabled in config

### Issue: Firebase operations not logged
- Verify Firebase debugging is initialized
- Check if operations are wrapped with debug utilities
- Ensure Firebase is properly configured

## Best Practices

1. **Use appropriate log levels**
   - `error`: Critical errors requiring immediate attention
   - `warn`: Warning conditions that might cause issues
   - `info`: Important informational messages
   - `debug`: Detailed debugging information
   - `trace`: Very detailed trace information

2. **Component debugging**
   - Wrap components with `withDebug` HOC in development
   - Use `createDebugContext` for component-specific logging
   - Track render performance with `usePerformanceMonitor`

3. **Performance monitoring**
   - Monitor frame rates to ensure 60 FPS
   - Track component render times
   - Identify and fix slow renders (>16ms)

4. **Error handling**
   - Always wrap root components with ErrorBoundary
   - Provide meaningful error messages
   - Log errors with full context

5. **Production safety**
   - Ensure debug code is tree-shaken in production
   - Use `__DEV__` checks for debug-only code
   - Never log sensitive information

## Advanced Features

### Custom Debug Metrics

```typescript
performanceMonitor.recordMetric('custom-metric', value, 'unit');
```

### Conditional Breakpoints

```typescript
logger.assert(condition, 'Assertion message', data);
```

### Debug Groups

```typescript
logger.group('Operation Name');
logger.debug('Step 1');
logger.debug('Step 2');
logger.groupEnd();
```

### Table Logging

```typescript
logger.table(arrayOfObjects, ['column1', 'column2']);
```

## Integration with External Tools

### Reactotron (React Native)
- Automatically configured in development
- Connect via Reactotron app on port 9090

### Flipper (React Native)
- Automatically configured for React Native
- Connect via Flipper desktop app

### Chrome DevTools
- Use `npm run debug:chrome` for HTTPS debugging
- Access React DevTools and Redux DevTools

## Resources

- [React Native Debugging Guide](https://reactnative.dev/docs/debugging)
- [Chrome DevTools](https://developers.google.com/web/tools/chrome-devtools)
- [VS Code Debugging](https://code.visualstudio.com/docs/editor/debugging)
- [Firebase Performance Monitoring](https://firebase.google.com/docs/perf-mon)