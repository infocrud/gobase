import { create } from 'zustand';

interface User {
  id: number;
  email: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  setError: (error: string | null) => void;
}

const API_BASE = '';

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: localStorage.getItem('gobase_token'),
  isAuthenticated: !!localStorage.getItem('gobase_token'),
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        const token = data.data.tokens.access_token;
        localStorage.setItem('gobase_token', token);
        set({
          user: data.data.user,
          accessToken: token,
          isAuthenticated: true,
          isLoading: false,
        });
        return true;
      } else {
        set({ error: data.error || 'Login failed', isLoading: false });
        return false;
      }
    } catch {
      set({ error: 'Network error', isLoading: false });
      return false;
    }
  },

  signup: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        const token = data.data.tokens.access_token;
        localStorage.setItem('gobase_token', token);
        set({
          user: data.data.user,
          accessToken: token,
          isAuthenticated: true,
          isLoading: false,
        });
        return true;
      } else {
        set({ error: data.error || 'Signup failed', isLoading: false });
        return false;
      }
    } catch {
      set({ error: 'Network error', isLoading: false });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('gobase_token');
    set({ user: null, accessToken: null, isAuthenticated: false });
  },

  setError: (error) => set({ error }),
}));

/** Helper to get auth headers for API calls. */
export function authHeaders(): Record<string, string> {
  const token = useAuthStore.getState().accessToken;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}
