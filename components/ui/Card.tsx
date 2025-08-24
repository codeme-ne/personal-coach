// === Card Component ===
// Zweck: Standardisierte Container-Komponente mit NativeWind und Design System
// Features: Modern Card Layouts, Consistent Spacing, Theme Support, Header/Footer Support

import React from 'react';
import { View, StyleSheet, ViewProps, TouchableOpacity } from 'react-native';
// import { ThemedView } from '../ThemedView'; // Unused
import { ThemedText } from '../ThemedText';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

export type CardProps = ViewProps & {
  variant?: 'default' | 'elevated' | 'outline' | 'habit';
  children: React.ReactNode;
  onPress?: () => void;
};

interface CardHeaderProps {
  children: React.ReactNode;
  style?: ViewProps['style'];
}

interface CardContentProps {
  children: React.ReactNode;
  style?: ViewProps['style'];
}

interface CardFooterProps {
  children: React.ReactNode;
  style?: ViewProps['style'];
}

interface CardTitleProps {
  children: React.ReactNode;
}

interface CardDescriptionProps {
  children: React.ReactNode;
}

interface CardActionProps {
  children: React.ReactNode;
}

// Card Header Component
const CardHeader: React.FC<CardHeaderProps> = ({ children, style }) => {
  return (
    <View style={[styles.header, style]}>
      {children}
    </View>
  );
};

// Card Content Component
const CardContent: React.FC<CardContentProps> = ({ children, style }) => {
  return (
    <View style={[styles.content, style]}>
      {children}
    </View>
  );
};

// Card Footer Component
const CardFooter: React.FC<CardFooterProps> = ({ children, style }) => {
  return (
    <View style={[styles.footer, style]}>
      {children}
    </View>
  );
};

// Card Title Component
const CardTitle: React.FC<CardTitleProps> = ({ children }) => {
  return (
    <ThemedText style={styles.title}>
      {children}
    </ThemedText>
  );
};

// Card Description Component
const CardDescription: React.FC<CardDescriptionProps> = ({ children }) => {
  return (
    <ThemedText style={styles.description}>
      {children}
    </ThemedText>
  );
};

// Card Action Component
const CardAction: React.FC<CardActionProps> = ({ children }) => {
  return (
    <View style={styles.action}>
      {children}
    </View>
  );
};

// Main Card Component
const Card: React.FC<CardProps> = ({
  variant = 'default',
  style,
  children,
  onPress,
  ...rest
}) => {
  const colorScheme = useColorScheme();

  const getVariantStyles = () => {
    const baseStyle = {
      backgroundColor: Colors[colorScheme ?? 'light'].background,
      borderColor: Colors[colorScheme ?? 'light'].tabIconDefault + '30',
    };

    switch (variant) {
      case 'elevated':
        return {
          ...baseStyle,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 8,
        };
      case 'outline':
        return {
          ...baseStyle,
          borderWidth: 1,
        };
      case 'habit':
        return {
          ...baseStyle,
          borderWidth: 1,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 4,
          elevation: 2,
        };
      default:
        return {
          ...baseStyle,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        };
    }
  };

  const CardWrapper = onPress ? TouchableOpacity : View;

  return (
    <CardWrapper
      style={[
        styles.card,
        getVariantStyles(),
        style
      ]}
      onPress={onPress}
      {...rest}
    >
      {children}
    </CardWrapper>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  header: {
    marginBottom: 16,
  },
  content: {
    marginBottom: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    lineHeight: 24,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.7,
    marginBottom: 8,
  },
  action: {
    alignSelf: 'flex-start',
  },
});

// Export all components
export {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  CardTitle,
  CardDescription,
  CardAction,
};

