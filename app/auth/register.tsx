// === Registration Screen ===
// Zweck: Neue Benutzer Registrierung mit Email und Passwort
// Features: Form validation, password confirmation, error handling

import React, { useState } from 'react';
import {
  View,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../authService';
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useColorScheme } from '../../hooks/useColorScheme';
import { Colors } from '../../constants/Colors';

export default function RegisterScreen() {
  // Auth Hook für Registration
  const { signUp, isLoading } = useAuth();
  
  // Theme
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // Theme colors
  const backgroundColor = Colors[colorScheme ?? 'light'].background;
  const cardBackground = Colors[colorScheme ?? 'light'].background;
  const textColor = Colors[colorScheme ?? 'light'].text;
  const primaryColor = Colors[colorScheme ?? 'light'].tint;
  const errorColor = '#EF4444';
  
  // Form State
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
  });
  
  // Error State
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    general: '',
  });
  
  // Loading State
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Validation
  const validateForm = (): boolean => {
    const newErrors = {
      email: '',
      password: '',
      confirmPassword: '',
      displayName: '',
      general: '',
    };
    let isValid = true;

    // Email Validation
    if (!formData.email.trim()) {
      newErrors.email = 'E-Mail ist erforderlich';
      isValid = false;
    } else if (!authService.isValidEmail(formData.email.trim())) {
      newErrors.email = 'Ungültige E-Mail-Adresse';
      isValid = false;
    }

    // Password Validation
    const passwordValidation = authService.isValidPassword(formData.password);
    if (!passwordValidation.valid) {
      newErrors.password = passwordValidation.message || 'Ungültiges Passwort';
      isValid = false;
    }

    // Confirm Password Validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwort bestätigen ist erforderlich';
      isValid = false;
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwörter stimmen nicht überein';
      isValid = false;
    }

    // Display Name Validation (optional aber wenn angegeben, dann mindestens 2 Zeichen)
    if (formData.displayName.trim() && formData.displayName.trim().length < 2) {
      newErrors.displayName = 'Name muss mindestens 2 Zeichen lang sein';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Handle Registration Submit
  const handleRegister = async () => {
    // Clear previous errors
    setErrors({
      email: '',
      password: '',
      confirmPassword: '',
      displayName: '',
      general: '',
    });
    
    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const displayName = formData.displayName.trim() || undefined;
      const result = await signUp(
        formData.email.trim(),
        formData.password,
        displayName
      );
      
      if (result.success) {
        // Registration successful - redirect to email verification
        console.log('Registration successful, redirecting to email verification');
        router.replace('/auth/verify-email');
      } else {
        // Show error message
        setErrors({
          ...errors,
          general: result.error?.message || 'Registrierung fehlgeschlagen',
        });
      }
    } catch (error) {
      console.error('Registration error:', error);
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

  // Navigation zurück zu Login
  const navigateToLogin = () => {
    router.push('/auth/login');
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
              Registrieren
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Erstellen Sie ein Konto, um Ihre Gewohnheiten zu verfolgen.
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

          {/* Display Name Input (Optional) */}
          <Input
            label="Name (optional)"
            placeholder="Ihr Name"
            value={formData.displayName}
            onChangeText={(text) => handleInputChange('displayName', text)}
            error={errors.displayName}
            autoCapitalize="words"
            disabled={isSubmitting || isLoading}
          />

          {/* Email Input */}
          <Input
            label="E-Mail"
            placeholder="ihre@email.com"
            value={formData.email}
            onChangeText={(text) => handleInputChange('email', text)}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            disabled={isSubmitting || isLoading}
            required
          />

          {/* Password Input */}
          <Input
            label="Passwort"
            placeholder="Mindestens 6 Zeichen"
            value={formData.password}
            onChangeText={(text) => handleInputChange('password', text)}
            error={errors.password}
            secureTextEntry
            disabled={isSubmitting || isLoading}
            required
          />

          {/* Confirm Password Input */}
          <Input
            label="Passwort bestätigen"
            placeholder="Passwort wiederholen"
            value={formData.confirmPassword}
            onChangeText={(text) => handleInputChange('confirmPassword', text)}
            error={errors.confirmPassword}
            secureTextEntry
            disabled={isSubmitting || isLoading}
            required
          />

          {/* Register Button */}
          <Button
            onPress={handleRegister}
            disabled={isSubmitting || isLoading}
            style={styles.registerButton}
          >
            {isSubmitting || isLoading ? 'Registriere...' : 'Registrieren'}
          </Button>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <ThemedText style={styles.loginText}>
              Bereits ein Konto?{' '}
            </ThemedText>
            <TouchableOpacity 
              onPress={navigateToLogin}
              disabled={isSubmitting || isLoading}
            >
              <ThemedText style={[styles.loginLink, { color: primaryColor }]}>
                Anmelden
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
  registerButton: {
    marginTop: 8,
    marginBottom: 24,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '600',
  },
});

