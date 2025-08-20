// === Login Screen ===
// Zweck: Benutzer Anmeldung mit Email und Passwort
// Features: Form validation, error handling, navigation zu Register/Reset

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';
import { useThemeColor } from '../../hooks/useThemeColor';

export default function LoginScreen() {
  // Auth Hook für Login Funktionalität
  const { signIn, isLoading } = useAuth();
  
  // Theme Colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const cardBackground = useThemeColor({ light: '#f8f9fa', dark: '#1a1a1a' }, 'background');
  const primaryColor = useThemeColor({ light: '#007AFF', dark: '#0A84FF' }, 'tint');
  const errorColor = '#FF3B30';
  
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
        // Login successful - navigation wird automatisch durch AuthGuard gehandelt
        console.log('Login successful');
      } else {
        // Show error message
        setErrors({
          ...errors,
          general: result.error?.message || 'Anmeldung fehlgeschlagen',
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrors({
        ...errors,
        general: 'Ein unerwarteter Fehler ist aufgetreten',
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
              Anmelden
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Willkommen zurück! Melden Sie sich an, um Ihre Gewohnheiten zu verfolgen.
            </ThemedText>
          </View>

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
              value={formData.email}
              onChangeText={(text) => handleInputChange('email', text)}
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

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: textColor }]}>Passwort</Text>
            <TextInput
              style={[
                styles.input,
                { 
                  borderColor: errors.password ? errorColor : '#ddd',
                  color: textColor,
                  backgroundColor: backgroundColor,
                }
              ]}
              placeholder="Ihr Passwort"
              placeholderTextColor="#999"
              value={formData.password}
              onChangeText={(text) => handleInputChange('password', text)}
              secureTextEntry
              editable={!isSubmitting && !isLoading}
            />
            {errors.password ? (
              <Text style={[styles.fieldError, { color: errorColor }]}>
                {errors.password}
              </Text>
            ) : null}
          </View>

          {/* Forgot Password Link */}
          <TouchableOpacity 
            onPress={navigateToForgotPassword}
            style={styles.forgotPasswordContainer}
            disabled={isSubmitting || isLoading}
          >
            <Text style={[styles.forgotPasswordText, { color: primaryColor }]}>
              Passwort vergessen?
            </Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            style={[
              styles.loginButton,
              { backgroundColor: primaryColor },
              (isSubmitting || isLoading) && styles.disabledButton
            ]}
            onPress={handleLogin}
            disabled={isSubmitting || isLoading}
          >
            {isSubmitting || isLoading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.loginButtonText}>Anmelden</Text>
            )}
          </TouchableOpacity>

          {/* Register Link */}
          <View style={styles.registerContainer}>
            <Text style={[styles.registerText, { color: textColor }]}>
              Noch kein Konto?{' '}
            </Text>
            <TouchableOpacity 
              onPress={navigateToRegister}
              disabled={isSubmitting || isLoading}
            >
              <Text style={[styles.registerLink, { color: primaryColor }]}>
                Registrieren
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
  inputContainer: {
    marginBottom: 20,
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
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '500',
  },
  loginButton: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  disabledButton: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
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