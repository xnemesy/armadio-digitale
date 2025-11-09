// Mock React Native Firebase - solo i moduli effettivamente usati nei test
jest.mock('@react-native-firebase/app', () => ({
  default: jest.fn(),
}));

jest.mock('@react-native-firebase/firestore', () => ({
  default: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(() => Promise.resolve({ exists: true, data: () => ({}) })),
        set: jest.fn(() => Promise.resolve()),
        update: jest.fn(() => Promise.resolve()),
        delete: jest.fn(() => Promise.resolve()),
      })),
      where: jest.fn(() => ({
        get: jest.fn(() => Promise.resolve({ docs: [] })),
      })),
      orderBy: jest.fn(() => ({
        get: jest.fn(() => Promise.resolve({ docs: [] })),
      })),
    })),
  })),
  FieldValue: {
    serverTimestamp: jest.fn(() => 'TIMESTAMP'),
  },
}));

jest.mock('@react-native-firebase/storage', () => ({
  default: jest.fn(() => ({
    ref: jest.fn(() => ({
      putFile: jest.fn(() => Promise.resolve({ state: 'success' })),
      getDownloadURL: jest.fn(() => Promise.resolve('https://example.com/image.jpg')),
      delete: jest.fn(() => Promise.resolve()),
    })),
  })),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
    clear: jest.fn(() => Promise.resolve()),
  },
}));

// Mock expo-constants
jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      extra: {
        EXPO_PUBLIC_GEMINI_API_KEY: 'test-api-key',
        EXPO_PUBLIC_FIREBASE_API_KEY: 'test-firebase-key',
        APP_ID: 'armadio-digitale-test',
      },
    },
  },
}));

// The moduleNameMapper routes react-native-reanimated to our local mock, no explicit jest.mock needed.

// Mock expo-image-picker
jest.mock('expo-image-picker', () => ({
  launchCameraAsync: jest.fn(() => Promise.resolve({ canceled: false, assets: [{ uri: 'test-uri' }] })),
  launchImageLibraryAsync: jest.fn(() => Promise.resolve({ canceled: false, assets: [{ uri: 'test-uri' }] })),
  requestCameraPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestMediaLibraryPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
}));

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
}));

// Mock lucide-react-native
jest.mock('lucide-react-native', () => {
  const React = require('react');
  const { View } = require('react-native');
  const MockIcon = () => React.createElement(View, { testID: 'mock-icon' });
  return {
    HomeIcon: MockIcon,
    Zap: MockIcon,
    Camera: MockIcon,
    BarChart3: MockIcon,
    User: MockIcon,
    ChevronLeft: MockIcon,
    Trash2: MockIcon,
    Edit: MockIcon,
  };
});

// Silence console warnings in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};
