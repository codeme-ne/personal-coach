import { 
  collection, 
  doc, 
  onSnapshot, 
  QuerySnapshot,
  DocumentSnapshot,
  FirestoreError 
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import logger, { createDebugContext } from './debugLogger';

const debug = createDebugContext('FirebaseDebug');

interface FirebaseOperation {
  id: string;
  type: 'read' | 'write' | 'delete' | 'auth' | 'storage';
  collection?: string;
  document?: string;
  operation: string;
  timestamp: number;
  duration?: number;
  error?: any;
  data?: any;
  userId?: string;
}

class FirebaseDebugger {
  private static instance: FirebaseDebugger;
  private operations: FirebaseOperation[] = [];
  private listeners: Map<string, () => void> = new Map();
  private operationCount = 0;
  private totalDuration = 0;
  private errorCount = 0;
  
  private constructor() {
    if (__DEV__) {
      this.setupAuthListener();
      this.setupPerformanceMonitoring();
      this.exposeDebugInterface();
    }
  }
  
  static getInstance(): FirebaseDebugger {
    if (!FirebaseDebugger.instance) {
      FirebaseDebugger.instance = new FirebaseDebugger();
    }
    return FirebaseDebugger.instance;
  }
  
  private setupAuthListener(): void {
    auth.onAuthStateChanged((user) => {
      if (user) {
        debug.info('Auth state changed: User logged in', {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
        });
      } else {
        debug.info('Auth state changed: User logged out');
      }
    });
  }
  
  private setupPerformanceMonitoring(): void {
    // Override Firestore methods to add performance monitoring
    this.wrapFirestoreMethods();
  }
  
  private wrapFirestoreMethods(): void {
    // This would wrap actual Firestore methods
    // For now, we'll provide utility methods instead
  }
  
  private exposeDebugInterface(): void {
    if (typeof window !== 'undefined') {
      (window as any).FIREBASE_DEBUG = {
        operations: () => this.getOperations(),
        clearOperations: () => this.clearOperations(),
        stats: () => this.getStats(),
        listeners: () => this.getActiveListeners(),
        simulateError: (type: string) => this.simulateError(type),
        exportData: () => this.exportDebugData(),
      };
    }
  }
  
  // Operation tracking
  startOperation(
    type: FirebaseOperation['type'],
    operation: string,
    metadata?: Partial<FirebaseOperation>
  ): string {
    const id = `op_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    const op: FirebaseOperation = {
      id,
      type,
      operation,
      timestamp: Date.now(),
      userId: auth.currentUser?.uid,
      ...metadata,
    };
    
    this.operations.push(op);
    this.operationCount++;
    
    debug.debug(`Firebase operation started: ${operation}`, op);
    
    return id;
  }
  
  endOperation(id: string, data?: any, error?: any): void {
    const op = this.operations.find(o => o.id === id);
    if (!op) return;
    
    op.duration = Date.now() - op.timestamp;
    op.data = data;
    op.error = error;
    
    if (op.duration) {
      this.totalDuration += op.duration;
    }
    
    if (error) {
      this.errorCount++;
      debug.error(`Firebase operation failed: ${op.operation}`, {
        duration: `${op.duration}ms`,
        error,
      });
    } else {
      debug.debug(`Firebase operation completed: ${op.operation}`, {
        duration: `${op.duration}ms`,
        data,
      });
    }
    
    // Keep only last 100 operations
    if (this.operations.length > 100) {
      this.operations.shift();
    }
  }
  
  // Firestore debugging helpers
  async debugCollection(collectionName: string): Promise<void> {
    const opId = this.startOperation('read', `Debug collection: ${collectionName}`, {
      collection: collectionName,
    });
    
    try {
      const snapshot = await collection(db, collectionName).get();
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        data: doc.data(),
      }));
      
      debug.info(`Collection ${collectionName}:`, {
        size: snapshot.size,
        empty: snapshot.empty,
        documents: data,
      });
      
      this.endOperation(opId, data);
    } catch (error) {
      this.endOperation(opId, null, error);
      throw error;
    }
  }
  
  async debugDocument(collectionName: string, documentId: string): Promise<void> {
    const opId = this.startOperation('read', `Debug document: ${collectionName}/${documentId}`, {
      collection: collectionName,
      document: documentId,
    });
    
    try {
      const docRef = doc(db, collectionName, documentId);
      const snapshot = await docRef.get();
      
      const data = {
        exists: snapshot.exists(),
        id: snapshot.id,
        data: snapshot.data(),
        metadata: snapshot.metadata,
      };
      
      debug.info(`Document ${collectionName}/${documentId}:`, data);
      
      this.endOperation(opId, data);
    } catch (error) {
      this.endOperation(opId, null, error);
      throw error;
    }
  }
  
  // Real-time listener debugging
  addListenerDebug(
    collectionName: string,
    callback: (snapshot: QuerySnapshot) => void,
    onError?: (error: FirestoreError) => void
  ): () => void {
    const listenerId = `listener_${Date.now()}`;
    
    debug.info(`Adding listener to collection: ${collectionName}`, { listenerId });
    
    const unsubscribe = onSnapshot(
      collection(db, collectionName),
      (snapshot) => {
        debug.debug(`Listener triggered: ${collectionName}`, {
          listenerId,
          size: snapshot.size,
          changes: snapshot.docChanges().map(change => ({
            type: change.type,
            id: change.doc.id,
          })),
        });
        
        callback(snapshot);
      },
      (error) => {
        debug.error(`Listener error: ${collectionName}`, {
          listenerId,
          error,
        });
        
        if (onError) {
          onError(error);
        }
      }
    );
    
    this.listeners.set(listenerId, unsubscribe);
    
    return () => {
      debug.info(`Removing listener: ${collectionName}`, { listenerId });
      unsubscribe();
      this.listeners.delete(listenerId);
    };
  }
  
  // Debug utilities
  getOperations(): FirebaseOperation[] {
    return [...this.operations];
  }
  
  clearOperations(): void {
    this.operations = [];
    this.operationCount = 0;
    this.totalDuration = 0;
    this.errorCount = 0;
    debug.info('Firebase operations cleared');
  }
  
  getStats() {
    const stats = {
      totalOperations: this.operationCount,
      currentOperations: this.operations.length,
      totalDuration: this.totalDuration,
      averageDuration: this.operationCount > 0 ? this.totalDuration / this.operationCount : 0,
      errorCount: this.errorCount,
      errorRate: this.operationCount > 0 ? (this.errorCount / this.operationCount) * 100 : 0,
      activeListeners: this.listeners.size,
      operationsByType: this.getOperationsByType(),
    };
    
    debug.info('Firebase Debug Stats:', stats);
    return stats;
  }
  
  private getOperationsByType() {
    const types: Record<string, number> = {};
    
    this.operations.forEach(op => {
      types[op.type] = (types[op.type] || 0) + 1;
    });
    
    return types;
  }
  
  getActiveListeners(): string[] {
    return Array.from(this.listeners.keys());
  }
  
  // Error simulation for testing
  simulateError(type: string): void {
    debug.warn(`Simulating Firebase error: ${type}`);
    
    switch (type) {
      case 'permission':
        throw new Error('Firebase: Permission denied');
      case 'network':
        throw new Error('Firebase: Network error');
      case 'quota':
        throw new Error('Firebase: Quota exceeded');
      default:
        throw new Error(`Firebase: Simulated error (${type})`);
    }
  }
  
  // Export debug data
  exportDebugData(): string {
    const data = {
      timestamp: new Date().toISOString(),
      stats: this.getStats(),
      operations: this.operations,
      listeners: this.getActiveListeners(),
      user: auth.currentUser ? {
        uid: auth.currentUser.uid,
        email: auth.currentUser.email,
        displayName: auth.currentUser.displayName,
      } : null,
    };
    
    return JSON.stringify(data, null, 2);
  }
  
  // Performance measurement wrapper
  async measureFirebaseOperation<T>(
    name: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const opId = this.startOperation('read', name);
    
    try {
      const result = await operation();
      this.endOperation(opId, result);
      return result;
    } catch (error) {
      this.endOperation(opId, null, error);
      throw error;
    }
  }
  
  // Batch operation debugging
  debugBatch(operations: Array<{ type: string; data: any }>): void {
    debug.info('Batch operation', {
      operationCount: operations.length,
      operations: operations.map(op => ({
        type: op.type,
        preview: JSON.stringify(op.data).substring(0, 100),
      })),
    });
  }
  
  // Cache debugging
  debugCache(): void {
    // This would show Firestore cache information if available
    debug.info('Firestore cache status', {
      // Cache information would go here
      message: 'Cache debugging not fully implemented',
    });
  }
  
  // Network status
  debugNetworkStatus(): void {
    debug.info('Firebase network status', {
      online: navigator.onLine,
      // Additional network information
    });
  }
}

// Export singleton instance
export const firebaseDebugger = FirebaseDebugger.getInstance();

// Export convenience functions
export const debugFirestore = {
  collection: (name: string) => firebaseDebugger.debugCollection(name),
  document: (collection: string, id: string) => firebaseDebugger.debugDocument(collection, id),
  listener: (collection: string, callback: (snapshot: QuerySnapshot) => void) => 
    firebaseDebugger.addListenerDebug(collection, callback),
  stats: () => firebaseDebugger.getStats(),
  clear: () => firebaseDebugger.clearOperations(),
  export: () => firebaseDebugger.exportDebugData(),
};

// Wrapper for Firebase operations with automatic debugging
export const withFirebaseDebug = async <T>(
  operationName: string,
  operation: () => Promise<T>
): Promise<T> => {
  return firebaseDebugger.measureFirebaseOperation(operationName, operation);
};

// Debug decorators for service methods
export function FirebaseDebug(operationName?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const name = operationName || `${target.constructor.name}.${propertyKey}`;
      const opId = firebaseDebugger.startOperation('read', name, {
        args: args.length > 0 ? args : undefined,
      });
      
      try {
        const result = await originalMethod.apply(this, args);
        firebaseDebugger.endOperation(opId, result);
        return result;
      } catch (error) {
        firebaseDebugger.endOperation(opId, null, error);
        throw error;
      }
    };
    
    return descriptor;
  };
}

export default firebaseDebugger;