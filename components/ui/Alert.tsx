// === Alert Component ===
// Zweck: Schöne Alert-Messages mit Icons für React Native
// Features: Success, Error, Warning, Info Variants mit Icons

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

export type AlertVariant = 'default' | 'success' | 'destructive' | 'warning' | 'info';

interface AlertProps {
  variant?: AlertVariant;
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
}

interface AlertTitleProps {
  children: React.ReactNode;
}

interface AlertDescriptionProps {
  children: React.ReactNode;
}

interface AlertIconProps {
  variant?: AlertVariant;
}

// Alert Icon Component
export const AlertIcon: React.FC<AlertIconProps> = ({ variant = 'default' }) => {
  const colorScheme = useColorScheme();
  
  const getIconConfig = () => {
    switch (variant) {
      case 'success':
        return { name: 'check-circle' as const, color: '#10B981' };
      case 'destructive':
        return { name: 'error' as const, color: '#EF4444' };
      case 'warning':
        return { name: 'warning' as const, color: '#F59E0B' };
      case 'info':
        return { name: 'info' as const, color: '#3B82F6' };
      default:
        return { name: 'notifications' as const, color: Colors[colorScheme ?? 'light'].tint };
    }
  };

  const { name, color } = getIconConfig();

  return (
    <MaterialIcons 
      name={name} 
      size={20} 
      color={color} 
      style={styles.icon}
    />
  );
};

// Alert Title Component
export const AlertTitle: React.FC<AlertTitleProps> = ({ children }) => {
  return (
    <ThemedText style={styles.title}>
      {children}
    </ThemedText>
  );
};

// Alert Description Component
export const AlertDescription: React.FC<AlertDescriptionProps> = ({ children }) => {
  return (
    <ThemedText style={styles.description}>
      {children}
    </ThemedText>
  );
};

// Main Alert Component
export const Alert: React.FC<AlertProps> = ({ 
  variant = 'default', 
  children, 
  style,
  onPress 
}) => {
  const colorScheme = useColorScheme();
  
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return {
          backgroundColor: '#F0FDF4',
          borderColor: '#10B981',
          borderLeftColor: '#10B981',
        };
      case 'destructive':
        return {
          backgroundColor: '#FEF2F2',
          borderColor: '#EF4444',
          borderLeftColor: '#EF4444',
        };
      case 'warning':
        return {
          backgroundColor: '#FFFBEB',
          borderColor: '#F59E0B',
          borderLeftColor: '#F59E0B',
        };
      case 'info':
        return {
          backgroundColor: '#EFF6FF',
          borderColor: '#3B82F6',
          borderLeftColor: '#3B82F6',
        };
      default:
        return {
          backgroundColor: Colors[colorScheme ?? 'light'].background,
          borderColor: Colors[colorScheme ?? 'light'].tabIconDefault,
          borderLeftColor: Colors[colorScheme ?? 'light'].tint,
        };
    }
  };

  const variantStyles = getVariantStyles();

  // Check if alert contains an icon by looking at children
  const hasCustomIcon = React.Children.toArray(children).some(
    child => React.isValidElement(child) && 
    (child.type === MaterialIcons || child.props?.name)
  );

  return (
    <ThemedView 
      style={[
        styles.alert,
        variantStyles,
        style
      ]}
    >
      <View style={styles.content}>
        {/* Auto-add icon if no custom icon provided */}
        {!hasCustomIcon && <AlertIcon variant={variant} />}
        
        <View style={styles.textContent}>
          {children}
        </View>
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  alert: {
    borderRadius: 8,
    borderWidth: 1,
    borderLeftWidth: 4,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  icon: {
    marginRight: 12,
    marginTop: 2,
  },
  textContent: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    lineHeight: 22,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },
});

// Export all components for easy import
export default Alert;