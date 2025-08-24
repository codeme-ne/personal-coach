// === Unit Tests für authService ===
// Zweck: Testen der Authentication Service Funktionen
// Coverage: Login, Register, Logout, Error Messages

import { authService } from './authService';
// Mock Firebase Auth
jest.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  sendEmailVerification: jest.fn(),
  updateProfile: jest.fn(),
}));

import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile
} from 'firebase/auth';

// Mock the specific functions that are used
const mockSignInWithEmailAndPassword = signInWithEmailAndPassword as jest.Mock;
const mockCreateUserWithEmailAndPassword = createUserWithEmailAndPassword as jest.Mock;
const mockSignOut = signOut as jest.Mock;
const mockSendPasswordResetEmail = sendPasswordResetEmail as jest.Mock;
const mockSendEmailVerification = sendEmailVerification as jest.Mock;
const mockUpdateProfile = updateProfile as jest.Mock;

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getErrorMessage', () => {
    it('sollte deutsche Fehlermeldung für ungültige E-Mail zurückgeben', () => {
      const error = { code: 'auth/invalid-email' };
      const message = authService.getErrorMessage(error.code);
      expect(message).toBe('Ungültige E-Mail-Adresse.');
    });

    it('sollte deutsche Fehlermeldung für schwaches Passwort zurückgeben', () => {
      const error = { code: 'auth/weak-password' };
      const message = authService.getErrorMessage(error.code);
      expect(message).toBe('Das Passwort ist zu schwach. Mindestens 6 Zeichen erforderlich.');
    });

    it('sollte deutsche Fehlermeldung für bereits verwendete E-Mail zurückgeben', () => {
      const error = { code: 'auth/email-already-in-use' };
      const message = authService.getErrorMessage(error.code);
      expect(message).toBe('Diese E-Mail-Adresse wird bereits verwendet.');
    });

    it('sollte deutsche Fehlermeldung für falsches Passwort zurückgeben', () => {
      const error = { code: 'auth/wrong-password' };
      const message = authService.getErrorMessage(error.code);
      expect(message).toBe('Falsches Passwort.');
    });

    it('sollte deutsche Fehlermeldung für nicht gefundenen Benutzer zurückgeben', () => {
      const error = { code: 'auth/user-not-found' };
      const message = authService.getErrorMessage(error.code);
      expect(message).toBe('Kein Benutzer mit dieser E-Mail-Adresse gefunden.');
    });

    it('sollte deutsche Fehlermeldung für zu viele Anfragen zurückgeben', () => {
      const error = { code: 'auth/too-many-requests' };
      const message = authService.getErrorMessage(error.code);
      expect(message).toBe('Zu viele Anmeldeversuche. Bitte versuchen Sie es später erneut.');
    });

    it('sollte deutsche Fehlermeldung für Netzwerkfehler zurückgeben', () => {
      const error = { code: 'auth/network-request-failed' };
      const message = authService.getErrorMessage(error.code);
      expect(message).toBe('Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung.');
    });

    it('sollte deutsche Fehlermeldung für ungültige Anmeldedaten zurückgeben', () => {
      const error = { code: 'auth/invalid-credential' };
      const message = authService.getErrorMessage(error.code);
      expect(message).toBe('Ungültige Anmeldedaten. Bitte überprüfen Sie E-Mail und Passwort.');
    });

    it('sollte allgemeine Fehlermeldung für unbekannte Fehler zurückgeben', () => {
      const error = { code: 'unknown-error' };
      const message = authService.getErrorMessage(error.code);
      expect(message).toBe('Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
    });

    it('sollte mit Fehlern ohne Code umgehen können', () => {
      const message = authService.getErrorMessage(undefined as any);
      expect(message).toBe('Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
    });
  });

  describe('signIn', () => {
    it('sollte erfolgreich einloggen', async () => {
      const mockUser = { 
        uid: 'test-uid', 
        email: 'test@example.com',
        displayName: null,
        emailVerified: false 
      };
      (signInWithEmailAndPassword as jest.Mock).mockResolvedValue({ 
        user: mockUser 
      });

      const result = await authService.signIn('test@example.com', 'password123');

      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.any(Object), // auth instance
        'test@example.com',
        'password123'
      );
      expect(result).toEqual({
        success: true,
        user: {
          uid: mockUser.uid,
          email: mockUser.email,
          displayName: mockUser.displayName,
          emailVerified: mockUser.emailVerified,
        },
      });
    });

    it('sollte Login-Fehler behandeln', async () => {
      const mockError = { code: 'auth/wrong-password' };
      (signInWithEmailAndPassword as jest.Mock).mockRejectedValue(mockError);

      const result = await authService.signIn('test@example.com', 'wrongpassword');

      expect(result).toEqual({
        success: false,
        error: {
          code: 'auth/wrong-password',
          message: 'Falsches Passwort.',
        },
      });
    });
  });

  describe('signUp', () => {
    it('sollte erfolgreich registrieren', async () => {
      const mockUser = { 
        uid: 'new-uid', 
        email: 'new@example.com',
        displayName: null,
        emailVerified: false 
      };
      mockCreateUserWithEmailAndPassword.mockResolvedValue({ 
        user: mockUser 
      });
      mockSendEmailVerification.mockResolvedValue(undefined);
      mockUpdateProfile.mockResolvedValue(undefined);

      const result = await authService.signUp('new@example.com', 'password123');

      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
        expect.any(Object), // auth instance
        'new@example.com',
        'password123'
      );
      expect(result).toEqual({
        success: true,
        user: {
          uid: mockUser.uid,
          email: mockUser.email,
          displayName: mockUser.displayName,
          emailVerified: mockUser.emailVerified,
        },
      });
    });

    it('sollte Registrierungs-Fehler behandeln', async () => {
      const mockError = { code: 'auth/email-already-in-use' };
      (createUserWithEmailAndPassword as jest.Mock).mockRejectedValue(mockError);

      const result = await authService.signUp('existing@example.com', 'password123');

      expect(result).toEqual({
        success: false,
        error: {
          code: 'auth/email-already-in-use',
          message: 'Diese E-Mail-Adresse wird bereits verwendet.',
        },
      });
    });

    it('sollte Validierung für schwaches Passwort durchführen', async () => {
      const mockError = { code: 'auth/weak-password' };
      (createUserWithEmailAndPassword as jest.Mock).mockRejectedValue(mockError);

      const result = await authService.signUp('test@example.com', '123');

      expect(result).toEqual({
        success: false,
        error: {
          code: 'auth/weak-password',
          message: 'Das Passwort ist zu schwach. Mindestens 6 Zeichen erforderlich.',
        },
      });
    });
  });

  describe('signOut', () => {
    it('sollte erfolgreich ausloggen', async () => {
      (signOut as jest.Mock).mockResolvedValue(undefined);

      const result = await authService.signOut();

      expect(signOut).toHaveBeenCalledWith(expect.any(Object));
      expect(result).toEqual({
        success: true,
      });
    });

    it('sollte Logout-Fehler behandeln', async () => {
      const mockError = new Error('Logout failed');
      (signOut as jest.Mock).mockRejectedValue(mockError);

      const result = await authService.signOut();

      expect(result).toEqual({
        success: false,
        error: {
          message: 'Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.',
        },
      });
    });
  });

  describe('resetPassword', () => {
    it('sollte Passwort-Reset E-Mail erfolgreich senden', async () => {
      (sendPasswordResetEmail as jest.Mock).mockResolvedValue(undefined);

      const result = await authService.resetPassword('test@example.com');

      expect(sendPasswordResetEmail).toHaveBeenCalledWith(
        expect.any(Object), // auth instance
        'test@example.com'
      );
      expect(result).toEqual({
        success: true,
      });
    });

    it('sollte Fehler beim Passwort-Reset behandeln', async () => {
      const mockError = { code: 'auth/user-not-found' };
      (sendPasswordResetEmail as jest.Mock).mockRejectedValue(mockError);

      const result = await authService.resetPassword('nonexistent@example.com');

      expect(result).toEqual({
        success: false,
        error: {
          code: 'auth/user-not-found',
          message: 'Kein Benutzer mit dieser E-Mail-Adresse gefunden.',
        },
      });
    });

    it('sollte Netzwerkfehler beim Passwort-Reset behandeln', async () => {
      const mockError = { code: 'auth/network-request-failed' };
      (sendPasswordResetEmail as jest.Mock).mockRejectedValue(mockError);

      const result = await authService.resetPassword('test@example.com');

      expect(result).toEqual({
        success: false,
        error: {
          code: 'auth/network-request-failed',
          message: 'Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung.',
        },
      });
    });
  });

  describe('getCurrentUser', () => {
    it('sollte aktuellen Benutzer zurückgeben wenn eingeloggt', () => {
      const mockUser = { uid: 'current-uid', email: 'current@example.com' };
      // Mock auth.currentUser
      Object.defineProperty(authService, 'getCurrentUser', {
        value: jest.fn(() => mockUser),
        writable: true,
      });

      const user = authService.getCurrentUser();
      expect(user).toEqual(mockUser);
    });

    it('sollte null zurückgeben wenn nicht eingeloggt', () => {
      Object.defineProperty(authService, 'getCurrentUser', {
        value: jest.fn(() => null),
        writable: true,
      });

      const user = authService.getCurrentUser();
      expect(user).toBeNull();
    });
  });
});