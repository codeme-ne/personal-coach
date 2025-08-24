import { View, type ViewProps } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { DesignSystemColors } from '@/constants/Colors';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  className?: string;
  variant?: 'default' | 'card' | 'secondary' | 'muted';
};

export function ThemedView({ 
  style, 
  lightColor, 
  darkColor, 
  className = '',
  variant = 'default',
  ...otherProps 
}: ThemedViewProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // Determine background color based on variant and theme
  let backgroundColor = lightColor || darkColor;
  if (!backgroundColor) {
    switch (variant) {
      case 'card':
        backgroundColor = isDark ? DesignSystemColors.dark.card : DesignSystemColors.light.card;
        break;
      case 'secondary':
        backgroundColor = isDark ? DesignSystemColors.dark.secondary : DesignSystemColors.light.secondary;
        break;
      case 'muted':
        backgroundColor = isDark ? DesignSystemColors.dark.muted : DesignSystemColors.light.muted;
        break;
      default:
        backgroundColor = isDark ? DesignSystemColors.dark.background : DesignSystemColors.light.background;
    }
  }

  // Convert variant to style object
  const variantStyle = (() => {
    switch (variant) {
      case 'card':
        return { 
          borderRadius: 8, 
          borderWidth: 1, 
          borderColor: isDark ? DesignSystemColors.dark.border : DesignSystemColors.light.border,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 1,
        };
      case 'secondary':
        return { borderRadius: 6 };
      case 'muted':
        return { borderRadius: 6 };
      default:
        return {};
    }
  })();

  return (
    <View 
      style={[
        { backgroundColor }, 
        variantStyle,
        style
      ]} 
      {...otherProps} 
    />
  );
}
