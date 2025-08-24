import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Platform, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuthContext } from '@/contexts/AuthContext';
import { authService } from '@/authService';
import { auth } from '@/config/firebase';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function VerifyEmailScreen() {
  const colorScheme = useColorScheme();
  const { user, signOut } = useAuthContext();
  const [isResending, setIsResending] = useState(false);
  const [checkingVerification, setCheckingVerification] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    // Redirect wenn User verifiziert ist
    if (user?.emailVerified) {
      router.replace('/(tabs)');
    }
  }, [user]);

  useEffect(() => {
    // Cooldown Timer für Resend Button
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleResendEmail = async () => {
    setIsResending(true);
    try {
      const result = await authService.resendVerificationEmail();
      if (result.success) {
        if (Platform.OS === 'web') {
          window.alert('Verifizierungs-E-Mail wurde erneut gesendet!');
        } else {
          Alert.alert('Erfolg', 'Verifizierungs-E-Mail wurde erneut gesendet!');
        }
        setResendCooldown(60); // 60 Sekunden Cooldown
      } else {
        if (Platform.OS === 'web') {
          window.alert(result.error?.message || 'Fehler beim Senden der E-Mail');
        } else {
          Alert.alert('Fehler', result.error?.message || 'Fehler beim Senden der E-Mail');
        }
      }
    } catch (error) {
      console.error('Error resending email:', error);
      if (Platform.OS === 'web') {
        window.alert('Ein unerwarteter Fehler ist aufgetreten');
      } else {
        Alert.alert('Fehler', 'Ein unerwarteter Fehler ist aufgetreten');
      }
    } finally {
      setIsResending(false);
    }
  };

  const handleCheckVerification = async () => {
    setCheckingVerification(true);
    try {
      // Reload user auth state
      const currentUser = authService.getCurrentUser();
      if (currentUser?.emailVerified) {
        router.replace('/(tabs)');
      } else {
        // Force reload auth state
        await auth.currentUser?.reload();
        const updatedUser = authService.getCurrentUser();
        if (updatedUser?.emailVerified) {
          router.replace('/(tabs)');
        } else {
          if (Platform.OS === 'web') {
            window.alert('E-Mail noch nicht verifiziert. Bitte überprüfe deinen Posteingang.');
          } else {
            Alert.alert('Noch nicht verifiziert', 'Bitte überprüfe deinen Posteingang und klicke auf den Verifizierungslink.');
          }
        }
      }
    } catch (error) {
      console.error('Error checking verification:', error);
    } finally {
      setCheckingVerification(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/auth/login');
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <MaterialIcons 
            name="mark-email-unread" 
            size={80} 
            color={Colors[colorScheme ?? 'light'].tint} 
          />
        </View>

        <ThemedText style={styles.title}>
          E-Mail-Verifizierung erforderlich
        </ThemedText>

        <ThemedText style={styles.description}>
          Wir haben eine Bestätigungs-E-Mail an {user?.email} gesendet.
        </ThemedText>

        <ThemedText style={styles.instructions}>
          Bitte überprüfe deinen Posteingang und klicke auf den Verifizierungslink, um fortzufahren.
        </ThemedText>

        <View style={styles.buttonContainer}>
          <Button
            onPress={handleCheckVerification}
            disabled={checkingVerification}
            style={[styles.button, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}
          >
            {checkingVerification ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <ThemedText style={styles.buttonText}>
                Ich habe meine E-Mail verifiziert
              </ThemedText>
            )}
          </Button>

          <Button
            onPress={handleResendEmail}
            disabled={isResending || resendCooldown > 0}
            variant="secondary"
            style={styles.button}
          >
            {isResending ? (
              <ActivityIndicator size="small" color={Colors[colorScheme ?? 'light'].tint} />
            ) : (
              <ThemedText style={[styles.buttonTextSecondary, { color: Colors[colorScheme ?? 'light'].tint }]}>
                {resendCooldown > 0 
                  ? `E-Mail erneut senden (${resendCooldown}s)`
                  : 'E-Mail erneut senden'
                }
              </ThemedText>
            )}
          </Button>

          <Button
            onPress={handleSignOut}
            variant="secondary"
            style={[styles.button, styles.signOutButton]}
          >
            <ThemedText style={styles.signOutText}>
              Abmelden
            </ThemedText>
          </Button>
        </View>

        <View style={styles.helpContainer}>
          <ThemedText style={styles.helpText}>
            Keine E-Mail erhalten?
          </ThemedText>
          <ThemedText style={styles.helpSubtext}>
            Überprüfe deinen Spam-Ordner oder versuche es mit einer anderen E-Mail-Adresse.
          </ThemedText>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  content: {
    padding: 24,
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  iconContainer: {
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center',
    opacity: 0.8,
  },
  instructions: {
    fontSize: 14,
    marginBottom: 32,
    textAlign: 'center',
    opacity: 0.7,
    paddingHorizontal: 20,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 8,
    width: '100%',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonTextSecondary: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  signOutButton: {
    marginTop: 8,
    borderColor: '#999',
    borderWidth: 1,
  },
  signOutText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  helpContainer: {
    marginTop: 32,
    alignItems: 'center',
  },
  helpText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  helpSubtext: {
    fontSize: 12,
    opacity: 0.6,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});