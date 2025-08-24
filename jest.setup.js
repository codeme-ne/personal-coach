// === Jest Setup mit Mocks für externe Dependencies ===
// Zweck: Globale Test-Konfiguration und Mock-Definitionen
// Features: Firebase Mocks, AsyncStorage Mocks, Navigation Mocks

import '@testing-library/jest-native/extend-expect';

// === React Native Mocks ===

// Mock für React Native (Expo SDK 53 kompatibel)
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  
  // Mock native modules
  RN.NativeModules = {
    ...RN.NativeModules,
    SettingsManager: {
      settings: {
        AppleLocale: 'en_US',
        AppleLanguages: ['en'],
      },
    },
    DevMenu: {
      show: jest.fn(),
      reload: jest.fn(),
      debugRemotely: jest.fn(),
      setProfilingEnabled: jest.fn(),
    },
    DevSettings: {
      reload: jest.fn(),
      addMenuItem: jest.fn(),
    },
    RNGestureHandlerModule: {
      attachGestureHandler: jest.fn(),
      createGestureHandler: jest.fn(),
      dropGestureHandler: jest.fn(),
      updateGestureHandler: jest.fn(),
      State: {},
      Directions: {},
    },
  };
  
  // Mock Alert
  RN.Alert = {
    alert: jest.fn(),
  };
  
  // Mock Vibration
  RN.Vibration = {
    vibrate: jest.fn(),
  };
  
  return RN;
});

// === Firebase Mocks ===

// Mock Firebase App
jest.mock('./config/firebase', () => ({
  app: {},
  db: {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(() => Promise.resolve({ exists: true, data: () => ({}) })),
        set: jest.fn(() => Promise.resolve()),
        update: jest.fn(() => Promise.resolve()),
        delete: jest.fn(() => Promise.resolve()),
      })),
      where: jest.fn(() => ({
        get: jest.fn(() => Promise.resolve({ docs: [] })),
        onSnapshot: jest.fn(),
      })),
      add: jest.fn(() => Promise.resolve({ id: 'mock-id' })),
      onSnapshot: jest.fn(),
    })),
  },
  auth: {
    currentUser: null,
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
    onAuthStateChanged: jest.fn((callback) => {
      callback(null);
      return jest.fn(); // unsubscribe function
    }),
  },
}));

// Mock Firebase Functions
jest.mock('firebase/functions', () => ({
  getFunctions: jest.fn(() => ({})),
  httpsCallable: jest.fn(() => jest.fn(() => Promise.resolve({ data: { success: true } }))),
}));

// Mock Firebase Firestore
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  collection: jest.fn(),
  doc: jest.fn(),
  getDocs: jest.fn(() => Promise.resolve({ docs: [] })),
  addDoc: jest.fn(() => Promise.resolve({ id: 'mock-id' })),
  updateDoc: jest.fn(() => Promise.resolve()),
  deleteDoc: jest.fn(() => Promise.resolve()),
  onSnapshot: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  serverTimestamp: jest.fn(() => new Date()),
  Timestamp: {
    fromDate: jest.fn((date) => date),
    now: jest.fn(() => new Date()),
  },
}));

// Mock Firebase Auth
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  signInWithEmailAndPassword: jest.fn(() => 
    Promise.resolve({ user: { uid: 'test-uid', email: 'test@test.com' } })
  ),
  createUserWithEmailAndPassword: jest.fn(() => 
    Promise.resolve({ user: { uid: 'test-uid', email: 'test@test.com' } })
  ),
  signOut: jest.fn(() => Promise.resolve()),
  sendPasswordResetEmail: jest.fn(() => Promise.resolve()),
  onAuthStateChanged: jest.fn(),
  User: {},
}));

// === AsyncStorage Mock ===

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiSet: jest.fn(() => Promise.resolve()),
}));

// === Expo Mocks ===

// Mock Expo Router
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    navigate: jest.fn(),
  },
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  })),
  Stack: {
    Screen: jest.fn(() => null),
  },
  Tabs: jest.fn(() => null),
  Link: jest.fn(() => null),
}));

// Mock Expo Haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'Light',
    Medium: 'Medium',
    Heavy: 'Heavy',
  },
}));

// Mock Expo Font
jest.mock('expo-font', () => {
  const FontMock = {
    isLoaded: jest.fn(() => true),
    isLoading: jest.fn(() => false),
    loadAsync: jest.fn(() => Promise.resolve()),
  };
  
  return {
    useFonts: jest.fn(() => [true, null]),
    loadAsync: jest.fn(() => Promise.resolve()),
    isLoaded: jest.fn(() => true),
    isLoading: jest.fn(() => false),
    Font: FontMock,
    default: FontMock,
  };
});

// === React Navigation Mocks ===

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: jest.fn(() => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  })),
  useRoute: jest.fn(() => ({
    params: {},
  })),
  useFocusEffect: jest.fn(),
}));

// === Toast Notifications Mock ===

jest.mock('react-native-toast-notifications', () => ({
  __esModule: true,
  default: jest.fn(({ children }) => children),
  ToastProvider: jest.fn(({ children }) => children),
  useToast: jest.fn(() => ({
    show: jest.fn(),
    hide: jest.fn(),
    hideAll: jest.fn(),
  })),
}));

// === Zustand Mock ===

// Für Zustand verwenden wir die tatsächliche Implementierung in Tests
// aber mit einem Test-Store Provider für Isolation

// === Global Test Utilities ===

global.mockConsole = () => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
};

global.restoreConsole = () => {
  console.log.mockRestore();
  console.warn.mockRestore();
  console.error.mockRestore();
};

// === Window/DOM Mocks ===
global.window = global.window || {};
global.window.addEventListener = jest.fn();
global.window.removeEventListener = jest.fn();
global.window.confirm = jest.fn(() => true);
global.window.alert = jest.fn();

// === Test Timeout ===
jest.setTimeout(10000);

// === Cleanup ===
afterEach(() => {
  jest.clearAllMocks();
});