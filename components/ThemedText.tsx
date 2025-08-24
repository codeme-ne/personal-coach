import { Text, type TextProps } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { DesignSystemColors } from '@/constants/Colors';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link' | 'muted';
  className?: string;
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  className = '',
  ...rest
}: ThemedTextProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // Determine color based on type and theme
  let textColor = lightColor || darkColor;
  if (!textColor) {
    switch (type) {
      case 'link':
        textColor = isDark ? DesignSystemColors.dark.primary : DesignSystemColors.light.primary;
        break;
      case 'muted':
        textColor = isDark ? DesignSystemColors.dark.mutedForeground : DesignSystemColors.light.mutedForeground;
        break;
      default:
        textColor = isDark ? DesignSystemColors.dark.foreground : DesignSystemColors.light.foreground;
    }
  }


  // Convert type to style object
  const typeStyle = (() => {
    switch (type) {
      case 'title':
        return { fontSize: 30, fontWeight: 'bold', lineHeight: 36 };
      case 'subtitle':
        return { fontSize: 20, fontWeight: 'bold' };
      case 'defaultSemiBold':
        return { fontSize: 16, fontWeight: '600', lineHeight: 24 };
      case 'link':
        return { fontSize: 16, lineHeight: 32, textDecorationLine: 'underline' };
      case 'muted':
        return { fontSize: 14 };
      default:
        return { fontSize: 16, lineHeight: 24 };
    }
  })();

  return (
    <Text
      style={[
        { color: textColor },
        typeStyle,
        style,
      ]}
      {...rest}
    />
  );
}

