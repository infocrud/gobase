import { GoBaseAuth } from './auth';

export class GoBaseFunctions {
  constructor(private baseUrl: string, private auth: GoBaseAuth) {}

  /**
   * Invokes an edge function.
   * @param name The name of the function to invoke
   * @param body Optional JSON payload
   * @param headers Optional custom headers
   */
  async invoke<T = any>(
    name: string,
    body?: any,
    headers?: Record<string, string>
  ): Promise<{ data: T | null; error: Error | null }> {
    const url = `${this.baseUrl}/functions/v1/${name}`;
    const token = this.auth.token;

    const reqHeaders: Record<string, string> = {
      ...headers,
    };

    if (body && !reqHeaders['Content-Type']) {
      reqHeaders['Content-Type'] = 'application/json';
    }

    if (token) {
      reqHeaders['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: reqHeaders,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!res.ok) {
        let errStr = res.statusText;
        try {
          const errBody = await res.json();
          errStr = errBody.error || errBody.message || errStr;
        } catch (_) {}
        throw new Error(errStr);
      }

      // Read response
      const resText = await res.text();
      let resData: T | null = null;
      if (resText) {
        try {
          resData = JSON.parse(resText) as T;
        } catch (_) {
          // It's not JSON, return as text but casted
          resData = resText as unknown as T;
        }
      }

      return { data: resData, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }
}
