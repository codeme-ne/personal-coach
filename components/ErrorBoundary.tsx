import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import logger from '../utils/debugLogger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }
  
  static getDerivedStateFromError(error: Error): Partial<State> {
    logger.error('Error boundary triggered', error);
    
    return {
      hasError: true,
      error,
    };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { onError } = this.props;
    const { errorCount } = this.state;
    
    // Log error details
    logger.error('Component error caught', {
      error: error.toString(),
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorCount: errorCount + 1,
    });
    
    // Update state with error details
    this.setState({
      errorInfo,
      errorCount: errorCount + 1,
    });
    
    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo);
    }
    
    // In production, you might want to send this to an error reporting service
    if (!__DEV__) {
      this.reportErrorToService(error, errorInfo);
    }
  }
  
  reportErrorToService(error: Error, errorInfo: ErrorInfo): void {
    // This would send error to a service like Sentry, Bugsnag, etc.
    const errorReport = {
      message: error.toString(),
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      environment: __DEV__ ? 'development' : 'production',
    };
    
    // Example: Send to error reporting service
    // errorReportingService.captureException(errorReport);
    
    logger.error('Error reported to service', errorReport);
  }
  
  handleReset = (): void => {
    logger.info('Error boundary reset');
    
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };
  
  handleReload = (): void => {
    logger.info('Reloading application');
    
    if (typeof window !== 'undefined') {
      window.location.reload();
    } else {
      // For React Native
      const { DevSettings } = require('react-native');
      if (DevSettings && DevSettings.reload) {
        DevSettings.reload();
      }
    }
  };
  
  renderErrorDetails(): ReactNode {
    const { error, errorInfo } = this.state;
    
    if (!error || !errorInfo) return null;
    
    return (
      <ScrollView style={styles.detailsContainer}>
        <Text style={styles.detailsTitle}>Error Details:</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Message:</Text>
          <Text style={styles.errorMessage}>{error.toString()}</Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Stack Trace:</Text>
          <ScrollView horizontal>
            <Text style={styles.stackTrace}>{error.stack}</Text>
          </ScrollView>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Component Stack:</Text>
          <ScrollView horizontal>
            <Text style={styles.stackTrace}>{errorInfo.componentStack}</Text>
          </ScrollView>
        </View>
      </ScrollView>
    );
  }
  
  renderDefaultFallback(): ReactNode {
    const { showDetails = __DEV__ } = this.props;
    const { errorCount } = this.state;
    
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.emoji}>😕</Text>
          <Text style={styles.title}>Etwas ist schiefgelaufen</Text>
          <Text style={styles.message}>
            Ein unerwarteter Fehler ist aufgetreten.{'\n'}
            Bitte versuchen Sie es erneut.
          </Text>
          
          {errorCount > 1 && (
            <Text style={styles.errorCount}>
              Fehler #{errorCount}
            </Text>
          )}
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.primaryButton]} 
              onPress={this.handleReset}
            >
              <Text style={styles.buttonText}>Erneut versuchen</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.secondaryButton]} 
              onPress={this.handleReload}
            >
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                App neu laden
              </Text>
            </TouchableOpacity>
          </View>
          
          {showDetails && this.renderErrorDetails()}
        </View>
      </View>
    );
  }
  
  render(): ReactNode {
    const { hasError } = this.state;
    const { children, fallback } = this.props;
    
    if (hasError) {
      return fallback || this.renderDefaultFallback();
    }
    
    return children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  content: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    maxWidth: 400,
    width: '100%',
  },
  emoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  errorCount: {
    fontSize: 12,
    color: '#999',
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'column',
    gap: 12,
    width: '100%',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 150,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#007AFF',
  },
  detailsContainer: {
    marginTop: 24,
    maxHeight: 300,
    width: '100%',
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  errorMessage: {
    fontSize: 12,
    color: '#d32f2f',
    fontFamily: 'monospace',
  },
  stackTrace: {
    fontSize: 10,
    color: '#666',
    fontFamily: 'monospace',
    lineHeight: 14,
  },
});

// HOC for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Hook for error handling (to be used with ErrorBoundary)
export function useErrorHandler() {
  return (error: Error, errorInfo?: ErrorInfo) => {
    logger.error('Error handled by hook', { error, errorInfo });
    
    // You can add custom error handling logic here
    // For example, showing a toast notification
    
    if (!__DEV__) {
      // Report to error service in production
      // errorReportingService.captureException(error);
    }
  };
}

export default ErrorBoundary;