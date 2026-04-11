// ─── API Response Types ─────────────────────────────
export interface GoBaseResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// ─── Auth Types ─────────────────────────────────────
export interface User {
  id: number;
  email: string;
  provider: string;
  email_verified: boolean;
  created_at: string;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export interface AuthResponse {
  user: User;
  tokens: TokenPair;
}

export interface SignUpCredentials {
  email: string;
  password: string;
}

export interface SignInCredentials {
  email: string;
  password: string;
}

// ─── Database Types ─────────────────────────────────
export type FilterOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'in' | 'is';

export interface QueryFilter {
  column: string;
  operator: FilterOperator;
  value: string | number | boolean | null | (string | number)[];
}

// ─── Storage Types ──────────────────────────────────
export interface StorageObject {
  key: string;
  size: number;
  content_type: string;
  last_modified: string;
  etag: string;
}

export interface SignedUrlResponse {
  signed_url: string;
  key: string;
  method: string;
}

// ─── Realtime Types ─────────────────────────────────
export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

export interface RealtimePayload<T = Record<string, any>> {
  type: RealtimeEvent;
  channel: string;
  table: string;
  record: T;
  timestamp: string;
}

export interface RealtimeChannel {
  on(event: RealtimeEvent, callback: (payload: RealtimePayload) => void): RealtimeChannel;
  subscribe(): RealtimeChannel;
  unsubscribe(): void;
}

// ─── Client Options ─────────────────────────────────
export interface GoBaseClientOptions {
  headers?: Record<string, string>;
  autoRefreshToken?: boolean;
}
