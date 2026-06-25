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
  applyTokens: (access: string, refresh?: string) => void;
  setError: (error: string | null) => void;
}

const API_BASE = '';

function storeTokens(access: string, refresh?: string) {
  localStorage.setItem('gobase_token', access);
  if (refresh) localStorage.setItem('gobase_refresh', refresh);
}

export const useAuthStore = create<AuthState>((set) => ({
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
        const { access_token, refresh_token } = data.data.tokens;
        storeTokens(access_token, refresh_token);
        set({
          user: data.data.user,
          accessToken: access_token,
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
        const { access_token, refresh_token } = data.data.tokens;
        storeTokens(access_token, refresh_token);
        set({
          user: data.data.user,
          accessToken: access_token,
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
    localStorage.removeItem('gobase_refresh');
    set({ user: null, accessToken: null, isAuthenticated: false });
  },

  // Apply tokens obtained out-of-band (e.g. the OAuth redirect callback).
  applyTokens: (access: string, refresh?: string) => {
    storeTokens(access, refresh);
    set({ accessToken: access, isAuthenticated: true });
  },

  setError: (error) => set({ error }),
}));

/** Helper to get auth headers for API calls. */
export function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('gobase_token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

// Coalesce concurrent refreshes so a burst of 401s only triggers one refresh call.
let refreshInFlight: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    const refresh = localStorage.getItem('gobase_refresh');
    if (!refresh) return false;
    try {
      const res = await fetch('/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refresh }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const { access_token, refresh_token } = data.data.tokens;
        storeTokens(access_token, refresh_token);
        useAuthStore.setState({ accessToken: access_token, isAuthenticated: true });
        return true;
      }
    } catch {
      // fall through
    }
    return false;
  })();
  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

/**
 * fetch wrapper that injects the bearer token and transparently handles
 * expired sessions: on a 401 it tries to refresh the access token once and
 * replays the request. If refresh fails, it logs out (which sends the user
 * back to /login via ProtectedRoute) and surfaces the 401 to the caller.
 */
export async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const withAuth = (): RequestInit => {
    const token = localStorage.getItem('gobase_token');
    const headers = new Headers(init.headers || {});
    if (token) headers.set('Authorization', `Bearer ${token}`);
    // Only default JSON content-type when sending a non-FormData body.
    if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    return { ...init, headers };
  };

  let res = await fetch(input, withAuth());
  if (res.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      res = await fetch(input, withAuth());
    } else {
      useAuthStore.getState().logout();
    }
  }
  return res;
}
