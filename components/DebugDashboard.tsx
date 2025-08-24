import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, Modal } from 'react-native';
import { useColorScheme } from '../hooks/useColorScheme';
import { Colors } from '../constants/Colors';
import logger from '../utils/debugLogger';
import { performanceMonitor } from '../utils/performanceMonitor';
import { firebaseDebugger } from '../utils/firebaseDebug';
import { auth } from '../config/firebase';

interface DebugMetrics {
  logs: any[];
  performance: any;
  firebase: any;
  memory: any;
  network: any;
}

export function DebugDashboard() {
  const [visible, setVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'logs' | 'performance' | 'firebase' | 'network'>('logs');
  const [metrics, setMetrics] = useState<DebugMetrics>({
    logs: [],
    performance: {},
    firebase: {},
    memory: {},
    network: {},
  });
  const [refreshCount, setRefreshCount] = useState(0);
  
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  useEffect(() => {
    if (!__DEV__) return;
    
    // Create floating debug button
    if (Platform.OS === 'web') {
      createFloatingDebugButton();
    }
    
    // Update metrics periodically
    const interval = setInterval(updateMetrics, 2000);
    return () => clearInterval(interval);
  }, []);
  
  useEffect(() => {
    if (visible) {
      updateMetrics();
    }
  }, [visible, refreshCount]);
  
  const createFloatingDebugButton = () => {
    if (typeof document === 'undefined' || typeof window === 'undefined') return;
    
    const button = document.createElement('div');
    button.id = 'debug-dashboard-button';
    button.innerHTML = '🐛';
    button.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 50px;
      height: 50px;
      background: #007AFF;
      color: white;
      border-radius: 25px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      cursor: pointer;
      z-index: 10000;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
      transition: transform 0.2s;
    `;
    
    button.onmouseover = () => {
      button.style.transform = 'scale(1.1)';
    };
    
    button.onmouseout = () => {
      button.style.transform = 'scale(1)';
    };
    
    button.onclick = () => {
      setVisible(!visible);
    };
    
    document.body.appendChild(button);
  };
  
  const updateMetrics = () => {
    setMetrics({
      logs: logger.getLogs().slice(-50),
      performance: performanceMonitor.getPerformanceReport(),
      firebase: firebaseDebugger.getStats(),
      memory: getMemoryInfo(),
      network: getNetworkInfo(),
    });
  };
  
  const getMemoryInfo = () => {
    if (Platform.OS === 'web' && 'memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: `${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB`,
        total: `${Math.round(memory.totalJSHeapSize / 1024 / 1024)}MB`,
        limit: `${Math.round(memory.jsHeapSizeLimit / 1024 / 1024)}MB`,
        percentage: Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100),
      };
    }
    return { message: 'Memory info not available' };
  };
  
  const getNetworkInfo = () => {
    const requests = logger.getNetworkRequests();
    return {
      totalRequests: requests.size,
      activeRequests: Array.from(requests.values()).filter((r: any) => !r.response).length,
      requests: Array.from(requests.entries()).slice(-10),
    };
  };
  
  const handleClearLogs = () => {
    logger.clearLogs();
    setRefreshCount(prev => prev + 1);
  };
  
  const handleExportLogs = () => {
    const data = logger.exportLogs();
    
    if (Platform.OS === 'web') {
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `debug-logs-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };
  
  const renderLogs = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.logHeader}>
        <TouchableOpacity onPress={handleClearLogs} style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Clear</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleExportLogs} style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Export</Text>
        </TouchableOpacity>
      </View>
      
      {metrics.logs.map((log, index) => {
        let logLevelStyle = {};
        if (log.level === 'error') logLevelStyle = styles.logerror;
        else if (log.level === 'warn') logLevelStyle = styles.logwarn;
        else if (log.level === 'info') logLevelStyle = styles.loginfo;
        else if (log.level === 'debug') logLevelStyle = styles.logdebug;
        else if (log.level === 'trace') logLevelStyle = styles.logtrace;
        
        return (
        <View key={index} style={[styles.logEntry, logLevelStyle]}>
          <Text style={styles.logTimestamp}>{log.timestamp}</Text>
          <Text style={styles.logLevel}>[{log.level.toUpperCase()}]</Text>
          <Text style={styles.logMessage}>{log.message}</Text>
          {log.data && (
            <Text style={styles.logData}>{JSON.stringify(log.data, null, 2)}</Text>
          )}
        </View>
        );
      })}
    </ScrollView>
  );
  
  const renderPerformance = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.metricsContainer}>
        <Text style={styles.metricsTitle}>Frame Rate</Text>
        <Text style={styles.metricsValue}>
          {metrics.performance.frameRate?.current?.toFixed(1) || 'N/A'} FPS
        </Text>
        
        <Text style={styles.metricsTitle}>Memory Usage</Text>
        <View style={styles.memoryBar}>
          <View 
            style={[
              styles.memoryUsed, 
              { width: `${metrics.memory.percentage || 0}%` }
            ]} 
          />
        </View>
        <Text style={styles.metricsSubtext}>
          {metrics.memory.used} / {metrics.memory.limit}
        </Text>
        
        <Text style={styles.metricsTitle}>Component Metrics</Text>
        {Object.entries(metrics.performance.components || {}).map(([name, data]: [string, any]) => (
          <View key={name} style={styles.componentMetric}>
            <Text style={styles.componentName}>{name}</Text>
            <Text style={styles.componentStats}>
              Renders: {data.renderCount} | Avg: {data.averageRenderTime?.toFixed(2)}ms
            </Text>
            {data.slowRenders > 0 && (
              <Text style={styles.warningText}>⚠️ {data.slowRenders} slow renders</Text>
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );
  
  const renderFirebase = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.metricsContainer}>
        <Text style={styles.metricsTitle}>Firebase Statistics</Text>
        
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Total Operations:</Text>
          <Text style={styles.statValue}>{metrics.firebase.totalOperations || 0}</Text>
        </View>
        
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Avg Duration:</Text>
          <Text style={styles.statValue}>
            {metrics.firebase.averageDuration?.toFixed(2) || 0}ms
          </Text>
        </View>
        
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Error Rate:</Text>
          <Text style={[
            styles.statValue,
            metrics.firebase.errorRate > 5 && styles.errorText
          ]}>
            {metrics.firebase.errorRate?.toFixed(1) || 0}%
          </Text>
        </View>
        
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Active Listeners:</Text>
          <Text style={styles.statValue}>{metrics.firebase.activeListeners || 0}</Text>
        </View>
        
        <Text style={styles.metricsTitle}>Current User</Text>
        <Text style={styles.metricsSubtext}>
          {auth.currentUser?.email || 'Not authenticated'}
        </Text>
        
        <Text style={styles.metricsTitle}>Operations by Type</Text>
        {Object.entries(metrics.firebase.operationsByType || {}).map(([type, count]) => (
          <View key={type} style={styles.statRow}>
            <Text style={styles.statLabel}>{type}:</Text>
            <Text style={styles.statValue}>{count as number}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
  
  const renderNetwork = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.metricsContainer}>
        <Text style={styles.metricsTitle}>Network Activity</Text>
        
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Total Requests:</Text>
          <Text style={styles.statValue}>{metrics.network.totalRequests || 0}</Text>
        </View>
        
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Active Requests:</Text>
          <Text style={styles.statValue}>{metrics.network.activeRequests || 0}</Text>
        </View>
        
        <Text style={styles.metricsTitle}>Recent Requests</Text>
        {(metrics.network.requests || []).map(([id, request]: [string, any], index: number) => (
          <View key={id} style={styles.networkRequest}>
            <Text style={styles.networkMethod}>{request.request?.method || 'GET'}</Text>
            <Text style={styles.networkUrl} numberOfLines={1}>
              {request.request?.url || 'Unknown URL'}
            </Text>
            {request.response && (
              <Text style={styles.networkStatus}>
                Status: {request.response.status}
              </Text>
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );
  
  if (!__DEV__) return null;
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={() => setVisible(false)}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Debug Dashboard</Text>
          <TouchableOpacity onPress={() => setVisible(false)} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.tabs}>
          {(['logs', 'performance', 'firebase', 'network'] as const).map(tab => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tab,
                activeTab === tab && styles.activeTab
              ]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[
                styles.tabText,
                activeTab === tab && styles.activeTabText
              ]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <View style={styles.content}>
          {activeTab === 'logs' && renderLogs()}
          {activeTab === 'performance' && renderPerformance()}
          {activeTab === 'firebase' && renderFirebase()}
          {activeTab === 'network' && renderNetwork()}
        </View>
        
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={() => setRefreshCount(prev => prev + 1)}
        >
          <Text style={styles.refreshButtonText}>🔄 Refresh</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: Platform.OS === 'web' ? 0 : 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666',
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 12,
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  logEntry: {
    marginBottom: 8,
    padding: 8,
    borderRadius: 4,
    backgroundColor: '#f5f5f5',
  },
  logerror: {
    backgroundColor: '#ffebee',
  },
  logwarn: {
    backgroundColor: '#fff3e0',
  },
  loginfo: {
    backgroundColor: '#e3f2fd',
  },
  logdebug: {
    backgroundColor: '#f5f5f5',
  },
  logtrace: {
    backgroundColor: '#fafafa',
  },
  logTimestamp: {
    fontSize: 10,
    color: '#666',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  logLevel: {
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 2,
  },
  logMessage: {
    fontSize: 12,
    marginTop: 4,
  },
  logData: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  metricsContainer: {
    padding: 16,
  },
  metricsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  metricsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  metricsSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  memoryBar: {
    height: 20,
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 8,
  },
  memoryUsed: {
    height: '100%',
    backgroundColor: '#4caf50',
  },
  componentMetric: {
    marginBottom: 12,
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
  },
  componentName: {
    fontSize: 12,
    fontWeight: '600',
  },
  componentStats: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  warningText: {
    fontSize: 10,
    color: '#ff9800',
    marginTop: 2,
  },
  errorText: {
    color: '#f44336',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  networkRequest: {
    marginBottom: 8,
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
  },
  networkMethod: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  networkUrl: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  networkStatus: {
    fontSize: 10,
    color: '#4caf50',
    marginTop: 2,
  },
  refreshButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 20,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default DebugDashboard;