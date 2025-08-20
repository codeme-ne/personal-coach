// === Authentication Service ===
// Zweck: Zentrale Authentifizierung für Firebase Auth
// Methoden: Sign up, Sign in, Sign out, Password reset, User state management

import {
    createUserWithEmailAndPassword,
    deleteUser,
    EmailAuthProvider,
    onAuthStateChanged,
    reauthenticateWithCredential,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signOut,
    updatePassword,
    updateProfile,
    User,
} from 'firebase/auth';
import { auth } from './config/firebase';

// Auth Error Types für bessere Typisierung
export interface AuthError {
  code: string;
  message: string;
}

// User Interface für App-spezifische User Daten
export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
}

// Auth Result Interface
export interface AuthResult {
  success: boolean;
  user?: AppUser;
  error?: AuthError;
}

export const authService = {
  // Benutzer registrieren mit Email und Passwort
  async signUp(email: string, password: string, displayName?: string): Promise<AuthResult> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Optional: Display Name setzen
      if (displayName && displayName.trim()) {
        await updateProfile(user, { displayName: displayName.trim() });
      }

      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || displayName || null,
          emailVerified: user.emailVerified,
        },
      };
    } catch (error: any) {
      console.error('Sign up error:', error);
      return {
        success: false,
        error: {
          code: error.code,
          message: this.getErrorMessage(error.code),
        },
      };
    }
  },

  // Benutzer anmelden mit Email und Passwort
  async signIn(email: string, password: string): Promise<AuthResult> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          emailVerified: user.emailVerified,
        },
      };
    } catch (error: any) {
      console.error('Sign in error:', error);
      return {
        success: false,
        error: {
          code: error.code,
          message: this.getErrorMessage(error.code),
        },
      };
    }
  },

  // Benutzer abmelden
  async signOut(): Promise<{ success: boolean; error?: AuthError }> {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error: any) {
      console.error('Sign out error:', error);
      return {
        success: false,
        error: {
          code: error.code,
          message: this.getErrorMessage(error.code),
        },
      };
    }
  },

  // Passwort zurücksetzen per Email
  async resetPassword(email: string): Promise<{ success: boolean; error?: AuthError }> {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error: any) {
      console.error('Password reset error:', error);
      return {
        success: false,
        error: {
          code: error.code,
          message: this.getErrorMessage(error.code),
        },
      };
    }
  },

  // Passwort des aktuellen Benutzers ändern
  async changePassword(
    currentPassword: string, 
    newPassword: string
  ): Promise<{ success: boolean; error?: AuthError }> {
    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        return {
          success: false,
          error: {
            code: 'auth/user-not-found',
            message: 'Benutzer nicht gefunden. Bitte erneut anmelden.',
          },
        };
      }

      // Re-authentifizierung erforderlich für sensible Operationen
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // Neues Passwort setzen
      await updatePassword(user, newPassword);
      
      return { success: true };
    } catch (error: any) {
      console.error('Change password error:', error);
      return {
        success: false,
        error: {
          code: error.code,
          message: this.getErrorMessage(error.code),
        },
      };
    }
  },

  // Account löschen (mit Re-Authentifizierung)
  async deleteAccount(password: string): Promise<{ success: boolean; error?: AuthError }> {
    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        return {
          success: false,
          error: {
            code: 'auth/user-not-found',
            message: 'Benutzer nicht gefunden. Bitte erneut anmelden.',
          },
        };
      }

      // Re-authentifizierung vor Account-Löschung
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
      
      // Account löschen
      await deleteUser(user);
      
      return { success: true };
    } catch (error: any) {
      console.error('Delete account error:', error);
      return {
        success: false,
        error: {
          code: error.code,
          message: this.getErrorMessage(error.code),
        },
      };
    }
  },

  // Aktueller Benutzer (synchron)
  getCurrentUser(): AppUser | null {
    const user = auth.currentUser;
    if (!user) return null;

    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      emailVerified: user.emailVerified,
    };
  },

  // Auth State Listener für React Components
  onAuthStateChanged(callback: (user: AppUser | null) => void): () => void {
    return onAuthStateChanged(auth, (firebaseUser: User | null) => {
      if (firebaseUser) {
        const appUser: AppUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          emailVerified: firebaseUser.emailVerified,
        };
        callback(appUser);
      } else {
        callback(null);
      }
    });
  },

  // Benutzerfreundliche Fehlermeldungen
  getErrorMessage(errorCode: string): string {
    switch (errorCode) {
      // Registrierung Fehler
      case 'auth/email-already-in-use':
        return 'Diese E-Mail-Adresse wird bereits verwendet.';
      case 'auth/weak-password':
        return 'Das Passwort ist zu schwach. Mindestens 6 Zeichen erforderlich.';
      case 'auth/invalid-email':
        return 'Ungültige E-Mail-Adresse.';
      
      // Anmeldung Fehler
      case 'auth/user-not-found':
        return 'Kein Benutzer mit dieser E-Mail-Adresse gefunden.';
      case 'auth/wrong-password':
        return 'Falsches Passwort.';
      case 'auth/invalid-credential':
        return 'Ungültige Anmeldedaten. Bitte überprüfen Sie E-Mail und Passwort.';
      case 'auth/too-many-requests':
        return 'Zu viele Anmeldeversuche. Bitte versuchen Sie es später erneut.';
      case 'auth/user-disabled':
        return 'Dieses Benutzerkonto wurde deaktiviert.';
      
      // Passwort Reset Fehler
      case 'auth/missing-email':
        return 'E-Mail-Adresse ist erforderlich.';
      
      // Netzwerk Fehler
      case 'auth/network-request-failed':
        return 'Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung.';
      
      // Re-Auth Fehler
      case 'auth/requires-recent-login':
        return 'Bitte melden Sie sich erneut an, um diese Aktion durchzuführen.';
      
      // Standard Fehler
      default:
        return 'Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.';
    }
  },

  // Email Validierung (Frontend)
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Passwort Validierung (Frontend)
  isValidPassword(password: string): { valid: boolean; message?: string } {
    if (password.length < 6) {
      return { valid: false, message: 'Passwort muss mindestens 6 Zeichen lang sein.' };
    }
    if (password.length > 128) {
      return { valid: false, message: 'Passwort darf nicht länger als 128 Zeichen sein.' };
    }
    return { valid: true };
  },
};