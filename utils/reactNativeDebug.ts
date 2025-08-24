import { DevSettings, Platform, NativeModules } from 'react-native';
import logger from './debugLogger';

interface DebugMenuOption {
  title: string;
  handler: () => void;
}

class ReactNativeDebugger {
  private static instance: ReactNativeDebugger;
  private debugMenuOptions: DebugMenuOption[] = [];
  
  private constructor() {
    this.setupDebugMenu();
    this.setupReactotron();
    this.setupFlipperIntegration();
  }
  
  static getInstance(): ReactNativeDebugger {
    if (!ReactNativeDebugger.instance) {
      ReactNativeDebugger.instance = new ReactNativeDebugger();
    }
    return ReactNativeDebugger.instance;
  }
  
  private setupDebugMenu(): void {
    if (!__DEV__) return;
    
    // Add custom debug menu items
    this.addDebugMenuItem('🔍 Show Debug Info', () => {
      this.showDebugInfo();
    });
    
    this.addDebugMenuItem('📊 Show Performance Metrics', () => {
      this.showPerformanceMetrics();
    });
    
    this.addDebugMenuItem('🗄️ Export Debug Logs', () => {
      this.exportDebugLogs();
    });
    
    this.addDebugMenuItem('🧹 Clear All Data', () => {
      this.clearAllData();
    });
    
    this.addDebugMenuItem('🔄 Reload with Cache Clear', () => {
      this.reloadWithCacheClear();
    });
    
    this.addDebugMenuItem('📱 Show Device Info', () => {
      this.showDeviceInfo();
    });
    
    this.addDebugMenuItem('🎯 Toggle Element Inspector', () => {
      this.toggleElementInspector();
    });
    
    this.addDebugMenuItem('🎨 Toggle Design Mode', () => {
      this.toggleDesignMode();
    });
    
    // Apply all menu items to DevSettings
    this.debugMenuOptions.forEach(option => {
      if (DevSettings && DevSettings.addMenuItem) {
        DevSettings.addMenuItem(option.title, option.handler);
      }
    });
  }
  
  private addDebugMenuItem(title: string, handler: () => void): void {
    this.debugMenuOptions.push({ title, handler });
  }
  
  private setupReactotron(): void {
    if (!__DEV__) return;
    
    // Reactotron configuration
    if (Platform.OS === 'web') {
      // Web doesn't support Reactotron
      return;
    }
    
    try {
      // Dynamic import to avoid issues in production
      const Reactotron = require('reactotron-react-native').default;
      const { reactotronRedux } = require('reactotron-redux');
      const { networking } = require('reactotron-react-native-networking');
      
      const tron = Reactotron
        .configure({
          name: 'Personal Coach',
          host: 'localhost',
          port: 9090,
        })
        .useReactNative({
          networking: {
            ignoreUrls: /symbolicate|127.0.0.1/,
          },
          errors: { veto: () => false },
          overlay: false,
        })
        .use(reactotronRedux())
        .use(networking())
        .connect();
      
      // Attach to console
      console.tron = tron;
      
      // Clear on reload
      tron.clear();
      
      logger.info('Reactotron connected');
    } catch (error) {
      logger.debug('Reactotron setup skipped', error);
    }
  }
  
  private setupFlipperIntegration(): void {
    if (!__DEV__ || Platform.OS === 'web') return;
    
    try {
      // Flipper plugins
      require('react-native-flipper');
      logger.info('Flipper integration enabled');
    } catch (error) {
      logger.debug('Flipper setup skipped', error);
    }
  }
  
  private showDebugInfo(): void {
    const info = {
      environment: __DEV__ ? 'Development' : 'Production',
      platform: Platform.OS,
      version: Platform.Version,
      isTV: Platform.isTV,
      constants: Platform.constants,
      logs: logger.getLogs().length,
      performanceMarks: logger.getPerformanceMetrics().size,
      networkRequests: logger.getNetworkRequests().size,
    };
    
    logger.info('Debug Info', info);
    
    if (Platform.OS !== 'web') {
      const { Alert } = require('react-native');
      Alert.alert(
        'Debug Info',
        JSON.stringify(info, null, 2),
        [{ text: 'OK' }]
      );
    } else {
      console.table(info);
    }
  }
  
