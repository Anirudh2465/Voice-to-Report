import { create } from 'zustand';
import SecureStore from '../services/secureStorage';
import { authApi } from '../services/api';

interface User {
  id: string;
  email: string;
  full_name: string;
  institution?: string;
  designation?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  login: (email: string, password: string) => Promise<void>;
  pinLogin: (email: string, pin: string) => Promise<void>;
  register: (data: { email: string; password: string; full_name: string; institution?: string }) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  setupPin: (pin: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isLoading: true,
  isAuthenticated: false,

  restoreSession: async () => {
    try {
      const token = await SecureStore.getItemAsync('access_token');
      if (token) {
        const res = await authApi.me();
        set({ user: res.data, accessToken: token, isAuthenticated: true });
      }
    } catch {
      // Token expired or invalid — clear storage
      await SecureStore.deleteItemAsync('access_token');
      await SecureStore.deleteItemAsync('refresh_token');
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (email, password) => {
    const res = await authApi.login(email, password);
    const { access_token, refresh_token, user } = res.data;
    await SecureStore.setItemAsync('access_token', access_token);
    await SecureStore.setItemAsync('refresh_token', refresh_token);
    set({ user, accessToken: access_token, isAuthenticated: true });
  },

  pinLogin: async (email, pin) => {
    const res = await authApi.pinLogin(email, pin);
    const { access_token, refresh_token, user } = res.data;
    await SecureStore.setItemAsync('access_token', access_token);
    await SecureStore.setItemAsync('refresh_token', refresh_token);
    set({ user, accessToken: access_token, isAuthenticated: true });
  },

  register: async (data) => {
    const res = await authApi.register(data);
    const { access_token, refresh_token, user } = res.data;
    await SecureStore.setItemAsync('access_token', access_token);
    await SecureStore.setItemAsync('refresh_token', refresh_token);
    set({ user, accessToken: access_token, isAuthenticated: true });
  },

  setupPin: async (pin) => {
    await authApi.setupPin(pin);
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
    set({ user: null, accessToken: null, isAuthenticated: false });
  },
}));
