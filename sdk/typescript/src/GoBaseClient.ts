import { GoBaseAuth } from './auth';
import { GoBaseQueryBuilder } from './database';
import { GoBaseStorage } from './storage';
import { GoBaseRealtime } from './realtime';
import { GoBaseFunctions } from './functions';
import type { GoBaseClientOptions } from './types';
/**
 * GoBase Client — the main entry point for the SDK.
 *
 * @example
 * ```ts
 * import { createClient } from '@gobase/sdk'
 *
 * const gobase = createClient('http://localhost:8000')
 * await gobase.auth.signUp({ email: 'user@test.com', password: 'password123' })
 * const { data } = await gobase.from('todos').eq('done', false).get()
 * ```
 */
export class GoBaseClient {
  readonly auth: GoBaseAuth;
  readonly storage: GoBaseStorage;
  readonly realtime: GoBaseRealtime;
  readonly functions: GoBaseFunctions;
  private baseUrl: string;

  constructor(baseUrl: string, options?: GoBaseClientOptions) {
    // Remove trailing slash
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.auth = new GoBaseAuth(this.baseUrl);
    this.storage = new GoBaseStorage(this.baseUrl, this.auth);
    this.realtime = new GoBaseRealtime(this.baseUrl, this.auth);
    this.functions = new GoBaseFunctions(this.baseUrl, this.auth);
  }

  /**
   * Create a query builder for a table.
   * @example gobase.from('todos').select('*').eq('done', false).get()
   */
  from<T = Record<string, any>>(table: string): GoBaseQueryBuilder<T> {
    return new GoBaseQueryBuilder<T>(this.baseUrl, this.auth, table);
  }
}
