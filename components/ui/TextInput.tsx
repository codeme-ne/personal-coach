// === TextInput Component ===
// Zweck: Standardisierte Input-Komponente basierend auf Design System
// Features: Theme Support, Error States, Label Support

import React, { useState } from 'react';
import {
  TextInput as RNTextInput,
  StyleSheet,
  View,
  type TextInputProps as RNTextInputProps,
} from 'react-native';

import { ThemedText } from '../ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { BorderRadius, Spacing } from '@/constants/Colors';

export type TextInputProps = RNTextInputProps & {
  label?: string;
  error?: string;
  hint?: string;
  variant?: 'default' | 'multiline';
};

export function TextInput({
  label,
  error,
  hint,
  variant = 'default',
  style,
  onFocus,
  onBlur,
  ...rest
}: TextInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  
  const backgroundColor = useThemeColor({}, 'background' as any);
  const borderColor = useThemeColor({}, error ? 'error' : isFocused ? 'borderFocus' : 'borderInput' as any);
  const textColor = useThemeColor({}, 'textPrimary' as any);
  const placeholderColor = useThemeColor({}, 'textSecondary' as any);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const inputStyle = [
    styles.base,
    variant === 'multiline' && styles.multiline,
    {
      backgroundColor,
      borderColor,
      color: textColor,
    },
    style,
  ];

  return (
    <View style={styles.container}>
      {label && (
        <ThemedText 
          type="defaultSemiBold" 
          style={styles.label}
        >
          {label}
        </ThemedText>
      )}
      
      <RNTextInput
        style={inputStyle}
        placeholderTextColor={placeholderColor}
        onFocus={handleFocus}
        onBlur={handleBlur}
        multiline={variant === 'multiline'}
        textAlignVertical={variant === 'multiline' ? 'top' : 'center'}
        accessibilityLabel={label}
        {...rest}
      />
      
      {error && (
        <ThemedText 
          style={[styles.errorText, { color: 'red' }]}
        >
          {error}
        </ThemedText>
      )}
      
      {hint && !error && (
        <ThemedText 
          style={[styles.hintText, { opacity: 0.7 }]}
        >
          {hint}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  
  label: {
    marginBottom: Spacing.sm,
  },
  
  base: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
    minHeight: 44,
  },
  
  multiline: {
    minHeight: 80,
    paddingTop: Spacing.md,
  },
  
  errorText: {
    marginTop: Spacing.xs,
  },
  
  hintText: {
    marginTop: Spacing.xs,
  },
});