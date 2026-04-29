/**
 * GoBase Auth Benchmark
 * Tests: POST /auth/signup, POST /auth/login, GET /auth/me, POST /auth/refresh
 *
 * Run: k6 run benchmarks/auth.js
 * Stress: k6 run --vus 200 --duration 2m benchmarks/auth.js
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// ── Config ────────────────────────────────────────────────────────────────────
const BASE_URL   = __ENV.BASE_URL   || 'http://localhost:8000';
const TEST_EMAIL = __ENV.TEST_EMAIL || 'bench@gobase.test';
const TEST_PASS  = __ENV.TEST_PASSWORD || 'Bench@12345';

// ── Custom metrics ────────────────────────────────────────────────────────────
const loginLatency   = new Trend('login_latency',   true);
const signupLatency  = new Trend('signup_latency',  true);
const refreshLatency = new Trend('refresh_latency', true);
const authErrors     = new Counter('auth_errors');
const loginRate      = new Rate('login_success_rate');

// ── Load profile ──────────────────────────────────────────────────────────────
export const options = {
  stages: [
    { duration: '30s', target: 10  },  // warm up
    { duration: '1m',  target: 50  },  // ramp to 50 VUs
    { duration: '2m',  target: 100 },  // sustain 100 VUs
    { duration: '30s', target: 0   },  // cool down
  ],
  thresholds: {
    http_req_duration:    ['p(95)<200', 'p(99)<500'],
    http_req_failed:      ['rate<0.01'],
    login_success_rate:   ['rate>0.99'],
    login_latency:        ['p(95)<150'],
  },
};

const JSON_HEADERS = { 'Content-Type': 'application/json' };

// ── Helpers ───────────────────────────────────────────────────────────────────
function uniqueEmail() {
  return `bench_${Date.now()}_${Math.random().toString(36).slice(2)}@gobase.test`;
}

// ── Main scenario ─────────────────────────────────────────────────────────────
export default function () {
  // 1. Signup
  const email = uniqueEmail();
  const signupStart = Date.now();
  const signupRes = http.post(
    `${BASE_URL}/auth/signup`,
    JSON.stringify({ email, password: TEST_PASS }),
    { headers: JSON_HEADERS },
  );
  signupLatency.add(Date.now() - signupStart);

  const signedUp = check(signupRes, {
    'signup 201': (r) => r.status === 201,
    'signup has tokens': (r) => {
      try { return !!JSON.parse(r.body).data.tokens.access_token; } catch { return false; }
    },
  });
  if (!signedUp) {
    authErrors.add(1);
    sleep(1);
    return;
  }

  // 2. Login
  const loginStart = Date.now();
  const loginRes = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email, password: TEST_PASS }),
    { headers: JSON_HEADERS },
  );
  loginLatency.add(Date.now() - loginStart);

  const loggedIn = check(loginRes, {
    'login 200': (r) => r.status === 200,
    'login has access_token': (r) => {
      try { return !!JSON.parse(r.body).data.tokens.access_token; } catch { return false; }
    },
  });
  loginRate.add(loggedIn);

  if (!loggedIn) {
    authErrors.add(1);
    sleep(1);
    return;
  }

  let tokens;
  try {
    tokens = JSON.parse(loginRes.body).data.tokens;
  } catch {
    authErrors.add(1);
    return;
  }

  // 3. GET /auth/me
  const meRes = http.get(`${BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  check(meRes, {
    'me 200': (r) => r.status === 200,
    'me has email': (r) => {
      try { return JSON.parse(r.body).data.email === email; } catch { return false; }
    },
  });

  // 4. Refresh token
  const refreshStart = Date.now();
  const refreshRes = http.post(
    `${BASE_URL}/auth/refresh`,
    JSON.stringify({ refresh_token: tokens.refresh_token }),
    { headers: JSON_HEADERS },
  );
  refreshLatency.add(Date.now() - refreshStart);

  check(refreshRes, {
    'refresh 200': (r) => r.status === 200,
    'refresh has new token': (r) => {
      try { return !!JSON.parse(r.body).data.tokens.access_token; } catch { return false; }
    },
  });

  sleep(0.5);
}
