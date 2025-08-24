// === Feedback Context mit Toast Notifications und Alerts ===
// Zweck: Zentrales Feedback-System für nicht-blockierende Benachrichtigungen und Alert-Messages
// Features: Toast-Nachrichten, Queue-Management, Platform-spezifisches Styling, Alert-Messages

import React, { createContext, useContext, useRef, ReactNode, useState } from 'react';
import { Platform, View } from 'react-native';
import Toast, { ToastProvider as RNToastProvider, ToastOptions } from 'react-native-toast-notifications';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';
import { Alert, AlertTitle, AlertDescription, AlertVariant } from '../components/ui/Alert';

// === Types ===
export type FeedbackType = 'success' | 'error' | 'info' | 'warning';

interface AlertMessage {
  id: string;
  title: string;
  description?: string;
  variant: AlertVariant;
  duration?: number;
}

interface FeedbackContextType {
  showToast: (message: string, type?: FeedbackType, duration?: number) => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  showAlert: (title: string, description?: string, variant?: AlertVariant, duration?: number) => void;
  hideAlert: (id: string) => void;
  alerts: AlertMessage[];
}

// === Context ===
const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

// === Custom Hook ===
export const useFeedback = (): FeedbackContextType => {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return context;
};

// === Provider Props ===
interface FeedbackProviderProps {
  children: ReactNode;
}

// === Provider Component ===
export const FeedbackProvider: React.FC<FeedbackProviderProps> = ({ children }) => {
  const toastRef = useRef<Toast>(null);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // === Toast Configuration ===
  const getToastConfig = (type: FeedbackType): Partial<ToastOptions> => {
    const configs = {
      success: {
        style: {
          backgroundColor: isDark ? '#10B981' : '#059669',
          borderLeftWidth: 4,
          borderLeftColor: '#34D399',
        },
        icon: <MaterialIcons name="check-circle" size={24} color="white" />,
      },
      error: {
        style: {
          backgroundColor: isDark ? '#EF4444' : '#DC2626',
          borderLeftWidth: 4,
          borderLeftColor: '#F87171',
        },
        icon: <MaterialIcons name="error" size={24} color="white" />,
      },
      info: {
        style: {
          backgroundColor: isDark ? '#3B82F6' : '#2563EB',
          borderLeftWidth: 4,
          borderLeftColor: '#60A5FA',
        },
        icon: <MaterialIcons name="info" size={24} color="white" />,
      },
      warning: {
        style: {
          backgroundColor: isDark ? '#F59E0B' : '#D97706',
          borderLeftWidth: 4,
          borderLeftColor: '#FCD34D',
        },
        icon: <MaterialIcons name="warning" size={24} color="white" />,
      },
    };
    
    return configs[type];
  };
  
  // === Toast Methods ===
  const showToast = (message: string, type: FeedbackType = 'info', duration: number = 3000) => {
    const config = getToastConfig(type);
    
    toastRef.current?.show(message, {
      type: 'custom',
      duration,
      placement: Platform.OS === 'ios' ? 'top' : 'bottom',
      animationType: 'slide-in',
      ...config,
      textStyle: {
        color: 'white',
        fontSize: 14,
        fontWeight: '500',
      },
      style: {
        ...config.style,
        minHeight: 56,
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginHorizontal: 16,
        marginVertical: Platform.OS === 'ios' ? 50 : 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
      },
    });
  };
  
  const showSuccess = (message: string, duration = 3000) => {
    showToast(message, 'success', duration);
  };
  
  const showError = (message: string, duration = 4000) => {
    showToast(message, 'error', duration);
  };
  
  const showInfo = (message: string, duration = 3000) => {
    showToast(message, 'info', duration);
  };
  
  const showWarning = (message: string, duration = 3500) => {
    showToast(message, 'warning', duration);
  };
  
  // === Context Value ===
  const contextValue: FeedbackContextType = {
    showToast,
    showSuccess,
    showError,
    showInfo,
    showWarning,
  };
  
  return (
    <FeedbackContext.Provider value={contextValue}>
      <RNToastProvider
        ref={toastRef}
        offsetTop={Platform.OS === 'ios' ? 50 : 30}
        offsetBottom={Platform.OS === 'ios' ? 30 : 50}
        swipeEnabled={true}
        normalColor={Colors[colorScheme ?? 'light'].text}
      >
        {children}
      </RNToastProvider>
    </FeedbackContext.Provider>
  );
};

// === Utility Functions für Migration ===

/**
 * Hilfsfunktion zum Ersetzen von Alert.alert() Aufrufen
 * Nur für Info/Success/Error Nachrichten, nicht für Dialoge mit Buttons
 */
export const showFeedback = (
  title: string,
  message?: string,
  type: FeedbackType = 'info'
) => {
  // Diese Funktion kann in Komponenten verwendet werden, die noch keinen Zugriff auf den Context haben
  const fullMessage = message ? `${title}: ${message}` : title;
  
  // Fallback auf console.log wenn kein Toast verfügbar
  console.log(`[${type.toUpperCase()}] ${fullMessage}`);
  
  // In der echten App wird dies durch useFeedback Hook ersetzt
};

// === Export für einfache Verwendung ===
export default FeedbackProvider;