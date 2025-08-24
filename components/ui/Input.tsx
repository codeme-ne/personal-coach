// === Input Component ===
// Zweck: Styled Input Component für React Native mit Validation Support
// Features: Different variants, error states, icons, accessibility

import React, { useState, forwardRef } from 'react';
import { 
  View, 
  TextInput, 
  StyleSheet, 
  ViewStyle, 
  TextInputProps,
  TouchableOpacity 
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ThemedText } from '../ThemedText';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

export type InputVariant = 'default' | 'filled' | 'outline';

interface InputProps extends Omit<TextInputProps, 'style'> {
  variant?: InputVariant;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  inputStyle?: TextInputProps['style'];
  label?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
}

export const Input = forwardRef<TextInput, InputProps>(({
  variant = 'default',
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  inputStyle,
  label,
  helperText,
  required = false,
  disabled = false,
  secureTextEntry,
  ...props
}, ref) => {
  const colorScheme = useColorScheme();
  const [isFocused, setIsFocused] = useState(false);
  const [isSecure, setIsSecure] = useState(secureTextEntry);

  const getVariantStyles = () => {
    const baseStyle = {
      borderColor: error 
        ? '#EF4444' 
        : isFocused 
          ? Colors[colorScheme ?? 'light'].tint
          : Colors[colorScheme ?? 'light'].tabIconDefault,
      backgroundColor: disabled
        ? Colors[colorScheme ?? 'light'].background
        : 'transparent',
    };

    switch (variant) {
      case 'filled':
        return {
          ...baseStyle,
          backgroundColor: disabled
            ? Colors[colorScheme ?? 'light'].background
            : Colors[colorScheme ?? 'light'].background,
          borderWidth: 0,
          borderBottomWidth: 2,
        };
      case 'outline':
        return {
          ...baseStyle,
          borderWidth: 1,
        };
      default:
        return {
          ...baseStyle,
          borderWidth: 1,
        };
    }
  };

  const handlePasswordToggle = () => {
    setIsSecure(!isSecure);
  };

  const shouldShowPasswordToggle = secureTextEntry && !rightIcon;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <ThemedText style={styles.label}>
          {label}{required ? ' *' : ''}
        </ThemedText>
      )}
      
      <View style={[
        styles.inputContainer,
        getVariantStyles(),
        disabled && styles.disabled
      ]}>
        {leftIcon && (
          <View style={styles.leftIconContainer}>
            {leftIcon}
          </View>
        )}
        
        <TextInput
          ref={ref}
          style={[
            styles.input,
            {
              color: disabled
                ? Colors[colorScheme ?? 'light'].tabIconDefault
                : Colors[colorScheme ?? 'light'].text,
            },
            leftIcon ? styles.inputWithLeftIcon : null,
            (rightIcon || shouldShowPasswordToggle) ? styles.inputWithRightIcon : null,
            inputStyle
          ]}
          placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          editable={!disabled}
          secureTextEntry={isSecure}
          {...props}
        />
        
        {shouldShowPasswordToggle && (
          <TouchableOpacity 
            style={styles.rightIconContainer}
            onPress={handlePasswordToggle}
            disabled={disabled}
          >
            <MaterialIcons 
              name={isSecure ? 'visibility-off' : 'visibility'} 
              size={20} 
              color={Colors[colorScheme ?? 'light'].tabIconDefault}
            />
          </TouchableOpacity>
        )}
        
        {rightIcon && !shouldShowPasswordToggle && (
          <TouchableOpacity 
            style={styles.rightIconContainer}
            onPress={onRightIconPress}
            disabled={disabled || !onRightIconPress}
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>
      
      {(error || helperText) && (
        <ThemedText style={[
          styles.helperText,
          error && styles.errorText
        ]}>
          {error || helperText}
        </ThemedText>
      )}
    </View>
  );
});

Input.displayName = 'Input';

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  required: {
    color: '#EF4444',
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    minHeight: 44,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 0,
  },
  inputWithLeftIcon: {
    paddingLeft: 8,
  },
  inputWithRightIcon: {
    paddingRight: 8,
  },
  leftIconContainer: {
    marginRight: 8,
  },
  rightIconContainer: {
    marginLeft: 8,
    padding: 4,
  },
  disabled: {
    opacity: 0.6,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.7,
  },
  errorText: {
    color: '#EF4444',
    opacity: 1,
  },
});

export default Input;