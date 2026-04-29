import type { GoBaseResponse, SignUpCredentials, SignInCredentials, AuthResponse, TokenPair, User } from './types';

export class GoBaseAuth {
  private baseUrl: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /** Get the current access token. */
  getAccessToken(): string | null {
    return this.accessToken;
  }

  /** Set tokens (used internally and by GoBaseClient). */
  setTokens(tokens: TokenPair): void {
    this.accessToken = tokens.access_token;
    this.refreshToken = tokens.refresh_token;
  }

  /** Sign up with email and password. */
  async signUp(credentials: SignUpCredentials): Promise<GoBaseResponse<AuthResponse>> {
    const res = await fetch(`${this.baseUrl}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    const data: GoBaseResponse<AuthResponse> = await res.json();
    if (data.success && data.data?.tokens) {
      this.setTokens(data.data.tokens);
    }
    return data;
  }

  /** Sign in with email and password. */
  async signIn(credentials: SignInCredentials): Promise<GoBaseResponse<AuthResponse>> {
    const res = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    const data: GoBaseResponse<AuthResponse> = await res.json();
    if (data.success && data.data?.tokens) {
      this.setTokens(data.data.tokens);
    }
    return data;
  }

  /** Sign out — revokes all refresh tokens. */
  async signOut(): Promise<GoBaseResponse> {
    const res = await fetch(`${this.baseUrl}/auth/logout`, {
      method: 'POST',
      headers: this.authHeaders(),
    });
    this.accessToken = null;
    this.refreshToken = null;
    return res.json();
  }

  /** Refresh the session using the stored refresh token. */
  async refreshSession(): Promise<GoBaseResponse<{ tokens: TokenPair }>> {
    if (!this.refreshToken) {
      return { success: false, error: 'No refresh token available' };
    }
    const res = await fetch(`${this.baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: this.refreshToken }),
    });
    const data: GoBaseResponse<{ tokens: TokenPair }> = await res.json();
    if (data.success && data.data?.tokens) {
      this.setTokens(data.data.tokens);
    }
    return data;
  }

  /** Get the current authenticated user. */
  async getUser(): Promise<GoBaseResponse<User>> {
    const res = await fetch(`${this.baseUrl}/auth/me`, {
      headers: this.authHeaders(),
    });
    return res.json();
  }

  /** Build authorization headers. */
  authHeaders(): Record<string, string> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }
    return headers;
  }
}
