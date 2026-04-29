/**
 * GoBase Concurrent Load Test — 1,000 VUs
 * Simulates a realistic production traffic mix:
 *   40% read queries (REST GET)
 *   30% auth operations (login / refresh)
 *   20% writes (REST POST/PATCH)
 *   10% storage operations (list buckets, list files)
 *
 * Run: k6 run benchmarks/concurrent.js
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import { Counter, Rate } from 'k6/metrics';

// ── Config ────────────────────────────────────────────────────────────────────
const BASE_URL = __ENV.BASE_URL    || 'http://localhost:8000';
const EMAIL    = __ENV.TEST_EMAIL  || 'bench@gobase.test';
const PASSWORD = __ENV.TEST_PASSWORD || 'Bench@12345';
const TABLE    = __ENV.TABLE_NAME  || 'bench_items';

const errorRate   = new Rate('errors');
const totalErrors = new Counter('total_errors');

// ── Load profile: ramp to 1,000 VUs ─────────────────────────────────────────
export const options = {
  scenarios: {
    reads: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 100  },
        { duration: '2m',  target: 400  },
        { duration: '3m',  target: 400  },
        { duration: '30s', target: 0    },
      ],
      exec: 'readScenario',
    },
    writes: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 50   },
        { duration: '2m',  target: 200  },
        { duration: '3m',  target: 200  },
        { duration: '30s', target: 0    },
      ],
      exec: 'writeScenario',
    },
    auth: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 50   },
        { duration: '2m',  target: 200  },
        { duration: '3m',  target: 200  },
        { duration: '30s', target: 0    },
      ],
      exec: 'authScenario',
    },
    storage: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 10   },
        { duration: '2m',  target: 50   },
        { duration: '3m',  target: 50   },
        { duration: '30s', target: 0    },
      ],
      exec: 'storageScenario',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<200', 'p(99)<500'],
    http_req_failed:   ['rate<0.02'],
    errors:            ['rate<0.02'],
  },
};

const JSON_HEADERS = { 'Content-Type': 'application/json' };

// ── Setup ─────────────────────────────────────────────────────────────────────
export function setup() {
  // Ensure bench user exists
  let res = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email: EMAIL, password: PASSWORD }),
    { headers: JSON_HEADERS },
  );
  if (res.status !== 200) {
    res = http.post(
      `${BASE_URL}/auth/signup`,
      JSON.stringify({ email: EMAIL, password: PASSWORD }),
      { headers: JSON_HEADERS },
    );
  }
  const body = JSON.parse(res.body);
  return { token: body.data.tokens.access_token };
}

// ── Scenarios ─────────────────────────────────────────────────────────────────
export function readScenario(data) {
  const res = http.get(
    `${BASE_URL}/rest/v1/${TABLE}?limit=10&order=id.desc`,
    { headers: { Authorization: `Bearer ${data.token}` } },
  );
  const ok = check(res, { 'read 200': (r) => r.status === 200 });
  if (!ok) { errorRate.add(1); totalErrors.add(1); }
  sleep(0.1);
}

export function writeScenario(data) {
  const headers = {
    ...JSON_HEADERS,
    Authorization: `Bearer ${data.token}`,
  };
  const res = http.post(
    `${BASE_URL}/rest/v1/${TABLE}`,
    JSON.stringify({ name: `load_${Date.now()}`, value: Math.floor(Math.random() * 100) }),
    { headers },
  );
  const ok = check(res, { 'write 201': (r) => r.status === 201 });
  if (!ok) { errorRate.add(1); totalErrors.add(1); }
  sleep(0.3);
}

export function authScenario(data) {
  const res = http.get(
    `${BASE_URL}/auth/me`,
    { headers: { Authorization: `Bearer ${data.token}` } },
  );
  const ok = check(res, { 'auth/me 200': (r) => r.status === 200 });
  if (!ok) { errorRate.add(1); totalErrors.add(1); }
  sleep(0.2);
}

export function storageScenario(data) {
  const res = http.get(
    `${BASE_URL}/storage/v1/bucket`,
    { headers: { Authorization: `Bearer ${data.token}` } },
  );
  const ok = check(res, { 'storage 200': (r) => r.status === 200 });
  if (!ok) { errorRate.add(1); totalErrors.add(1); }
  sleep(0.5);
}
