# Deploy GoBase on DigitalOcean

The most cost-effective cloud deployment for GoBase. A production-ready setup costs ~$30–60/month.

## Recommended Stack

| Component | DigitalOcean Product | ~Cost/mo |
|---|---|---|
| GoBase services | 1× Droplet (2 vCPU / 4 GB) | $24 |
| Database | Managed PostgreSQL (1 node) | $15 |
| Redis | Managed Redis (1 node) | $15 |
| Storage | Spaces (S3-compatible, 250 GB) | $5 |
| **Total** | | **~$59** |

---

## 1. Create Managed Databases

### PostgreSQL

```bash
# Install doctl: https://docs.digitalocean.com/reference/doctl/
doctl databases create gobase-db \
  --engine pg \
  --version 15 \
  --size db-s-1vcpu-1gb \
  --region nyc3 \
  --num-nodes 1

# Get connection details
doctl databases get gobase-db --format Host,Port,User,Password,Database
```

### Redis

```bash
doctl databases create gobase-redis \
  --engine redis \
  --version 7 \
  --size db-s-1vcpu-1gb \
  --region nyc3 \
  --num-nodes 1

doctl databases get gobase-redis --format Host,Port,Password
```

---

## 2. Create a Droplet

```bash
doctl compute droplet create gobase-server \
  --image ubuntu-22-04-x64 \
  --size s-2vcpu-4gb \
  --region nyc3 \
  --ssh-keys YOUR_SSH_KEY_ID \
  --wait
```

SSH in:
```bash
doctl compute ssh gobase-server
```

---

## 3. Configure the Server

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker
sudo apt install docker-compose-plugin -y

# Clone GoBase
git clone https://github.com/infocrud/gobase.git
cd gobase
cp .env.example .env
nano .env
```

Fill in `.env` using the database endpoints from step 1:

```bash
APP_ENV=production
JWT_SECRET=<openssl rand -hex 32>

# From Managed PostgreSQL
DB_HOST=gobase-db-do-user-XXXX.db.ondigitalocean.com
DB_PORT=25060
DB_USER=doadmin
DB_PASSWORD=XXXXXXXXXXXX
DB_NAME=defaultdb
DB_SSL_MODE=require

# From Managed Redis
REDIS_HOST=gobase-redis-do-user-XXXX.db.ondigitalocean.com
REDIS_PORT=25061
REDIS_PASSWORD=XXXXXXXXXXXX
REDIS_TLS=true

# DigitalOcean Spaces (S3-compatible)
MINIO_ENDPOINT=nyc3.digitaloceanspaces.com
MINIO_ACCESS_KEY=YOUR_SPACES_ACCESS_KEY
MINIO_SECRET_KEY=YOUR_SPACES_SECRET_KEY
MINIO_USE_SSL=true
```

---

## 4. DigitalOcean Spaces for Object Storage

Spaces is S3-compatible — GoBase's MinIO client works with it natively.

```bash
# Create a Space
doctl spaces create gobase-storage --region nyc3

# Create API key at: cloud.digitalocean.com/account/api/spaces
# Set MINIO_ACCESS_KEY and MINIO_SECRET_KEY in .env
```

---

## 5. Deploy

```bash
# Run migrations
docker compose -f docker-compose.yml -f docker-compose.prod.yml \
  --profile migrate run --rm migrate

# Start services (no local postgres/redis needed — using managed)
docker compose -f docker-compose.prod.yml up -d \
  gateway auth rest realtime storage functions
```

---

## 6. Add a Domain + TLS

```bash
# Point your domain A record to the Droplet IP
doctl compute domain create yourdomain.com --ip-address YOUR_DROPLET_IP
doctl compute domain records create yourdomain.com \
  --record-type A --record-name api --record-data YOUR_DROPLET_IP

# Install Nginx + Certbot on the Droplet
sudo apt install nginx certbot python3-certbot-nginx -y
sudo certbot --nginx -d api.yourdomain.com
```

Nginx config at `/etc/nginx/sites-available/gobase`:
```nginx
server {
    listen 443 ssl;
    server_name api.yourdomain.com;

    ssl_certificate     /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;

    location /realtime/ws {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 3600s;
    }

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto https;
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

## 7. Enable Droplet Backups

```bash
doctl compute droplet-action enable-backups YOUR_DROPLET_ID
```

---

## Monitoring

DigitalOcean includes built-in CPU/memory/disk graphs for Droplets and query analytics for Managed Databases.

For application-level metrics, GoBase exposes Prometheus metrics at `http://localhost:8000/metrics`.
Add a [DigitalOcean Monitoring alert](https://docs.digitalocean.com/products/monitoring/) for CPU > 80%.
