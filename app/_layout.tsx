// === Root Layout ===
// Zweck: App Root mit Auth Context, Theme Provider, und Navigation
// Features: Auth State Management, Loading States, Conditional Routing

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthProvider } from '../contexts/AuthContext';
import { AuthGuard } from '../components/AuthGuard';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Warten bis Fonts geladen sind
  if (!loaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AuthGuard>
          <Stack>
            {/* Main App Tabs - geschützt durch AuthGuard */}
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            
            {/* Auth Screens - öffentlich zugänglich */}
            <Stack.Screen 
              name="auth/login" 
              options={{ 
                headerShown: false,
                presentation: 'modal'
              }} 
            />
            <Stack.Screen 
              name="auth/register" 
              options={{ 
                headerShown: false,
                presentation: 'modal'
              }} 
            />
            <Stack.Screen 
              name="auth/forgot-password" 
              options={{ 
                headerShown: false,
                presentation: 'modal'
              }} 
            />
            
            {/* Not Found Screen */}
            <Stack.Screen name="+not-found" />
          </Stack>
        </AuthGuard>
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}
