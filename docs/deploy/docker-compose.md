# Deploy GoBase with Docker Compose

The fastest way to run GoBase in production on a single server (VPS, dedicated box, or cloud VM).
Recommended for teams with traffic up to ~50k requests/day.

## Prerequisites

- Docker Engine 24+ and Docker Compose V2
- A server with at least **2 vCPU / 2 GB RAM** (4 GB recommended)
- A domain name pointed at the server

---

## 1. Clone & Configure

```bash
git clone https://github.com/infocrud/gobase.git
cd gobase

# Copy environment template
cp .env.example .env
```

Edit `.env` — at minimum change these:

```bash
APP_ENV=production

# Generate with: openssl rand -hex 32
JWT_SECRET=your-64-char-random-hex-secret-here

# Database
DB_HOST=postgres
DB_PORT=5432
DB_USER=gobase
DB_PASSWORD=change-me-strong-password
DB_NAME=gobase

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# MinIO
MINIO_ENDPOINT=minio:9000
MINIO_ACCESS_KEY=change-me-access-key
MINIO_SECRET_KEY=change-me-secret-key-min-16-chars
MINIO_USE_SSL=false

# SMTP (for email verification / password reset)
SMTP_HOST=smtp.yourdomain.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=your-smtp-password
SMTP_FROM=GoBase <noreply@yourdomain.com>
```

---

## 2. Run Migrations

```bash
# Start infrastructure first
docker compose up -d postgres redis minio

# Wait for healthy status (~15 seconds)
docker compose ps

# Run migrations (one-shot job)
docker compose -f docker-compose.yml -f docker-compose.prod.yml \
  --profile migrate run --rm migrate
```

---

## 3. Start All Services

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

This starts:
- `gateway`   → port 8000 (public)
- `auth`      → port 8001 (internal)
- `rest`      → port 8002 (internal)
- `realtime`  → port 8003 (internal)
- `storage`   → port 8004 (internal)
- `functions` → port 8005 (internal)

Verify:
```bash
curl http://localhost:8000/health/ready
# {"status":"ready","service":"gateway","checks":{"redis":"connected"}}
```

---

## 4. Nginx Reverse Proxy (SSL)

Install Nginx + Certbot:
```bash
sudo apt install nginx certbot python3-certbot-nginx -y
sudo certbot --nginx -d api.yourdomain.com
```

`/etc/nginx/sites-available/gobase`:
```nginx
server {
    listen 443 ssl;
    server_name api.yourdomain.com;

    ssl_certificate     /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;

    # WebSocket support (Realtime)
    location /realtime/ws {
        proxy_pass         http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection "upgrade";
        proxy_read_timeout 3600s;
    }

    location / {
        proxy_pass         http://localhost:8000;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
        client_max_body_size 50M;
    }
}

server {
    listen 80;
    server_name api.yourdomain.com;
    return 301 https://$host$request_uri;
}
```

```bash
sudo nginx -t && sudo systemctl reload nginx
```

---

## 5. Updates

```bash
git pull origin main
docker compose -f docker-compose.yml -f docker-compose.prod.yml build
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --no-deps gateway auth rest realtime storage functions
```

---

## Troubleshooting

```bash
# View logs for a service
docker compose logs -f auth

# Restart a single service
docker compose restart rest

# Check all service health
docker compose ps
```
