import { useColorScheme } from '@/hooks/useColorScheme';
import { DesignSystemColors } from '@/constants/Colors';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Platform, TouchableOpacity, View } from 'react-native';
import { ThemedText } from './ThemedText';
import { IconSymbol } from './ui/IconSymbol';

interface CustomTabBarProps extends BottomTabBarProps {
  onAddPress: () => void;
}

export function CustomTabBar({ state, descriptors, navigation, onAddPress }: CustomTabBarProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const primaryColor = isDark ? DesignSystemColors.dark.primary : DesignSystemColors.light.primary;
  const backgroundColor = isDark ? DesignSystemColors.dark.card : DesignSystemColors.light.card;
  const borderColor = isDark ? DesignSystemColors.dark.border : DesignSystemColors.light.border;
  const mutedColor = isDark ? DesignSystemColors.dark.mutedForeground : DesignSystemColors.light.mutedForeground;

  return (
    <View style={{ 
      position: 'absolute', 
      bottom: 0, 
      left: 0, 
      right: 0,
      paddingBottom: Platform.OS === 'ios' ? 20 : 0 
    }}>
      <View 
        style={{ 
          flexDirection: 'row',
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          borderTopWidth: 0.5,
          backgroundColor, 
          borderTopColor: borderColor,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        }}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = options.title || route.name;
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          // Get icon name based on route
          const getIconName = () => {
            if (route.name === 'index') return 'checkmark.circle.fill';
            if (route.name === 'stats') return 'chart.bar.fill';
            if (route.name === 'settings') return 'gearshape.fill';
            return 'circle';
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarAccessibilityLabel}
              onPress={onPress}
              style={{ 
                flex: 1, 
                alignItems: 'center', 
                justifyContent: 'center', 
                paddingVertical: 4 
              }}
            >
              <IconSymbol
                name={getIconName()}
                size={28}
                color={isFocused ? primaryColor : mutedColor}
              />
              <ThemedText 
                style={{ 
                  color: isFocused ? primaryColor : mutedColor,
                  fontSize: 14,
                  marginTop: 2,
                  fontWeight: '500'
                }}
              >
                {label}
              </ThemedText>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={{ 
          position: 'absolute',
          width: 56,
          height: 56,
          borderRadius: 28,
          alignItems: 'center',
          justifyContent: 'center',
          alignSelf: 'center',
          bottom: Platform.OS === 'ios' ? 35 : 20,
          backgroundColor: primaryColor,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
        }}
        onPress={onAddPress}
        activeOpacity={0.8}
      >
        <ThemedText 
          style={{ 
            color: isDark ? DesignSystemColors.dark.primaryForeground : DesignSystemColors.light.primaryForeground,
            fontSize: 32,
            fontWeight: '300',
            lineHeight: 32
          }}
        >
          +
        </ThemedText>
      </TouchableOpacity>
    </View>
  );
}

