import type { GoBaseResponse, FilterOperator } from './types';
import type { GoBaseAuth } from './auth';

interface QueryState {
  table: string;
  selectCols: string;
  filters: string[];
  orderBy: string;
  limitVal: number | null;
  offsetVal: number | null;
  isSingle: boolean;
}

/** Chainable query builder for GoBase REST API. */
export class GoBaseQueryBuilder<T = Record<string, any>> {
  private baseUrl: string;
  private auth: GoBaseAuth;
  private state: QueryState;

  constructor(baseUrl: string, auth: GoBaseAuth, table: string) {
    this.baseUrl = baseUrl;
    this.auth = auth;
    this.state = {
      table,
      selectCols: '*',
      filters: [],
      orderBy: '',
      limitVal: null,
      offsetVal: null,
      isSingle: false,
    };
  }

  /** Select specific columns. */
  select(columns: string): this {
    this.state.selectCols = columns;
    return this;
  }

  /** Filter: equal. */
  eq(column: string, value: string | number): this {
    this.state.filters.push(`${column}=eq.${value}`);
    return this;
  }

  /** Filter: not equal. */
  neq(column: string, value: string | number): this {
    this.state.filters.push(`${column}=neq.${value}`);
    return this;
  }

  /** Filter: greater than. */
  gt(column: string, value: string | number): this {
    this.state.filters.push(`${column}=gt.${value}`);
    return this;
  }

  /** Filter: greater than or equal. */
  gte(column: string, value: string | number): this {
    this.state.filters.push(`${column}=gte.${value}`);
    return this;
  }

  /** Filter: less than. */
  lt(column: string, value: string | number): this {
    this.state.filters.push(`${column}=lt.${value}`);
    return this;
  }

  /** Filter: less than or equal. */
  lte(column: string, value: string | number): this {
    this.state.filters.push(`${column}=lte.${value}`);
    return this;
  }

  /** Filter: LIKE pattern. */
  like(column: string, pattern: string): this {
    this.state.filters.push(`${column}=like.${pattern}`);
    return this;
  }

  /** Filter: IN list. */
  in(column: string, values: (string | number)[]): this {
    this.state.filters.push(`${column}=in.(${values.join(',')})`);
    return this;
  }

  /** Filter: IS (null, true, false). */
  is(column: string, value: 'null' | 'true' | 'false'): this {
    this.state.filters.push(`${column}=is.${value}`);
    return this;
  }

  /** Order results. */
  order(column: string, direction: 'asc' | 'desc' = 'asc'): this {
    this.state.orderBy = `${column}.${direction}`;
    return this;
  }

  /** Limit number of rows. */
  limit(count: number): this {
    this.state.limitVal = count;
    return this;
  }

  /** Offset results. */
  offset(count: number): this {
    this.state.offsetVal = count;
    return this;
  }

  /** Return a single row instead of an array. */
  single(): this {
    this.state.isSingle = true;
    this.state.limitVal = 1;
    return this;
  }

  /** Execute a SELECT query. */
  async get(): Promise<GoBaseResponse<T[]>> {
    const params = new URLSearchParams();
    if (this.state.selectCols !== '*') params.set('select', this.state.selectCols);
    if (this.state.orderBy) params.set('order', this.state.orderBy);
    if (this.state.limitVal !== null) params.set('limit', String(this.state.limitVal));
    if (this.state.offsetVal !== null) params.set('offset', String(this.state.offsetVal));

    // Append filters
    for (const filter of this.state.filters) {
      const [key, ...rest] = filter.split('=');
      params.set(key, rest.join('='));
    }

    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${this.baseUrl}/rest/v1/${this.state.table}${query}`, {
      headers: this.auth.authHeaders(),
    });
    return res.json();
  }

  /** Insert one or more rows. */
  async insert(data: Partial<T> | Partial<T>[]): Promise<GoBaseResponse<T>> {
    const res = await fetch(`${this.baseUrl}/rest/v1/${this.state.table}`, {
      method: 'POST',
      headers: this.auth.authHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  }

  /** Update a row by ID. */
  async update(id: number | string, data: Partial<T>): Promise<GoBaseResponse> {
    const res = await fetch(`${this.baseUrl}/rest/v1/${this.state.table}/${id}`, {
      method: 'PATCH',
      headers: this.auth.authHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  }

  /** Delete a row by ID. */
  async delete(id: number | string): Promise<GoBaseResponse> {
    const res = await fetch(`${this.baseUrl}/rest/v1/${this.state.table}/${id}`, {
      method: 'DELETE',
      headers: this.auth.authHeaders(),
    });
    return res.json();
  }
}
