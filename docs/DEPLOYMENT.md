# GoBase — Deployment Guide

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Go | 1.21+ | Build Go services |
| Docker & Docker Compose | Latest | PostgreSQL, Redis, MinIO |
| Node.js + npm | 18+ | SDK build, Dashboard |
| Deno or Node.js | Latest | Edge functions runtime (optional) |

---

## Local Development

### Step 1: Clone & Configure

```bash
git clone <your-repo> && cd gobase

# Copy env template and customize
cp .env.example .env

# IMPORTANT: Change these in .env for security
# JWT_SECRET=<random-64-char-string>
# DB_PASSWORD=<strong-password>
# MINIO_SECRET_KEY=<strong-key>
```

### Step 2: Start Infrastructure

```bash
make docker-up
# Starts: PostgreSQL 15 (:5432), Redis 7 (:6379), MinIO (:9000/:9001)
# Wait ~5s for health checks to pass
```

### Step 3: Run Migrations

```bash
make migrate
# Creates tables: users, refresh_tokens, policies, realtime_changes
```

### Step 4: Start Services

```bash
# Option A: Run each in a separate terminal
make run-gateway      # :8000
make run-auth         # :8001
make run-rest         # :8002
make run-realtime     # :8003
make run-storage      # :8004
make run-functions    # :8005

# Option B: Run all in background
make run-auth &
make run-rest &
make run-realtime &
make run-storage &
make run-functions &
make run-gateway      # Keep in foreground
```

### Step 5: Start Dashboard

```bash
cd dashboard && npm install && npm run dev
# Opens at http://localhost:3000
```

### Step 6: Verify

```bash
# Gateway health
curl http://localhost:8000/health

# Signup a user
curl -X POST http://localhost:8000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gobase.dev","password":"admin123"}'
```

---

## Production Deployment

### Option A: Binary Deployment (VM / Bare Metal)

#### 1. Build all binaries

```bash
make build
# Produces: bin/gateway, bin/auth, bin/rest, bin/realtime, bin/storage, bin/functions
```

#### 2. Build dashboard

```bash
cd dashboard && npm run build
# Static files in dashboard/dist/ — serve via Nginx or gateway
```

#### 3. Build SDK (if publishing)

```bash
cd sdk && npm run build
# Publishable: npm publish
```

#### 4. Deploy

```bash
# Copy to server
scp -r bin/ .env user@server:/opt/gobase/
scp -r dashboard/dist/ user@server:/opt/gobase/dashboard/

# On the server, create a systemd service for each:
```

#### 5. Systemd service example (`/etc/systemd/system/gobase-gateway.service`)

```ini
[Unit]
Description=GoBase Gateway
After=network.target postgres.service redis.service

[Service]
Type=simple
User=gobase
WorkingDirectory=/opt/gobase
ExecStart=/opt/gobase/bin/gateway
Restart=always
RestartSec=5
EnvironmentFile=/opt/gobase/.env

[Install]
WantedBy=multi-user.target
```

```bash
# Create similar for: gobase-auth, gobase-rest, gobase-realtime, gobase-storage, gobase-functions
sudo systemctl enable gobase-gateway gobase-auth gobase-rest gobase-realtime gobase-storage gobase-functions
sudo systemctl start gobase-gateway gobase-auth gobase-rest gobase-realtime gobase-storage gobase-functions
```

---

### Option B: Docker Deployment (Recommended)

#### 1. Create Dockerfile

```dockerfile
# Build stage
FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o /bin/gateway ./app/gateway
RUN CGO_ENABLED=0 go build -o /bin/auth ./app/auth
RUN CGO_ENABLED=0 go build -o /bin/rest ./app/rest
RUN CGO_ENABLED=0 go build -o /bin/realtime ./app/realtime
RUN CGO_ENABLED=0 go build -o /bin/storage ./app/storage
RUN CGO_ENABLED=0 go build -o /bin/functions ./app/functions
RUN CGO_ENABLED=0 go build -o /bin/migrate ./app/migrate

# Runtime stage
FROM alpine:3.19
RUN apk add --no-cache ca-certificates
COPY --from=builder /bin/ /usr/local/bin/
ENTRYPOINT ["gateway"]
```

#### 2. Add services to docker-compose.yml

```yaml
  gateway:
    build: { context: ., dockerfile: Dockerfile }
    entrypoint: ["/usr/local/bin/gateway"]
    ports: ["8000:8000"]
    env_file: .env
    depends_on: [postgres, redis]

  auth:
    build: { context: ., dockerfile: Dockerfile }
    entrypoint: ["/usr/local/bin/auth"]
    env_file: .env
    depends_on: [postgres]

  rest:
    build: { context: ., dockerfile: Dockerfile }
    entrypoint: ["/usr/local/bin/rest"]
    env_file: .env
    depends_on: [postgres]

  # ... similar for realtime, storage, functions
```

#### 3. Deploy

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

---

### Option C: Kubernetes

Deploy each service as a separate Deployment + Service:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gobase-gateway
spec:
  replicas: 2
  selector:
    matchLabels:
      app: gobase-gateway
  template:
    spec:
      containers:
      - name: gateway
        image: your-registry/gobase:latest
        command: ["/usr/local/bin/gateway"]
        ports:
        - containerPort: 8000
        envFrom:
        - secretRef:
            name: gobase-env
```

---

## Production .env Checklist

```bash
# MUST CHANGE for production:
APP_ENV=production
LOG_LEVEL=info
JWT_SECRET=<generate: openssl rand -hex 32>
DB_PASSWORD=<strong-unique-password>
DB_HOST=<your-postgres-host>         # Not localhost
REDIS_HOST=<your-redis-host>      # Not localhost
MINIO_ENDPOINT=<your-minio-host>  # Not localhost
MINIO_ACCESS_KEY=<unique-key>
MINIO_SECRET_KEY=<strong-key>
MINIO_USE_SSL=true                # Enable for production

# Optional: adjust for scale
DB_MAX_OPEN_CONNS=50
RATE_LIMIT_MAX=1000
RATE_LIMIT_WINDOW=1m
```

---

## Nginx Reverse Proxy (Optional)

Serve everything behind Nginx with SSL:

```nginx
server {
    listen 443 ssl;
    server_name api.gobase.dev;

    ssl_certificate     /etc/letsencrypt/live/api.gobase.dev/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.gobase.dev/privkey.pem;

    # API Gateway
    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket upgrade for realtime
    location /realtime/ws {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}

server {
    listen 443 ssl;
    server_name dashboard.gobase.dev;

    ssl_certificate     /etc/letsencrypt/live/dashboard.gobase.dev/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dashboard.gobase.dev/privkey.pem;

    root /opt/gobase/dashboard/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## Service Dependency Order

```
1. Docker infra  → PostgreSQL, Redis, MinIO
2. make migrate  → Database tables
3. Auth service  → Required by all JWT-protected services
4. REST service  → Needs PostgreSQL + policies table
5. Storage       → Needs MinIO
6. Realtime      → Needs PostgreSQL
7. Functions     → Standalone (filesystem only)
8. Gateway       → Needs Redis + all upstream services
9. Dashboard     → Needs Gateway running
```
