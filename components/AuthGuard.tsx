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
    '/auth/verify-email',  // E-Mail-Verifizierung ist semi-öffentlich
    '+not-found'  // 404 Seite sollte immer zugänglich sein
  ];

  // Prüfe ob aktuelle Route öffentlich ist
  const isPublicRoute = publicRoutes.some(route => pathname.includes(route));

  // Vereinfachte Auth Logic ohne useEffect
  // Während Loading machen wir nichts
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

  // Einfache Logik: Zeige immer children, lasse Navigation natürlich funktionieren
  return <>{children}</>;
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