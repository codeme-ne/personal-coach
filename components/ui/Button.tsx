// === Button Component ===
// Zweck: Standardisierte Button-Komponenten basierend auf Design System
// Features: Primary, Secondary, Icon Button variants mit Theme Support

import React from 'react';
import {
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
  type TouchableOpacityProps,
} from 'react-native';

import { ThemedText } from '../ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { BorderRadius, Shadow, Spacing } from '@/constants/Colors';

export type ButtonProps = TouchableOpacityProps & {
  title?: string;
  variant?: 'primary' | 'secondary' | 'text' | 'danger';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
};

export function Button({
  title,
  variant = 'primary',
  size = 'medium',
  loading = false,
  icon,
  fullWidth = false,
  style,
  disabled,
  children,
  ...rest
}: ButtonProps) {
  const backgroundColor = useThemeColor({}, getBackgroundColor(variant, disabled) as any);
  const textColor = useThemeColor({}, getTextColor(variant) as any);
  
  const buttonStyle = [
    styles.base,
    styles[size],
    styles[variant],
    { backgroundColor },
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    style,
  ];

  const showShadow = variant === 'primary' && !disabled && Platform.OS === 'ios';

  return (
    <TouchableOpacity
      style={[
        buttonStyle,
        showShadow && Shadow.md,
      ]}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={textColor}
        />
      ) : (
        <>
          {icon && icon}
          {title && (
            <ThemedText
              type="defaultSemiBold"
              style={[
                { color: textColor },
                ...(icon ? [{ marginLeft: Spacing.sm }] : []),
              ]}
            >
              {title}
            </ThemedText>
          )}
          {children}
        </>
      )}
    </TouchableOpacity>
  );
}

// Helper functions for color mapping
function getBackgroundColor(variant: string, disabled?: boolean): string {
  if (disabled) {
    return variant === 'primary' ? 'buttonDisabled' : 'buttonSecondary';
  }
  
  switch (variant) {
    case 'primary':
      return 'buttonPrimary';
    case 'secondary':
      return 'buttonSecondary';
    case 'danger':
      return 'error';
    case 'text':
      return 'transparent';
    default:
      return 'buttonPrimary';
  }
}

function getTextColor(variant: string): string {
  switch (variant) {
    case 'primary':
    case 'danger':
      return '#FFFFFF';
    case 'secondary':
    case 'text':
      return 'textPrimary';
    default:
      return '#FFFFFF';
  }
}

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44, // iOS touch target minimum
  },
  
  // Size variants
  small: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    minHeight: 36,
  },
  medium: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    minHeight: 44,
  },
  large: {
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.lg,
    minHeight: 52,
  },
  
  // Variant styles
  primary: {
    // Background color handled by theme
  },
  secondary: {
    borderWidth: 1,
    borderColor: '#D0D0D0',
  },
  text: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  danger: {
    // Background color handled by theme
  },
  
  // State styles
  disabled: {
    opacity: 0.6,
  },
  fullWidth: {
    width: '100%',
  },
  textWithIcon: {
    marginLeft: Spacing.sm,
  },
});