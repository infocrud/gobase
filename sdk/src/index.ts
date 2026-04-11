export { GoBaseClient } from './GoBaseClient';
export { GoBaseAuth } from './auth';
export { GoBaseQueryBuilder } from './database';
export { GoBaseStorage } from './storage';
export { GoBaseRealtime } from './realtime';
export { GoBaseFunctions } from './functions';
export * from './types';

import { GoBaseClient } from './GoBaseClient';
import type { GoBaseClientOptions } from './types';

/**
 * Create a new GoBase client instance.
 *
 * @example
 * ```ts
 * import { createClient } from '@gobase/sdk'
 *
 * const gobase = createClient('http://localhost:8000')
 *
 * // Auth
 * await gobase.auth.signUp({ email: 'user@test.com', password: 'password123' })
 *
 * // Database
 * const { data } = await gobase.from('todos').select('*').eq('done', false).get()
 *
 * // Storage
 * await gobase.storage.upload('my-bucket', 'photo.jpg', file)
 *
 * // Realtime
 * gobase.realtime.connect()
 * gobase.realtime.channel('todos').on('INSERT', (payload) => {
 *   console.log('New todo:', payload.record)
 * }).subscribe()
 * ```
 */
export function createClient(url: string, options?: GoBaseClientOptions): GoBaseClient {
  return new GoBaseClient(url, options);
}
