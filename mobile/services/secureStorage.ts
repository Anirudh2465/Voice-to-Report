/**
 * Cross-platform secure storage.
 * On native: uses expo-secure-store (encrypted keychain/keystore).
 * On web: falls back to sessionStorage (in-memory, not persisted across tabs).
 */
import { Platform } from 'react-native';

let SecureStore: {
  getItemAsync: (key: string) => Promise<string | null>;
  setItemAsync: (key: string, value: string) => Promise<void>;
  deleteItemAsync: (key: string) => Promise<void>;
};

if (Platform.OS === 'web') {
  SecureStore = {
    getItemAsync: async (key) => sessionStorage.getItem(key),
    setItemAsync: async (key, value) => { sessionStorage.setItem(key, value); },
    deleteItemAsync: async (key) => { sessionStorage.removeItem(key); },
  };
} else {
  // Lazy import to avoid web bundling issues
  const ExpoSecureStore = require('expo-secure-store');
  SecureStore = {
    getItemAsync: ExpoSecureStore.getItemAsync,
    setItemAsync: ExpoSecureStore.setItemAsync,
    deleteItemAsync: ExpoSecureStore.deleteItemAsync,
  };
}

export default SecureStore;
