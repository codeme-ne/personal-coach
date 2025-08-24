// === Login Screen ===
// Zweck: Benutzer Anmeldung mit Email und Passwort
// Features: Form validation, error handling, navigation zu Register/Reset

import React, { useState } from 'react';
import {
  View,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { useFeedback } from '../../contexts/FeedbackContext';
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useColorScheme } from '../../hooks/useColorScheme';
import { Colors } from '../../constants/Colors';

export default function LoginScreen() {
  // Auth Hook für Login Funktionalität
  const { signIn, isLoading } = useAuth();
  
  // Feedback Hook für Toast-Nachrichten
  const { showSuccess, showError } = useFeedback();
  
  // Theme
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // Theme colors
  const primaryColor = Colors[colorScheme ?? 'light'].tint;
  
  // Form State
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  
  // Error State
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    general: '',
  });
  
  // Loading State für Submit Button
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Validation
  const validateForm = (): boolean => {
    const newErrors = { email: '', password: '', general: '' };
    let isValid = true;

    // Email Validation
    if (!formData.email.trim()) {
      newErrors.email = 'E-Mail ist erforderlich';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Ungültige E-Mail-Adresse';
      isValid = false;
    }

    // Password Validation
    if (!formData.password) {
      newErrors.password = 'Passwort ist erforderlich';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Handle Login Submit
  const handleLogin = async () => {
    // Clear previous errors
    setErrors({ email: '', password: '', general: '' });
    
    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await signIn(formData.email.trim(), formData.password);
      
      if (result.success) {
        // Login successful - redirect to main app
        showSuccess('Erfolgreich angemeldet! Willkommen zurück.');
        router.replace('/(tabs)');
      } else {
        // Show error message als Toast
        const errorMsg = result.error?.message || 'Anmeldung fehlgeschlagen';
        showError(errorMsg);
        setErrors({
          ...errors,
          general: errorMsg,
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMsg = 'Ein unerwarteter Fehler ist aufgetreten';
      showError(errorMsg);
      setErrors({
        ...errors,
        general: errorMsg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Input Changes
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear specific field error when user starts typing
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Navigation zu Registration
  const navigateToRegister = () => {
    router.push('/auth/register');
  };

  // Navigation zu Password Reset
  const navigateToForgotPassword = () => {
    router.push('/auth/forgot-password');
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <ThemedView style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <ThemedText type="title" style={styles.title}>
              Anmelden
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Willkommen zurück! Melden Sie sich an, um Ihre Gewohnheiten zu verfolgen.
            </ThemedText>
          </View>

          {/* General Error Message */}
          {errors.general && (
            <View style={styles.errorContainer}>
              <ThemedText style={styles.errorText}>
                {errors.general}
              </ThemedText>
            </View>
          )}

          {/* Email Input */}
          <Input
            label="E-Mail"
            placeholder="ihre@email.com"
            value={formData.email}
            onChangeText={(text) => handleInputChange('email', text)}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            disabled={isSubmitting || isLoading}
            error={errors.email}
            required
          />

          {/* Password Input */}
          <Input
            label="Passwort"
            placeholder="Ihr Passwort"
            value={formData.password}
            onChangeText={(text) => handleInputChange('password', text)}
            secureTextEntry
            disabled={isSubmitting || isLoading}
            error={errors.password}
            required
          />

          {/* Forgot Password Link */}
          <View style={styles.forgotPasswordContainer}>
            <TouchableOpacity 
              onPress={navigateToForgotPassword}
              disabled={isSubmitting || isLoading}
            >
              <ThemedText style={[styles.forgotPasswordLink, { color: primaryColor }]}>
                Passwort vergessen?
              </ThemedText>
            </TouchableOpacity>
          </View>

          {/* Login Button */}
          <Button
            onPress={handleLogin}
            disabled={isSubmitting || isLoading}
            style={styles.loginButton}
          >
            {isSubmitting || isLoading ? 'Anmeldung...' : 'Anmelden'}
          </Button>

          {/* Register Link */}
          <View style={styles.registerContainer}>
            <ThemedText style={styles.registerText}>
              Noch kein Konto?{' '}
            </ThemedText>
            <TouchableOpacity 
              onPress={navigateToRegister}
              disabled={isSubmitting || isLoading}
            >
              <ThemedText style={[styles.registerLink, { color: primaryColor }]}>
                Registrieren
              </ThemedText>
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
    backgroundColor: '#F7F8F9',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 22,
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '500',
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordLink: {
    fontSize: 14,
    fontWeight: '500',
  },
  loginButton: {
    marginBottom: 24,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    fontSize: 14,
  },
  registerLink: {
    fontSize: 14,
    fontWeight: '600',
  },
});

