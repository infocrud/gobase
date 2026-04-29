# Deploy GoBase on AWS

This guide deploys GoBase on a single EC2 instance with RDS PostgreSQL, ElastiCache Redis,
and S3-compatible storage. Estimated cost: ~$80–150/month for a small production setup.

## Architecture

```
Internet → ALB (443) → EC2 (Docker Compose) → RDS PostgreSQL
                                             → ElastiCache Redis
                                             → S3 or MinIO on EC2
```

For scale-out, replace EC2 + Docker Compose with ECS Fargate (see end of guide).

---

## 1. Provision Infrastructure

### RDS PostgreSQL
```bash
aws rds create-db-instance \
  --db-instance-identifier gobase-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15 \
  --master-username gobase \
  --master-user-password YOUR_STRONG_PASSWORD \
  --allocated-storage 20 \
  --storage-type gp3 \
  --vpc-security-group-ids sg-XXXXXXXX \
  --backup-retention-period 7 \
  --multi-az \
  --region us-east-1
```

### ElastiCache Redis
```bash
aws elasticache create-cache-cluster \
  --cache-cluster-id gobase-redis \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --num-cache-nodes 1 \
  --region us-east-1
```

### EC2 Instance
```bash
# Launch Ubuntu 22.04 LTS, t3.small or larger
aws ec2 run-instances \
  --image-id ami-0c7217cdde317cfec \  # Ubuntu 22.04 us-east-1
  --instance-type t3.small \
  --key-name YOUR_KEY_PAIR \
  --security-group-ids sg-XXXXXXXX \
  --region us-east-1
```

---

## 2. Configure EC2

```bash
# SSH into the instance
ssh -i your-key.pem ubuntu@YOUR_EC2_IP

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker ubuntu
newgrp docker

# Install Docker Compose V2
sudo apt install docker-compose-plugin -y

# Clone GoBase
git clone https://github.com/infocrud/gobase.git
cd gobase
cp .env.example .env
```

Edit `.env` with your RDS and ElastiCache endpoints:
```bash
APP_ENV=production
JWT_SECRET=<openssl rand -hex 32>

DB_HOST=gobase-db.xxxxxx.us-east-1.rds.amazonaws.com
DB_PORT=5432
DB_USER=gobase
DB_PASSWORD=YOUR_STRONG_PASSWORD
DB_NAME=gobase

REDIS_HOST=gobase-redis.xxxxxx.cache.amazonaws.com
REDIS_PORT=6379

# For MinIO (local) or use AWS S3-compatible endpoint
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=your-access-key
MINIO_SECRET_KEY=your-secret-key
```

---

## 3. Deploy

```bash
# Start infrastructure (MinIO only — using managed RDS/Redis)
docker compose up -d minio

# Run migrations
docker compose -f docker-compose.yml -f docker-compose.prod.yml \
  --profile migrate run --rm migrate

# Start GoBase services
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d \
  gateway auth rest realtime storage functions
```

---

## 4. Application Load Balancer

1. **Create Target Group**: HTTP, port 8000, health check `/health/ready`
2. **Register EC2 instance** in the target group
3. **Create ALB**:
   - Listener 443 (HTTPS) → forward to target group
   - Listener 80 → redirect to 443
   - Attach ACM certificate for your domain
4. **Point domain** to ALB DNS name via Route 53 CNAME

---

## 5. Security Group Rules

| Source | Port | Purpose |
|---|---|---|
| 0.0.0.0/0 | 443 | HTTPS from ALB |
| ALB security group | 8000 | GoBase gateway |
| EC2 security group | 5432 | RDS (internal only) |
| EC2 security group | 6379 | Redis (internal only) |

---

## 6. Using AWS S3 Instead of MinIO

Update `.env`:
```bash
MINIO_ENDPOINT=s3.amazonaws.com
MINIO_ACCESS_KEY=YOUR_AWS_ACCESS_KEY_ID
MINIO_SECRET_KEY=YOUR_AWS_SECRET_ACCESS_KEY
MINIO_USE_SSL=true
MINIO_BUCKET_REGION=us-east-1
```

Attach an IAM role to the EC2 instance with `s3:*` on your buckets.

---

## Scale Out with ECS Fargate

For traffic beyond a single instance, migrate to ECS:

```bash
# Push image to ECR
aws ecr create-repository --repository-name gobase --region us-east-1
docker tag YOUR_REGISTRY/gobase:v1.0.0 YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/gobase:v1.0.0
docker push YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/gobase:v1.0.0
```

Create an ECS task definition for each service (gateway, auth, rest, etc.) pointing to the ECR image,
with the appropriate entrypoint (`/usr/local/bin/gateway`, `/usr/local/bin/auth`, etc.).
Use ECS Service Auto Scaling with CPU-based target tracking.
