import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

interface AuthState {
  token: string | null;
  name: string | null;
  role: 'superadmin' | 'admin' | 'employee' | null;
  serviceId: string | null;
  serviceName: string | null;
  setAuth: (data: { token: string; name: string; role: any; serviceId?: string | null; serviceName?: string | null }) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  name: null,
  role: null,
  serviceId: null,
  serviceName: null,
  setAuth: async ({ token, name, role, serviceId = null, serviceName = null }) => {
    await AsyncStorage.multiSet([
      ['token', token],
      ['name', name ?? ''],
      ['role', role ?? ''],
      ['serviceId', serviceId ?? ''],
      ['serviceName', serviceName ?? ''],
    ]);
    set({ token, name, role, serviceId, serviceName });
  },
  logout: async () => {
    await AsyncStorage.multiRemove(['token', 'name', 'role', 'serviceId', 'serviceName']);
    set({ token: null, name: null, role: null, serviceId: null, serviceName: null });
  },
  hydrate: async () => {
    const entries = await AsyncStorage.multiGet(['token', 'name', 'role', 'serviceId', 'serviceName']);
    const map = Object.fromEntries(entries);
    set({
      token: map['token'] || null,
      name: map['name'] || null,
      role: (map['role'] as any) || null,
      serviceId: map['serviceId'] || null,
      serviceName: map['serviceName'] || null,
    })
  }
}));
