// === IconButton Component ===
// Zweck: Icon-only Button für Edit, Delete, History Actions
// Features: 44pt Touch Target, Theme Support, Accessibility

import React from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  type TouchableOpacityProps,
} from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';
import { BorderRadius, Spacing } from '@/constants/Colors';

export type IconButtonProps = TouchableOpacityProps & {
  icon: React.ReactNode;
  variant?: 'default' | 'danger' | 'success';
  size?: 'small' | 'medium' | 'large';
  accessibilityLabel: string;
  accessibilityHint?: string;
};

export function IconButton({
  icon,
  variant = 'default',
  size = 'medium',
  accessibilityLabel,
  accessibilityHint,
  style,
  disabled,
  ...rest
}: IconButtonProps) {
  const backgroundColor = useThemeColor({}, getBackgroundColor(variant) as any);
  
  const buttonStyle = [
    styles.base,
    styles[size],
    variant !== 'default' && { backgroundColor },
    disabled && styles.disabled,
    style,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      {...rest}
    >
      {icon}
    </TouchableOpacity>
  );
}

function getBackgroundColor(variant: string): string {
  switch (variant) {
    case 'danger':
      return 'error';
    case 'success':
      return 'success';
    case 'default':
    default:
      return 'transparent';
  }
}

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 44,  // iOS touch target minimum
    minHeight: 44,
  },
  
  // Size variants
  small: {
    padding: Spacing.xs,
    minWidth: 36,
    minHeight: 36,
  },
  medium: {
    padding: Spacing.sm,
    minWidth: 44,
    minHeight: 44,
  },
  large: {
    padding: Spacing.md,
    minWidth: 52,
    minHeight: 52,
  },
  
  disabled: {
    opacity: 0.6,
  },
});