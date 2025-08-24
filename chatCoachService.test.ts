// === Unit Tests für chatCoachService Cloud Function Integration ===
// Zweck: Testen der neuen Firebase Cloud Function Integration
// Coverage: Cloud Function calls, Fallback, Response Source Tracking

import { chatCoachService } from './chatCoachService';

// Mock Firebase Functions
jest.mock('firebase/functions', () => ({
  getFunctions: jest.fn(() => ({})),
  httpsCallable: jest.fn(),
}));

// Mock Firebase Auth
jest.mock('./config/firebase', () => ({
  auth: {
    currentUser: { uid: 'test-user-123' }
  }
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock useHabitStore
jest.mock('./stores/habitStore', () => ({
  useHabitStore: jest.fn(),
}));

import { httpsCallable } from 'firebase/functions';
const mockHttpsCallable = httpsCallable as jest.Mock;

describe('ChatCoachService Cloud Function Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateResponse', () => {
    it('should call cloud function first and track source as cloud', async () => {
      // Arrange
      const mockCloudFunction = jest.fn().mockResolvedValue({
        data: { text: 'Cloud response', source: 'cloud' }
      });
      mockHttpsCallable.mockReturnValue(mockCloudFunction);

      // Act
      const response = await chatCoachService.generateResponse('Hello');

      // Assert
      expect(mockCloudFunction).toHaveBeenCalledWith({
        message: 'Hello',
        chatHistory: [],
        language: 'de'
      });
      expect(response).toContain('Cloud response');
      expect(chatCoachService.getLastResponseSource()).toBe('cloud');
    });

    it('should fallback to local response when cloud function fails', async () => {
      // Arrange
      const mockCloudFunction = jest.fn().mockRejectedValue(new Error('Network error'));
      mockHttpsCallable.mockReturnValue(mockCloudFunction);

      // Act
      const response = await chatCoachService.generateResponse('Hello');

      // Assert
      expect(mockCloudFunction).toHaveBeenCalled();
      expect(response).toBeTruthy(); // Should get fallback response
      expect(chatCoachService.getLastResponseSource()).toBe('fallback');
    });
  });

  describe('getAPIStatus', () => {
    it('should return cloud and fallback status', () => {
      // Act
      const status = chatCoachService.getAPIStatus();

      // Assert
      expect(status).toEqual({
        cloud: true, // User is authenticated
        fallback: true // Always available
      });
      expect(status).not.toHaveProperty('huggingface');
      expect(status).not.toHaveProperty('together');
    });
  });

  describe('getLastResponseSource', () => {
    it('should return fallback by default', () => {
      // Act
      const source = chatCoachService.getLastResponseSource();

      // Assert
      expect(source).toBe('fallback');
    });
  });
});