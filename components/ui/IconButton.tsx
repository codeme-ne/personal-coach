// === IconButton Component ===
// Zweck: Icon-only Button mit NativeWind und Design System
// Features: 44pt Touch Target, Modern Variants, Accessibility

import React from 'react';
import {
  TouchableOpacity,
  type TouchableOpacityProps,
} from 'react-native';

import { useColorScheme } from '@/hooks/useColorScheme';
import { DesignSystemColors } from '@/constants/Colors';

export type IconButtonProps = TouchableOpacityProps & {
  icon: React.ReactNode;
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'default' | 'lg';
  accessibilityLabel: string;
  accessibilityHint?: string;
  className?: string;
};

export function IconButton({
  icon,
  variant = 'default',
  size = 'default',
  accessibilityLabel,
  accessibilityHint,
  className = '',
  style,
  disabled,
  ...rest
}: IconButtonProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Get colors based on variant and theme
  const getButtonColors = () => {
    switch (variant) {
      case 'secondary':
        return {
          backgroundColor: isDark ? DesignSystemColors.dark.secondary : DesignSystemColors.light.secondary,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
        };
      case 'destructive':
        return {
          backgroundColor: isDark ? DesignSystemColors.dark.destructive : DesignSystemColors.light.destructive,
        };
      default:
        return {
          backgroundColor: 'transparent',
        };
    }
  };

  // Get size classes
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-8 h-8 p-1';
      case 'lg':
        return 'w-12 h-12 p-3';
      default:
        return 'w-10 h-10 p-2';
    }
  };

  // Get variant classes
  const getVariantClasses = () => {
    switch (variant) {
      case 'secondary':
        return 'rounded-md shadow-sm';
      case 'outline':
        return 'rounded-md border border-input';
      case 'ghost':
        return 'rounded-md hover:bg-accent';
      case 'destructive':
        return 'rounded-md shadow-sm';
      default:
        return 'rounded-md';
    }
  };

  const colors = getButtonColors();
  const combinedClassName = `
    flex items-center justify-center min-w-[44px] min-h-[44px]
    ${getSizeClasses()}
    ${getVariantClasses()}
    ${disabled ? 'opacity-60' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <TouchableOpacity
      className={combinedClassName}
      style={[
        { backgroundColor: colors.backgroundColor },
        style,
      ]}
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

