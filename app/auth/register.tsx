// === Registration Screen ===
// Zweck: Neue Benutzer Registrierung mit Email und Passwort
// Features: Form validation, password confirmation, error handling

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

export default function RegisterScreen() {
  // Auth Hook für Registration
  const { signUp, isLoading } = useAuth();
  
  // Theme Colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const cardBackground = useThemeColor({ light: '#f8f9fa', dark: '#1a1a1a' }, 'background');
  const primaryColor = useThemeColor({ light: '#007AFF', dark: '#0A84FF' }, 'tint');
  const errorColor = '#FF3B30';
  const successColor = '#34C759';
  
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
        // Registration successful - navigation wird automatisch durch AuthGuard gehandelt
        console.log('Registration successful');
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
              Registrieren
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Erstellen Sie ein Konto, um Ihre Gewohnheiten zu verfolgen.
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

          {/* Display Name Input (Optional) */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: textColor }]}>
              Name <Text style={styles.optional}>(optional)</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                { 
                  borderColor: errors.displayName ? errorColor : '#ddd',
                  color: textColor,
                  backgroundColor: backgroundColor,
                }
              ]}
              placeholder="Ihr Name"
              placeholderTextColor="#999"
              value={formData.displayName}
              onChangeText={(text) => handleInputChange('displayName', text)}
              autoCapitalize="words"
              editable={!isSubmitting && !isLoading}
            />
            {errors.displayName ? (
              <Text style={[styles.fieldError, { color: errorColor }]}>
                {errors.displayName}
              </Text>
            ) : null}
          </View>

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
              placeholder="Mindestens 6 Zeichen"
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

          {/* Confirm Password Input */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: textColor }]}>Passwort bestätigen</Text>
            <TextInput
              style={[
                styles.input,
                { 
                  borderColor: errors.confirmPassword ? errorColor : '#ddd',
                  color: textColor,
                  backgroundColor: backgroundColor,
                }
              ]}
              placeholder="Passwort wiederholen"
              placeholderTextColor="#999"
              value={formData.confirmPassword}
              onChangeText={(text) => handleInputChange('confirmPassword', text)}
              secureTextEntry
              editable={!isSubmitting && !isLoading}
            />
            {errors.confirmPassword ? (
              <Text style={[styles.fieldError, { color: errorColor }]}>
                {errors.confirmPassword}
              </Text>
            ) : null}
          </View>

          {/* Register Button */}
          <TouchableOpacity
            style={[
              styles.registerButton,
              { backgroundColor: primaryColor },
              (isSubmitting || isLoading) && styles.disabledButton
            ]}
            onPress={handleRegister}
            disabled={isSubmitting || isLoading}
          >
            {isSubmitting || isLoading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.registerButtonText}>Registrieren</Text>
            )}
          </TouchableOpacity>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={[styles.loginText, { color: textColor }]}>
              Bereits ein Konto?{' '}
            </Text>
            <TouchableOpacity 
              onPress={navigateToLogin}
              disabled={isSubmitting || isLoading}
            >
              <Text style={[styles.loginLink, { color: primaryColor }]}>
                Anmelden
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
  optional: {
    fontWeight: '400',
    opacity: 0.6,
    fontSize: 14,
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
  registerButton: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  registerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
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