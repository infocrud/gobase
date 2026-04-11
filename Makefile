.PHONY: help run-gateway run-auth run-rest run-realtime run-storage run-functions build migrate cleanup docker-up docker-down clean tidy vet test

# ─── Default ───────────────────────────────────────────
help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ─── Run Services ──────────────────────────────────────
run-gateway: ## Run the API gateway (port 8000)
	go run ./app/gateway

run-auth: ## Run the auth service (port 8001)
	go run ./app/auth

run-rest: ## Run the REST service (port 8002)
	go run ./app/rest

run-realtime: ## Run the realtime service (port 8003)
	go run ./app/realtime

run-storage: ## Run the storage service (port 8004)
	go run ./app/storage

run-functions: ## Run the functions service (port 8005)
	go run ./app/functions

run-controlplane: ## Run the control plane service (port 8008)
	go run ./app/controlplane

run-orchestrator: ## Run the infrastructure orchestrator
	go run ./app/orchestrator

# ─── Build ─────────────────────────────────────────────
build: ## Build all service binaries to ./bin/
	@mkdir -p bin
	go build -o bin/gateway   ./app/gateway
	go build -o bin/auth      ./app/auth
	go build -o bin/rest      ./app/rest
	go build -o bin/realtime  ./app/realtime
	go build -o bin/storage   ./app/storage
	go build -o bin/functions ./app/functions
	go build -o bin/cleanup   ./app/cleanup
	@echo "✅ All binaries built in ./bin/"

# ─── Database ──────────────────────────────────────────
migrate: ## Run GORM auto-migrations
	go run ./app/migrate

cleanup: ## Clean up expired/revoked refresh tokens
	go run ./app/cleanup

# ─── Docker ────────────────────────────────────────────
docker-up: ## Start MySQL, Redis, MinIO via Docker Compose
	docker compose up -d
	@echo "⏳ Waiting for services to be healthy..."
	@sleep 5
	@echo "✅ Infrastructure ready"

docker-down: ## Stop all Docker services
	docker compose down

# ─── Utilities ─────────────────────────────────────────
tidy: ## Tidy Go modules
	go mod tidy

vet: ## Run go vet
	go vet ./...

clean: ## Remove build artifacts
	rm -rf bin/
	@echo "🧹 Cleaned"

test: ## Run all unit tests
	go test ./... -v

e2e: ## Run E2E test suite (services must be running)
	bash e2e_test.sh
