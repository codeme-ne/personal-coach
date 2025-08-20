// === Auth Guard Component ===
// Zweck: Schützt App Routen und leitet zu Login weiter wenn nicht authentifiziert
// Features: Loading States, Conditional Rendering, Auto-Redirect

import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router, usePathname } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';
import { useThemeColor } from '../hooks/useThemeColor';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { user, isLoading, isSignedIn } = useAuth();
  const pathname = usePathname();
  
  // Theme Colors für Loading Screen
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const primaryColor = useThemeColor({ light: '#007AFF', dark: '#0A84FF' }, 'tint');

  // Definiere welche Routen öffentlich zugänglich sind (keine Auth erforderlich)
  const publicRoutes = [
    '/auth/login',
    '/auth/register', 
    '/auth/forgot-password',
    '+not-found'  // 404 Seite sollte immer zugänglich sein
  ];

  // Prüfe ob aktuelle Route öffentlich ist
  const isPublicRoute = publicRoutes.some(route => pathname.includes(route));

  // Auth Status Effect - handle routing logic
  useEffect(() => {
    // Während Loading machen wir nichts
    if (isLoading) {
      return;
    }

    // User ist nicht eingeloggt
    if (!isSignedIn) {
      // Wenn wir nicht auf einer öffentlichen Route sind, redirect zu Login
      if (!isPublicRoute) {
        console.log('User not authenticated, redirecting to login...');
        router.replace('/auth/login');
      }
      return;
    }

    // User ist eingeloggt
    if (isSignedIn) {
      // Wenn wir auf einer Auth Route sind, redirect zu Main App
      if (isPublicRoute && pathname !== '+not-found') {
        console.log('User authenticated, redirecting to main app...');
        router.replace('/(tabs)');
      }
      return;
    }
  }, [isSignedIn, isLoading, pathname, isPublicRoute]);

  // Loading State - zeige Loading Spinner während Auth Check
  if (isLoading) {
    return (
      <ThemedView style={[styles.loadingContainer, { backgroundColor }]}>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color={primaryColor} />
          <ThemedText style={[styles.loadingText, { color: textColor }]}>
            Lade App...
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  // Unauthenticated State - User ist nicht eingeloggt
  if (!isSignedIn) {
    // Wenn auf öffentlicher Route, zeige normalen Content (Auth Screens)
    if (isPublicRoute) {
      return <>{children}</>;
    }
    
    // Falls wir hier landen, zeige Loading (sollte nicht passieren da redirect oben)
    return (
      <ThemedView style={[styles.loadingContainer, { backgroundColor }]}>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color={primaryColor} />
          <ThemedText style={[styles.loadingText, { color: textColor }]}>
            Leite zur Anmeldung weiter...
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  // Authenticated State - User ist eingeloggt
  if (isSignedIn) {
    // Wenn auf Auth Route, zeige Loading während redirect (sollte nicht lange dauern)
    if (isPublicRoute && pathname !== '+not-found') {
      return (
        <ThemedView style={[styles.loadingContainer, { backgroundColor }]}>
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color={primaryColor} />
            <ThemedText style={[styles.loadingText, { color: textColor }]}>
              Leite zur App weiter...
            </ThemedText>
          </View>
        </ThemedView>
      );
    }
    
    // Normale App anzeigen
    return <>{children}</>;
  }

  // Fallback - sollte nie erreicht werden
  return (
    <ThemedView style={[styles.loadingContainer, { backgroundColor }]}>
      <View style={styles.loadingContent}>
        <ActivityIndicator size="large" color={primaryColor} />
        <ThemedText style={[styles.loadingText, { color: textColor }]}>
          Lade...
        </ThemedText>
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
});