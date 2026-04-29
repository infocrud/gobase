# GoBase Benchmarks

Load tests using [k6](https://k6.io) — a modern open-source load testing tool.

## Prerequisites

```bash
# macOS
brew install k6

# Linux
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg \
  --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" \
  | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update && sudo apt-get install k6
```

GoBase must be running before executing any benchmark:
```bash
make docker-up && make migrate
make run-gateway & make run-auth & make run-rest &
```

## Scripts

| Script | What it tests |
|---|---|
| `auth.js` | Signup + Login throughput |
| `rest.js` | CRUD operations on a test table |
| `concurrent.js` | 1,000 concurrent WebSocket + REST connections |
| `full-suite.js` | Combined scenario (recommended for comparisons) |

## Quick Run

```bash
# Smoke test — 10 VUs, 30 seconds
k6 run benchmarks/auth.js

# Load test — 100 VUs, 5 minutes
k6 run --vus 100 --duration 5m benchmarks/rest.js

# Stress test — ramp to 1,000 VUs
k6 run benchmarks/concurrent.js

# Full suite with HTML report
k6 run --out json=results/run.json benchmarks/full-suite.js
```

## Environment Variables

```bash
BASE_URL=http://localhost:8000   # default
TEST_EMAIL=bench@test.com        # default
TEST_PASSWORD=Bench@12345        # default
TABLE_NAME=bench_items           # default — must exist in your DB
```

Override with: `k6 run -e BASE_URL=https://your-api.com benchmarks/auth.js`

## Interpreting Results

k6 prints a summary after each run. Key metrics:

| Metric | Good | Target |
|---|---|---|
| `http_req_duration p(95)` | < 100ms | < 50ms |
| `http_req_failed` | < 0.1% | 0% |
| `iterations` | — | maximize |
| `vus_max` | — | 1000 |
