// === Password Reset Screen ===
// Zweck: Passwort zurücksetzen per E-Mail
// Features: Email validation, success feedback, zurück zu Login

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../authService';
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';
import { useThemeColor } from '../../hooks/useThemeColor';

export default function ForgotPasswordScreen() {
  // Auth Hook für Password Reset
  const { resetPassword, isLoading } = useAuth();
  
  // Theme Colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const cardBackground = useThemeColor({ light: '#f8f9fa', dark: '#1a1a1a' }, 'background');
  const primaryColor = useThemeColor({ light: '#10B981', dark: '#34D399' }, 'tint'); // Grün statt Blau
  const errorColor = '#FF3B30';
  const successColor = '#10B981'; // Grün für Success
  
  // Form State
  const [email, setEmail] = useState('');
  
  // UI State
  const [errors, setErrors] = useState({
    email: '',
    general: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Email Validation
  const validateEmail = (): boolean => {
    const newErrors = { email: '', general: '' };
    let isValid = true;

    if (!email.trim()) {
      newErrors.email = 'E-Mail ist erforderlich';
      isValid = false;
    } else if (!authService.isValidEmail(email.trim())) {
      newErrors.email = 'Ungültige E-Mail-Adresse';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Handle Password Reset Submit
  const handlePasswordReset = async () => {
    // Clear previous errors and success state
    setErrors({ email: '', general: '' });
    setIsSuccess(false);
    
    // Validate email
    if (!validateEmail()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await resetPassword(email.trim());
      
      if (result.success) {
        // Reset email sent successfully
        setIsSuccess(true);
        console.log('Password reset email sent');
      } else {
        // Show error message
        setErrors({
          ...errors,
          general: result.error?.message || 'Fehler beim Senden der E-Mail',
        });
      }
    } catch (error) {
      console.error('Password reset error:', error);
      setErrors({
        ...errors,
        general: 'Ein unerwarteter Fehler ist aufgetreten',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Email Input Change
  const handleEmailChange = (text: string) => {
    setEmail(text);
    
    // Clear email error when user starts typing
    if (errors.email) {
      setErrors(prev => ({ ...prev, email: '' }));
    }
    
    // Reset success state when user changes email
    if (isSuccess) {
      setIsSuccess(false);
    }
  };

  // Navigation zurück zu Login
  const navigateToLogin = () => {
    router.push('/auth/login');
  };

  // Try Again - reset form
  const tryAgain = () => {
    setEmail('');
    setErrors({ email: '', general: '' });
    setIsSuccess(false);
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor }]}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <ThemedView style={[styles.card, { backgroundColor: cardBackground }]}>
          {/* Header */}
          <View style={styles.header}>
            <ThemedText type="title" style={styles.title}>
              Passwort vergessen?
            </ThemedText>
            {!isSuccess && (
              <ThemedText style={styles.subtitle}>
                Geben Sie Ihre E-Mail-Adresse ein, um Ihr Passwort zurückzusetzen.
              </ThemedText>
            )}
          </View>

          {/* Success State */}
          {isSuccess ? (
            <View>
              {/* Success Message */}
              <View style={[styles.successContainer, { backgroundColor: `${successColor}15`, borderColor: successColor }]}>
                <Text style={styles.successTitle}>
                  ✓ E-Mail erfolgreich gesendet!
                </Text>
                <Text style={[styles.successText, { color: textColor }]}>
                  Wir haben Ihnen eine E-Mail mit Anweisungen zum Zurücksetzen Ihres Passworts gesendet.
                </Text>
              </View>

              <View style={styles.successInstructions}>
                <ThemedText style={styles.instructionText}>
                  • Prüfen Sie Ihren Posteingang
                </ThemedText>
                <ThemedText style={styles.instructionText}>
                  • Schauen Sie auch im Spam-Ordner nach
                </ThemedText>
                <ThemedText style={styles.instructionText}>
                  • Folgen Sie den Anweisungen in der E-Mail
                </ThemedText>
              </View>

              {/* Try Again Button */}
              <TouchableOpacity
                style={[styles.secondaryButton, { borderColor: primaryColor }]}
                onPress={tryAgain}
                disabled={isSubmitting || isLoading}
              >
                <Text style={[styles.secondaryButtonText, { color: primaryColor }]}>
                  Andere E-Mail verwenden
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              {/* General Error Message */}
              {errors.general ? (
                <View style={[styles.errorContainer, { borderColor: errorColor }]}>
                  <Text style={[styles.errorText, { color: errorColor }]}>
                    {errors.general}
                  </Text>
                </View>
              ) : null}

              {/* Email Input */}
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: textColor }]}>E-Mail</Text>
                <TextInput
                  style={[
                    styles.input,
                    { 
                      borderColor: errors.email ? errorColor : '#ddd',
                      color: textColor,
                      backgroundColor: backgroundColor,
                    }
                  ]}
                  placeholder="ihre@email.com"
                  placeholderTextColor="#999"
                  value={email}
                  onChangeText={handleEmailChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isSubmitting && !isLoading}
                />
                {errors.email ? (
                  <Text style={[styles.fieldError, { color: errorColor }]}>
                    {errors.email}
                  </Text>
                ) : null}
              </View>

              {/* Reset Button */}
              <TouchableOpacity
                style={[
                  styles.resetButton,
                  { backgroundColor: primaryColor },
                  (isSubmitting || isLoading) && styles.disabledButton
                ]}
                onPress={handlePasswordReset}
                disabled={isSubmitting || isLoading}
              >
                {isSubmitting || isLoading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.resetButtonText}>E-Mail senden</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Back to Login Link */}
          <View style={styles.loginContainer}>
            <TouchableOpacity 
              onPress={navigateToLogin}
              disabled={isSubmitting || isLoading}
            >
              <Text style={[styles.loginLink, { color: primaryColor }]}>
                ← Zurück zur Anmeldung
              </Text>
            </TouchableOpacity>
          </View>
        </ThemedView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 22,
  },
  errorContainer: {
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  successContainer: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 18,
    textAlign: 'center',
    fontWeight: '600',
    color: '#10B981',
    marginBottom: 8,
  },
  successText: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '400',
    lineHeight: 20,
    opacity: 0.8,
  },
  successInstructions: {
    marginBottom: 24,
    paddingLeft: 8,
  },
  instructionText: {
    fontSize: 14,
    marginBottom: 8,
    opacity: 0.8,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
  },
  fieldError: {
    fontSize: 14,
    marginTop: 4,
    fontWeight: '500',
  },
  resetButton: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  secondaryButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: 'transparent',
  },
  disabledButton: {
    opacity: 0.6,
  },
  resetButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  loginContainer: {
    alignItems: 'center',
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '600',
  },
});