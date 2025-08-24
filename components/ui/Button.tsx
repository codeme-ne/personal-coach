// === Button Component ===
// Zweck: Standardisierte Button-Komponenten mit NativeWind und Design System
// Features: Primary, Secondary, Text, Danger variants mit Theme Support

import React from 'react';
import {
  TouchableOpacity,
  ActivityIndicator,
  type TouchableOpacityProps,
} from 'react-native';

import { ThemedText } from '../ThemedText';
import { useColorScheme } from '@/hooks/useColorScheme';
import { DesignSystemColors } from '@/constants/Colors';

export type ButtonProps = TouchableOpacityProps & {
  title?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'default' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  className?: string;
};

export function Button({
  title,
  variant = 'primary',
  size = 'default',
  loading = false,
  icon,
  fullWidth = false,
  style,
  className = '',
  disabled,
  children,
  ...rest
}: ButtonProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Get colors based on variant and theme
  const getButtonColors = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: isDark ? DesignSystemColors.dark.primary : DesignSystemColors.light.primary,
          textColor: isDark ? DesignSystemColors.dark.primaryForeground : DesignSystemColors.light.primaryForeground,
        };
      case 'secondary':
        return {
          backgroundColor: isDark ? DesignSystemColors.dark.secondary : DesignSystemColors.light.secondary,
          textColor: isDark ? DesignSystemColors.dark.secondaryForeground : DesignSystemColors.light.secondaryForeground,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          textColor: isDark ? DesignSystemColors.dark.foreground : DesignSystemColors.light.foreground,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          textColor: isDark ? DesignSystemColors.dark.foreground : DesignSystemColors.light.foreground,
        };
      case 'destructive':
        return {
          backgroundColor: isDark ? DesignSystemColors.dark.destructive : DesignSystemColors.light.destructive,
          textColor: '#ffffff',
        };
      default:
        return {
          backgroundColor: isDark ? DesignSystemColors.dark.primary : DesignSystemColors.light.primary,
          textColor: isDark ? DesignSystemColors.dark.primaryForeground : DesignSystemColors.light.primaryForeground,
        };
    }
  };

  // Get size classes
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-9 px-3';
      case 'lg':
        return 'h-11 px-8';
      default:
        return 'h-10 px-4 py-2';
    }
  };

  // Get variant classes
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'rounded-md shadow-sm';
      case 'secondary':
        return 'rounded-md border border-input shadow-sm';
      case 'outline':
        return 'rounded-md border border-input shadow-sm';
      case 'ghost':
        return 'rounded-md';
      case 'destructive':
        return 'rounded-md shadow-sm';
      default:
        return 'rounded-md shadow-sm';
    }
  };

  const colors = getButtonColors();
  // Convert size to style object
  const sizeStyle = (() => {
    switch (size) {
      case 'sm':
        return { height: 32, paddingHorizontal: 14, paddingVertical: 6 };
      case 'lg':
        return { height: 44, paddingHorizontal: 32 };
      default:
        return { height: 36, paddingHorizontal: 16, paddingVertical: 8 };
    }
  })();

  // Convert variant to style object
  const variantStyle = (() => {
    switch (variant) {
      case 'secondary':
      case 'outline':
        return { 
          borderRadius: 6, 
          borderWidth: 1, 
          borderColor: colors.backgroundColor === 'transparent' ? 
            (isDark ? DesignSystemColors.dark.border : DesignSystemColors.light.border) : 
            'transparent'
        };
      default:
        return { borderRadius: 6 };
    }
  })();

  return (
    <TouchableOpacity
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 44,
          backgroundColor: colors.backgroundColor,
          opacity: disabled ? 0.6 : 1,
          width: fullWidth ? '100%' : undefined,
        },
        sizeStyle,
        variantStyle,
        style,
      ]}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={colors.textColor}
        />
      ) : (
        <>
          {icon && icon}
          {title && (
            <ThemedText
              style={{ 
                color: colors.textColor,
                marginLeft: icon ? 8 : 0,
                fontSize: size === 'sm' ? 14 : 15,
                fontWeight: '600',
                fontFamily: 'System',
              }}
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

