// === Jest Konfiguration für Personal Coach App ===
// Zweck: Test-Framework Setup mit Mocks für externe Dependencies
// Features: React Native Testing, Firebase Mocks, AsyncStorage Mocks

module.exports = {
  // Verwende jest-expo preset für React Native/Expo Testing
  preset: 'jest-expo',
  
  // Test-Umgebung
  testEnvironment: 'node',
  
  // Transformiere TypeScript und JSX
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  
  // Module Datei-Endungen
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Module Name Mapper für Path Aliases
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '\\.(css|less|scss|sass)$': '<rootDir>/__mocks__/styleMock.js',
  },
  
  // Setup Files nach Environment
  setupFilesAfterEnv: [
    '@testing-library/jest-native/extend-expect',
    '<rootDir>/jest.setup.js',
  ],
  
  // Coverage Konfiguration
  collectCoverageFrom: [
    '**/*.{ts,tsx}',
    '!**/node_modules/**',
    '!**/vendor/**',
    '!**/.expo/**',
    '!**/coverage/**',
    '!**/firebase/functions/**',
    '!**/scripts/**',
    '!**/*.config.js',
    '!**/*.config.ts',
  ],
  
  // Coverage Thresholds
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 70,
      statements: 70,
    },
  },
  
  // Test Match Patterns
  testMatch: [
    '**/__tests__/**/*.(test|spec).[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
  
  // Ignore Patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.expo/',
    '/coverage/',
    '/dist/',
  ],
  
  // Transform Ignore Patterns
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|expo|@expo|@unimodules|react-native-toast-notifications|zustand|expo-modules-core|expo-router|expo-linking|expo-constants|expo-status-bar)/)',
  ],
  
  // Globals
  globals: {
    'ts-jest': {
      tsconfig: {
        jsx: 'react',
      },
    },
  },
  
  // Clear Mocks zwischen Tests
  clearMocks: true,
  
  // Restore Mocks zwischen Tests
  restoreMocks: true,
  
  // Verbose Output
  verbose: true,
  
  // Max Workers für parallele Tests
  maxWorkers: '50%',
};