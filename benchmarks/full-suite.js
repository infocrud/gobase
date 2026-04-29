/**
 * GoBase Full Benchmark Suite
 * Single entry point that runs all scenarios in sequence with a full summary.
 * Designed for CI and for comparing against Supabase baselines.
 *
 * Run: k6 run benchmarks/full-suite.js
 * With JSON output: k6 run --out json=results/$(date +%s).json benchmarks/full-suite.js
 */
import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Trend, Counter, Rate } from 'k6/metrics';

// ── Config ────────────────────────────────────────────────────────────────────
const BASE_URL = __ENV.BASE_URL    || 'http://localhost:8000';
const EMAIL    = __ENV.TEST_EMAIL  || 'bench@gobase.test';
const PASSWORD = __ENV.TEST_PASSWORD || 'Bench@12345';
const TABLE    = __ENV.TABLE_NAME  || 'bench_items';

// ── Metrics ───────────────────────────────────────────────────────────────────
const metrics = {
  signup:  new Trend('p_signup_ms',  true),
  login:   new Trend('p_login_ms',   true),
  refresh: new Trend('p_refresh_ms', true),
  me:      new Trend('p_me_ms',      true),
  list:    new Trend('p_list_ms',    true),
  insert:  new Trend('p_insert_ms',  true),
  patch:   new Trend('p_patch_ms',   true),
  del:     new Trend('p_delete_ms',  true),
  buckets: new Trend('p_buckets_ms', true),
  failures: new Counter('failures'),
  successRate: new Rate('success_rate'),
};

// ── Load profile ──────────────────────────────────────────────────────────────
export const options = {
  stages: [
    { duration: '20s', target: 5   },  // warm up
    { duration: '1m',  target: 50  },  // light load
    { duration: '2m',  target: 100 },  // moderate load
    { duration: '2m',  target: 200 },  // heavy load
    { duration: '1m',  target: 50  },  // step down
    { duration: '20s', target: 0   },  // cool down
  ],
  thresholds: {
    http_req_duration:  ['p(50)<50', 'p(95)<200', 'p(99)<500'],
    http_req_failed:    ['rate<0.01'],
    success_rate:       ['rate>0.99'],
    p_login_ms:         ['p(95)<100'],
    p_list_ms:          ['p(95)<80'],
    p_insert_ms:        ['p(95)<120'],
  },
};

const JSON_HEADERS = { 'Content-Type': 'application/json' };

function t(fn) {
  const start = Date.now();
  const result = fn();
  return { result, ms: Date.now() - start };
}

// ── Setup ─────────────────────────────────────────────────────────────────────
export function setup() {
  // Pre-create bench user
  let loginRes = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email: EMAIL, password: PASSWORD }),
    { headers: JSON_HEADERS },
  );
  if (loginRes.status !== 200) {
    const signup = http.post(
      `${BASE_URL}/auth/signup`,
      JSON.stringify({ email: EMAIL, password: PASSWORD }),
      { headers: JSON_HEADERS },
    );
    if (signup.status !== 201) throw new Error('Setup: cannot create bench user');
    loginRes = http.post(
      `${BASE_URL}/auth/login`,
      JSON.stringify({ email: EMAIL, password: PASSWORD }),
      { headers: JSON_HEADERS },
    );
  }
  const { tokens } = JSON.parse(loginRes.body).data;
  return { accessToken: tokens.access_token, refreshToken: tokens.refresh_token };
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function (data) {
  let accessToken = data.accessToken;
  let refreshToken = data.refreshToken;

  // ── AUTH GROUP ─────────────────────────────────────────────────────────────
  group('auth', () => {
    // Login
    const { result: loginRes, ms: loginMs } = t(() => http.post(
      `${BASE_URL}/auth/login`,
      JSON.stringify({ email: EMAIL, password: PASSWORD }),
      { headers: JSON_HEADERS },
    ));
    metrics.login.add(loginMs);
    const loginOk = check(loginRes, { 'login 200': (r) => r.status === 200 });
    metrics.successRate.add(loginOk);
    if (!loginOk) metrics.failures.add(1);

    // /auth/me
    const { result: meRes, ms: meMs } = t(() => http.get(
      `${BASE_URL}/auth/me`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    ));
    metrics.me.add(meMs);
    const meOk = check(meRes, { 'me 200': (r) => r.status === 200 });
    metrics.successRate.add(meOk);

    // Refresh
    const { result: refreshRes, ms: refreshMs } = t(() => http.post(
      `${BASE_URL}/auth/refresh`,
      JSON.stringify({ refresh_token: refreshToken }),
      { headers: JSON_HEADERS },
    ));
    metrics.refresh.add(refreshMs);
    const refreshOk = check(refreshRes, { 'refresh 200': (r) => r.status === 200 });
    metrics.successRate.add(refreshOk);
    if (refreshOk) {
      try {
        const newTokens = JSON.parse(refreshRes.body).data.tokens;
        accessToken = newTokens.access_token;
        refreshToken = newTokens.refresh_token;
      } catch (_) {}
    }
  });

  sleep(0.1);

  // ── REST GROUP ─────────────────────────────────────────────────────────────
  const authHeader = { Authorization: `Bearer ${accessToken}` };

  group('rest', () => {
    // List
    const { result: listRes, ms: listMs } = t(() => http.get(
      `${BASE_URL}/rest/v1/${TABLE}?limit=10&order=id.desc`,
      { headers: authHeader },
    ));
    metrics.list.add(listMs);
    check(listRes, { 'list 200': (r) => r.status === 200 });

    // Insert
    const payload = JSON.stringify({
      name: `suite_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      value: Math.floor(Math.random() * 500),
    });
    const { result: insertRes, ms: insertMs } = t(() => http.post(
      `${BASE_URL}/rest/v1/${TABLE}`,
      payload,
      { headers: { ...JSON_HEADERS, ...authHeader } },
    ));
    metrics.insert.add(insertMs);
    const insertOk = check(insertRes, { 'insert 201': (r) => r.status === 201 });
    metrics.successRate.add(insertOk);

    let rowId;
    if (insertOk) {
      try { rowId = JSON.parse(insertRes.body).data.row?.id; } catch (_) {}
    }

    if (rowId) {
      // Patch
      const { result: patchRes, ms: patchMs } = t(() => http.patch(
        `${BASE_URL}/rest/v1/${TABLE}/${rowId}`,
        JSON.stringify({ value: 0 }),
        { headers: { ...JSON_HEADERS, ...authHeader } },
      ));
      metrics.patch.add(patchMs);
      check(patchRes, { 'patch 200': (r) => r.status === 200 });

      // Delete
      const { result: delRes, ms: delMs } = t(() =>
        http.del(`${BASE_URL}/rest/v1/${TABLE}/${rowId}`, null, { headers: authHeader }),
      );
      metrics.del.add(delMs);
      check(delRes, { 'delete 200': (r) => r.status === 200 });
    }
  });

  sleep(0.1);

  // ── STORAGE GROUP ──────────────────────────────────────────────────────────
  group('storage', () => {
    const { result: bucketRes, ms: bucketMs } = t(() => http.get(
      `${BASE_URL}/storage/v1/bucket`,
      { headers: authHeader },
    ));
    metrics.buckets.add(bucketMs);
    check(bucketRes, { 'buckets 200': (r) => r.status === 200 });
  });

  sleep(0.2);
}