  private showPerformanceMetrics(): void {
    const metrics = {
      jsFrameRate: this.getJSFrameRate(),
      uiFrameRate: this.getUIFrameRate(),
      memoryUsage: this.getMemoryUsage(),
      bundleSize: this.getBundleSize(),
    };
    
    logger.info('Performance Metrics', metrics);
    
    if (Platform.OS !== 'web') {
      const { Alert } = require('react-native');
      Alert.alert(
        'Performance Metrics',
        JSON.stringify(metrics, null, 2),
        [{ text: 'OK' }]
      );
    } else {
      console.table(metrics);
    }
  }
  
  private exportDebugLogs(): void {
    const logs = logger.exportLogs();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `debug-logs-${timestamp}.json`;
    
    if (Platform.OS === 'web') {
      // Create and download file for web
      const blob = new Blob([logs], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      
      logger.info(`Logs exported to ${filename}`);
    } else {
      // For native platforms, show in console or use Share API
      const { Share } = require('react-native');
      Share.share({
        message: logs,
        title: filename,
      });
    }
  }
  
  private async clearAllData(): Promise<void> {
    logger.warn('Clearing all application data...');
    
    try {
      // Clear AsyncStorage
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.clear();
      
      // Clear logs
      logger.clearLogs();
      
      // Clear caches if available
      if (Platform.OS !== 'web') {
        const { NativeModules } = require('react-native');
        if (NativeModules.RNCAsyncStorage) {
          await NativeModules.RNCAsyncStorage.clear();
        }
      }
      
      logger.info('All data cleared successfully');
      
      // Reload app
      if (DevSettings && DevSettings.reload) {
        DevSettings.reload();
      }
    } catch (error) {
      logger.error('Failed to clear data', error);
    }
  }
  
  private reloadWithCacheClear(): void {
    logger.info('Reloading with cache clear...');
    
    if (Platform.OS === 'web') {
      // Clear web caches
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => caches.delete(name));
        });
      }
      
      // Clear local storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Hard reload
      window.location.reload(true);
    } else {
      // Native reload
      if (DevSettings && DevSettings.reload) {
        DevSettings.reload();
      }
    }
  }
  
  private showDeviceInfo(): void {
    const deviceInfo = {
      platform: Platform.OS,
      version: Platform.Version,
      isTV: Platform.isTV,
      isTablet: Platform.isPad,
      constants: Platform.constants,
    };
    
    if (Platform.OS !== 'web') {
      // Get additional native device info
      try {
        const DeviceInfo = require('react-native-device-info').default;
        Object.assign(deviceInfo, {
          brand: DeviceInfo.getBrand(),
          model: DeviceInfo.getModel(),
          systemName: DeviceInfo.getSystemName(),
          systemVersion: DeviceInfo.getSystemVersion(),
          appVersion: DeviceInfo.getVersion(),
          buildNumber: DeviceInfo.getBuildNumber(),
          bundleId: DeviceInfo.getBundleId(),
          deviceId: DeviceInfo.getDeviceId(),
          uniqueId: DeviceInfo.getUniqueId(),
        });
      } catch (error) {
        logger.debug('Device info not available', error);
      }
    }
    
    logger.info('Device Info', deviceInfo);
    
    if (Platform.OS !== 'web') {
      const { Alert } = require('react-native');
      Alert.alert(
        'Device Info',
        JSON.stringify(deviceInfo, null, 2),
        [{ text: 'OK' }]
      );
    } else {
      console.table(deviceInfo);
    }
  }
  
  private toggleElementInspector(): void {
    if (Platform.OS === 'web') {
      logger.info('Element inspector not available on web');
      return;
    }
    
    try {
      const Inspector = require('react-native/Libraries/Inspector/Inspector');
      const isInspecting = Inspector.isInspecting();
      Inspector.setInspecting(!isInspecting);
      logger.info(`Element inspector ${!isInspecting ? 'enabled' : 'disabled'}`);
    } catch (error) {
      logger.error('Failed to toggle element inspector', error);
    }
  }
  
  private toggleDesignMode(): void {
    // This would toggle a design mode showing borders, padding, etc.
    logger.info('Design mode toggled');
    // Implementation would require a global state change
  }
  
  // Performance measurement helpers
  private getJSFrameRate(): number {
    // This would require integration with performance monitoring
    return 60; // Placeholder
  }
  
  private getUIFrameRate(): number {
    // This would require integration with performance monitoring
    return 60; // Placeholder
  }
  
  private getMemoryUsage(): string {
    if (Platform.OS === 'web' && 'memory' in performance) {
      const memory = (performance as any).memory;
      const used = Math.round(memory.usedJSHeapSize / 1024 / 1024);
      const total = Math.round(memory.totalJSHeapSize / 1024 / 1024);
      return `${used}MB / ${total}MB`;
    }
    return 'N/A';
  }
  
  private getBundleSize(): string {
    // This would require build-time analysis
    return 'N/A';
  }
  
  // Network debugging
  setupNetworkInspector(): void {
    if (!__DEV__) return;
    
    // Intercept fetch
    const originalFetch = global.fetch;
    global.fetch = async (input: RequestInfo, init?: RequestInit) => {
      const requestId = Math.random().toString(36).substring(7);
      const url = typeof input === 'string' ? input : input.url;
      
      logger.logNetworkRequest(requestId, {
        url,
        method: init?.method || 'GET',
        headers: init?.headers,
        body: init?.body,
      });
      
      try {
        const response = await originalFetch(input, init);
        
        logger.logNetworkResponse(requestId, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        });
        
        return response;
      } catch (error) {
        logger.error('Network request failed', { url, error });
        throw error;
      }
    };
    
    // Intercept XMLHttpRequest
    const XHR = XMLHttpRequest;
    const originalOpen = XHR.prototype.open;
    const originalSend = XHR.prototype.send;
    
    XHR.prototype.open = function(method: string, url: string) {
      this._requestId = Math.random().toString(36).substring(7);
      this._method = method;
      this._url = url;
      originalOpen.apply(this, arguments as any);
    };
    
    XHR.prototype.send = function(body?: any) {
      const requestId = this._requestId;
      
      logger.logNetworkRequest(requestId, {
        url: this._url,
        method: this._method,
        body,
      });
      
      this.addEventListener('load', () => {
        logger.logNetworkResponse(requestId, {
          status: this.status,
          statusText: this.statusText,
          response: this.response,
        });
      });
      
      this.addEventListener('error', () => {
        logger.error('XHR request failed', {
          url: this._url,
          method: this._method,
        });
      });
      
      originalSend.apply(this, arguments as any);
    };
  }
  
  // Component debugging helpers
  wrapComponent<P>(Component: React.ComponentType<P>, componentName: string) {
    if (!__DEV__) return Component;
    
    return (props: P) => {
      logger.logComponent(componentName, 'render', props);
      
      React.useEffect(() => {
        logger.logComponent(componentName, 'mount');
        return () => {
          logger.logComponent(componentName, 'unmount');
        };
      }, []);
      
      React.useEffect(() => {
        logger.logComponent(componentName, 'update', props);
      });
      
      return React.createElement(Component, props);
    };
  }
}

// Export singleton instance
export const rnDebugger = ReactNativeDebugger.getInstance();

// Export helper to wrap components with debugging
export const withDebug = <P,>(Component: React.ComponentType<P>, name?: string) => {
  const componentName = name || Component.displayName || Component.name || 'Unknown';
  return rnDebugger.wrapComponent(Component, componentName);
};

// Export network inspector setup
export const setupNetworkDebugging = () => {
  rnDebugger.setupNetworkInspector();
};

export default rnDebugger;