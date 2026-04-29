/**
 * GoBase REST Engine Benchmark
 * Tests: GET /rest/v1/:table (list, filter, paginate), POST, PATCH, DELETE
 *
 * Prerequisites:
 *   1. GoBase running with a test user pre-seeded
 *   2. A table named TABLE_NAME (default: bench_items) with columns: name TEXT, value INT
 *      CREATE TABLE bench_items (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255), value INT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
 *
 * Run: k6 run benchmarks/rest.js
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// ── Config ────────────────────────────────────────────────────────────────────
const BASE_URL  = __ENV.BASE_URL   || 'http://localhost:8000';
const EMAIL     = __ENV.TEST_EMAIL || 'bench@gobase.test';
const PASSWORD  = __ENV.TEST_PASSWORD || 'Bench@12345';
const TABLE     = __ENV.TABLE_NAME || 'bench_items';

// ── Custom metrics ────────────────────────────────────────────────────────────
const listLatency   = new Trend('rest_list_latency',   true);
const insertLatency = new Trend('rest_insert_latency', true);
const updateLatency = new Trend('rest_update_latency', true);
const deleteLatency = new Trend('rest_delete_latency', true);
const crudErrors    = new Counter('rest_crud_errors');

// ── Load profile ──────────────────────────────────────────────────────────────
export const options = {
  stages: [
    { duration: '30s', target: 20  },  // warm up
    { duration: '2m',  target: 100 },  // ramp to 100 VUs
    { duration: '3m',  target: 200 },  // peak load
    { duration: '30s', target: 0   },  // cool down
  ],
  thresholds: {
    http_req_duration:   ['p(95)<100', 'p(99)<300'],
    http_req_failed:     ['rate<0.01'],
    rest_list_latency:   ['p(95)<80'],
    rest_insert_latency: ['p(95)<120'],
  },
};

const JSON_HEADERS = { 'Content-Type': 'application/json' };

// ── Setup: login once and share the token ────────────────────────────────────
export function setup() {
  const res = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email: EMAIL, password: PASSWORD }),
    { headers: JSON_HEADERS },
  );

  if (res.status !== 200) {
    // Auto-signup if user doesn't exist yet
    const signup = http.post(
      `${BASE_URL}/auth/signup`,
      JSON.stringify({ email: EMAIL, password: PASSWORD }),
      { headers: JSON_HEADERS },
    );
    if (signup.status !== 201) {
      throw new Error(`Setup failed — cannot login or signup: ${signup.body}`);
    }
    return { token: JSON.parse(signup.body).data.tokens.access_token };
  }

  return { token: JSON.parse(res.body).data.tokens.access_token };
}

// ── Main scenario ─────────────────────────────────────────────────────────────
export default function (data) {
  const headers = {
    ...JSON_HEADERS,
    Authorization: `Bearer ${data.token}`,
  };

  // 1. LIST with filter + pagination
  const listStart = Date.now();
  const listRes = http.get(
    `${BASE_URL}/rest/v1/${TABLE}?limit=20&offset=0&order=created_at.desc`,
    { headers },
  );
  listLatency.add(Date.now() - listStart);
  check(listRes, {
    'list 200': (r) => r.status === 200,
    'list has rows array': (r) => {
      try { return Array.isArray(JSON.parse(r.body).data.rows); } catch { return false; }
    },
  }) || crudErrors.add(1);

  // 2. INSERT
  const name = `item_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const insertStart = Date.now();
  const insertRes = http.post(
    `${BASE_URL}/rest/v1/${TABLE}`,
    JSON.stringify({ name, value: Math.floor(Math.random() * 1000) }),
    { headers },
  );
  insertLatency.add(Date.now() - insertStart);

  let insertedId;
  const inserted = check(insertRes, {
    'insert 201': (r) => r.status === 201,
    'insert has id': (r) => {
      try {
        insertedId = JSON.parse(r.body).data.row?.id;
        return !!insertedId;
      } catch { return false; }
    },
  });

  if (!inserted || !insertedId) {
    crudErrors.add(1);
    sleep(0.5);
    return;
  }

  // 3. PATCH
  const updateStart = Date.now();
  const updateRes = http.patch(
    `${BASE_URL}/rest/v1/${TABLE}/${insertedId}`,
    JSON.stringify({ value: 9999 }),
    { headers },
  );
  updateLatency.add(Date.now() - updateStart);
  check(updateRes, { 'patch 200': (r) => r.status === 200 }) || crudErrors.add(1);

  // 4. GET single row
  const getRes = http.get(`${BASE_URL}/rest/v1/${TABLE}/${insertedId}`, { headers });
  check(getRes, { 'get row 200': (r) => r.status === 200 });

  // 5. DELETE (cleanup)
  const deleteStart = Date.now();
  const deleteRes = http.del(`${BASE_URL}/rest/v1/${TABLE}/${insertedId}`, null, { headers });
  deleteLatency.add(Date.now() - deleteStart);
  check(deleteRes, { 'delete 200': (r) => r.status === 200 }) || crudErrors.add(1);

  sleep(0.2);
}
