// === Card Component ===
// Zweck: Standardisierte Container-Komponente für Cards und Elevated Content
// Features: Theme Support, Shadow Variants, Consistent Spacing

import React from 'react';
import {
  StyleSheet,
  Platform,
  type ViewProps,
} from 'react-native';

import { ThemedView } from '../ThemedView';
import { BorderRadius, Shadow, Spacing } from '@/constants/Colors';

export type CardProps = ViewProps & {
  variant?: 'default' | 'elevated' | 'habit';
  padding?: 'none' | 'small' | 'medium' | 'large';
  children: React.ReactNode;
};

export function Card({
  variant = 'default',
  padding = 'medium',
  style,
  children,
  ...rest
}: CardProps) {
  const cardStyle = [
    styles.base,
    styles[variant],
    styles[`padding_${padding}`],
    variant === 'elevated' && Platform.OS === 'ios' && Shadow.sm,
    style,
  ];

  return (
    <ThemedView 
      style={cardStyle}
      {...rest}
    >
      {children}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.lg,
  },
  
  // Variants
  default: {
    // Basic card styling
  },
  
  elevated: {
    elevation: 4, // Android shadow
  },
  
  habit: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  
  // Padding variants
  padding_none: {
    padding: 0,
  },
  
  padding_small: {
    padding: Spacing.md,
  },
  
  padding_medium: {
    padding: Spacing.lg,
  },
  
  padding_large: {
    padding: Spacing.xxl,
  },
});