// === Authentication Context ===
// Zweck: Globaler Auth State für die gesamte App
// Provider: Umschließt App mit Auth State Management
// Exports: AuthContext, AuthProvider, Auth State Types

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authService, AppUser, AuthResult } from '../authService';

// Auth State Interface für Context
interface AuthState {
  user: AppUser | null;
  isLoading: boolean;
  isSignedIn: boolean;
}

// Auth Context Interface - alle verfügbaren Auth Methoden
interface AuthContextType extends AuthState {
  // Authentication Methoden
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string, displayName?: string) => Promise<AuthResult>;
  signOut: () => Promise<{ success: boolean; error?: any }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: any }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: any }>;
  deleteAccount: (password: string) => Promise<{ success: boolean; error?: any }>;
  
  // Utility Methoden
  refreshUser: () => void;
}

// Context erstellen - undefined initial state
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider Props Interface
interface AuthProviderProps {
  children: ReactNode;
}

// AuthProvider Component - umschließt App mit Auth State
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Auth State Management
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,  // Initial loading true bis Auth State geklärt
    isSignedIn: false,
  });

  // Auth State Update Helper
  const updateAuthState = (user: AppUser | null, isLoading: boolean = false) => {
    setAuthState({
      user,
      isLoading,
      isSignedIn: user !== null,
    });
  };

  // Auth State Listener Setup beim Component Mount
  useEffect(() => {
    console.log('Setting up auth state listener...');
    
    // Firebase Auth State Observer
    const unsubscribe = authService.onAuthStateChanged((user) => {
      console.log('Auth state changed:', user ? 'User signed in' : 'User signed out');
      updateAuthState(user, false);  // Loading false nach Auth State Check
    });

    // Cleanup Function für Component Unmount
    return () => {
      console.log('Cleaning up auth state listener...');
      unsubscribe();
    };
  }, []);

  // Sign In Implementation mit Loading State
  const signIn = async (email: string, password: string): Promise<AuthResult> => {
    console.log('Attempting sign in for:', email);
    updateAuthState(authState.user, true);  // Loading true während Sign In
    
    try {
      const result = await authService.signIn(email, password);
      
      if (result.success && result.user) {
        console.log('Sign in successful:', result.user.email);
        updateAuthState(result.user, false);
      } else {
        console.log('Sign in failed:', result.error?.message);
        updateAuthState(null, false);
      }
      
      return result;
    } catch (error) {
      console.error('Sign in error:', error);
      updateAuthState(null, false);
      return {
        success: false,
        error: { code: 'auth/unknown', message: 'Ein unerwarteter Fehler ist aufgetreten.' }
      };
    }
  };

  // Sign Up Implementation mit Loading State
  const signUp = async (email: string, password: string, displayName?: string): Promise<AuthResult> => {
    console.log('Attempting sign up for:', email);
    updateAuthState(authState.user, true);
    
    try {
      const result = await authService.signUp(email, password, displayName);
      
      if (result.success && result.user) {
        console.log('Sign up successful:', result.user.email);
        updateAuthState(result.user, false);
      } else {
        console.log('Sign up failed:', result.error?.message);
        updateAuthState(null, false);
      }
      
      return result;
    } catch (error) {
      console.error('Sign up error:', error);
      updateAuthState(null, false);
      return {
        success: false,
        error: { code: 'auth/unknown', message: 'Ein unerwarteter Fehler ist aufgetreten.' }
      };
    }
  };

  // Sign Out Implementation
  const signOut = async () => {
    console.log('Attempting sign out...');
    updateAuthState(authState.user, true);
    
    try {
      const result = await authService.signOut();
      
      if (result.success) {
        console.log('Sign out successful');
        updateAuthState(null, false);
      } else {
        console.log('Sign out failed:', result.error?.message);
        updateAuthState(authState.user, false);  // Restore user state on failure
      }
      
      return result;
    } catch (error) {
      console.error('Sign out error:', error);
      updateAuthState(authState.user, false);
      return {
        success: false,
        error: { code: 'auth/unknown', message: 'Fehler beim Abmelden.' }
      };
    }
  };

  // Password Reset Implementation (kein Loading State da User bleibt eingeloggt)
  const resetPassword = async (email: string) => {
    console.log('Attempting password reset for:', email);
    
    try {
      const result = await authService.resetPassword(email);
      
      if (result.success) {
        console.log('Password reset email sent');
      } else {
        console.log('Password reset failed:', result.error?.message);
      }
      
      return result;
    } catch (error) {
      console.error('Password reset error:', error);
      return {
        success: false,
        error: { code: 'auth/unknown', message: 'Fehler beim Passwort-Reset.' }
      };
    }
  };

  // Change Password Implementation
  const changePassword = async (currentPassword: string, newPassword: string) => {
    console.log('Attempting password change...');
    
    try {
      const result = await authService.changePassword(currentPassword, newPassword);
      
      if (result.success) {
        console.log('Password changed successfully');
      } else {
        console.log('Password change failed:', result.error?.message);
      }
      
      return result;
    } catch (error) {
      console.error('Password change error:', error);
      return {
        success: false,
        error: { code: 'auth/unknown', message: 'Fehler beim Passwort ändern.' }
      };
    }
  };

  // Delete Account Implementation
  const deleteAccount = async (password: string) => {
    console.log('Attempting account deletion...');
    updateAuthState(authState.user, true);
    
    try {
      const result = await authService.deleteAccount(password);
      
      if (result.success) {
        console.log('Account deleted successfully');
        updateAuthState(null, false);
      } else {
        console.log('Account deletion failed:', result.error?.message);
        updateAuthState(authState.user, false);
      }
      
      return result;
    } catch (error) {
      console.error('Account deletion error:', error);
      updateAuthState(authState.user, false);
      return {
        success: false,
        error: { code: 'auth/unknown', message: 'Fehler beim Account löschen.' }
      };
    }
  };

  // Refresh User Data from Firebase
  const refreshUser = () => {
    console.log('Refreshing user data...');
    const currentUser = authService.getCurrentUser();
    updateAuthState(currentUser, false);
  };

  // Context Value mit allen Auth Funktionen
  const contextValue: AuthContextType = {
    // State
    user: authState.user,
    isLoading: authState.isLoading,
    isSignedIn: authState.isSignedIn,
    
    // Methods
    signIn,
    signUp,
    signOut,
    resetPassword,
    changePassword,
    deleteAccount,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom Hook für Auth Context Zugriff
export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  
  return context;
};