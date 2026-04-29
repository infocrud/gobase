# Deploy GoBase on Kubernetes

Recommended for teams that need horizontal scaling, zero-downtime deployments, and multi-region HA.
Tested on: GKE, EKS, DigitalOcean Kubernetes (DOKS), and k3s.

## Prerequisites

- `kubectl` configured for your cluster
- A container registry (Docker Hub, GHCR, ECR, GCR)
- `cert-manager` for automatic TLS (optional but recommended)
- A managed PostgreSQL and Redis (strongly recommended over in-cluster DBs)

---

## 1. Build & Push Image

```bash
# Build the multi-binary image
docker build -t YOUR_REGISTRY/gobase:v1.0.0 .
docker push YOUR_REGISTRY/gobase:v1.0.0
```

Update the `image:` field in `docs/deploy/k8s/deployments.yaml` before applying.

---

## 2. Apply Manifests

```bash
# Apply in order
kubectl apply -f docs/deploy/k8s/namespace.yaml
kubectl apply -f docs/deploy/k8s/secret.yaml       # edit first!
kubectl apply -f docs/deploy/k8s/configmap.yaml    # edit first!
kubectl apply -f docs/deploy/k8s/deployments.yaml
kubectl apply -f docs/deploy/k8s/services.yaml
kubectl apply -f docs/deploy/k8s/ingress.yaml      # edit domain first!
```

---

## 3. Run Migrations

```bash
kubectl run migrate --restart=Never --rm -it \
  --image=YOUR_REGISTRY/gobase:v1.0.0 \
  --command -- /usr/local/bin/migrate \
  --env-from configmap/gobase-config \
  --env-from secret/gobase-secrets \
  -n gobase
```

---

## 4. Verify

```bash
# Check pod status
kubectl get pods -n gobase

# Check gateway logs
kubectl logs -n gobase -l app=gateway --tail=50

# Port-forward to test locally
kubectl port-forward -n gobase svc/gateway-svc 8000:8000
curl http://localhost:8000/health/ready
```

---

## 5. Horizontal Pod Autoscaler (HPA)

Scale REST pods automatically under load:

```bash
kubectl autoscale deployment rest \
  --cpu-percent=70 \
  --min=2 \
  --max=20 \
  -n gobase
```

Requires metrics-server:
```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
```

---

## 6. Rolling Updates

```bash
# Update image version
kubectl set image deployment/gateway gateway=YOUR_REGISTRY/gobase:v1.1.0 -n gobase
kubectl set image deployment/auth    auth=YOUR_REGISTRY/gobase:v1.1.0    -n gobase
kubectl set image deployment/rest    rest=YOUR_REGISTRY/gobase:v1.1.0    -n gobase
# ... repeat for other services

# Watch rollout
kubectl rollout status deployment/rest -n gobase

# Rollback if something breaks
kubectl rollout undo deployment/rest -n gobase
```

---

## Managed Database Recommendations

| Provider | PostgreSQL | Redis |
|---|---|---|
| AWS | RDS for PostgreSQL | ElastiCache |
| GCP | Cloud SQL | Memorystore |
| Azure | Azure Database for PostgreSQL | Azure Cache for Redis |
| DigitalOcean | Managed PostgreSQL | Managed Redis |

Update `DB_HOST`, `REDIS_HOST` in `configmap.yaml` to point to the managed endpoints.
Never run a stateful database inside Kubernetes pods in production.
