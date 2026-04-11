# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project: GoBase (Supabase clone)

Open-source BaaS platform in Go providing auth, auto-generated REST APIs, realtime subscriptions, file storage, and edge functions as microservices.

## Stack

- Go Fiber v2, GORM, MySQL 8
- Redis for rate limiting/sessions
- MinIO for object storage
- JWT (golang-jwt/jwt/v5), OAuth2 (Google/GitHub)
- Zerolog (structured logging), Viper (config), Prometheus (metrics)

## Commands

```bash
# Infrastructure
make docker-up          # Start MySQL 8, Redis 7, MinIO
make migrate            # Run GORM auto-migrations

# Build all 8 binaries to ./bin/
make build

# Run individual services
make run-gateway        # Port 8000
make run-auth           # Port 8001
make run-rest           # Port 8002
make run-realtime       # Port 8003
make run-storage        # Port 8004
make run-functions      # Port 8005

# Test
make test               # go test ./... -v (requires MySQL + Redis running)
make e2e                # bash e2e_test.sh

# Single package test
go test ./pkg/jwt/... -v -run TestTokenGeneration

# Lint
make vet                # go vet
# golangci-lint runs on CI; see .golangci.yml for enabled linters
```

## Architecture

Six independent microservices behind a reverse-proxy gateway:

```
Client → Gateway (8000) → Auth (8001)      — JWT, OAuth2, email verification
                        → REST (8002)      — Dynamic CRUD on any table, RLS, filters
                        → Realtime (8003) — WebSocket hub, DB-change subscriptions
                        → Storage (8004)  — MinIO/S3 uploads, signed URLs
                        → Functions (8005)— Deno/Node.js edge-function runner
                              ↓
                    MySQL 8 / Redis 7 / MinIO
```

Each service follows the same startup sequence: load config → connect DB/Redis → auto-migrate (dev only) → wire services/handlers → register middleware → register routes → graceful shutdown on SIGINT/SIGTERM.

**Migrate** (`app/migrate`) and **Cleanup** (`app/cleanup`) are background jobs, not HTTP services.

## Code Conventions

**Handlers** — methods on a handler struct, always parse via `c.BodyParser`, always return `response.Success()` or `response.Error()` (never raw Fiber responses):

```go
func (h *AuthHandler) Signup(c *fiber.Ctx) error {
    var input services.SignupInput
    if err := c.BodyParser(&input); err != nil { ... }
    user, tokens, err := h.authService.Signup(input)
    if err != nil { return response.Error(c, fiber.StatusConflict, err.Error()) }
    return response.SuccessWithStatus(c, fiber.StatusCreated, fiber.Map{...})
}
```

**DB Models** — embed `internal/db.BaseModel` (ID, CreatedAt, UpdatedAt, DeletedAt), define `TableName()`:

```go
type User struct {
    db.BaseModel
    Email string `gorm:"type:varchar(255);uniqueIndex;not null"`
}
func (User) TableName() string { return "users" }
```

**Errors** — use `pkg/apperror` for structured errors with HTTP codes; the centralized `internal/handler.ErrorHandler` (set in Fiber config) maps them to responses:

```go
var ErrUserExists = apperror.New(apperror.CodeUserExists, "user with this email already exists")
```

**Services** — receive `*gorm.DB` and config structs via constructor injection; no global state.

**Routes** — registered in a `routes` package per service, accepting a `Handlers` struct. Protected groups use `middleware.JWTProtect(secret)`.

**Config** — loaded from `.env` via Viper (`internal/config`). Copy `.env.example` to `.env` to start. Production mode (`APP_ENV=production`) enforces hard security checks (non-default JWT_SECRET, MinIO credentials, etc.).

## Key Internal Packages

| Package | Role |
|---|---|
| `internal/config` | Viper env loading + production validation |
| `internal/db` | DB connection, BaseModel, all shared models |
| `internal/middleware` | CORS, JWT auth, rate limit (Redis), metrics, logger, RLS policy check |
| `internal/policy` | Row-level security engine — evaluates Policy rules, injects WHERE clauses |
| `internal/health` | `/health/live` and `/health/ready` endpoints |
| `pkg/apperror` | Structured error codes with HTTP status mapping |
| `pkg/jwt` | Token generation, validation, hashing |
| `pkg/response` | `Success()`, `SuccessWithStatus()`, `Error()`, `AppError()` helpers |

## REST Engine (app/rest)

The REST service provides dynamic CRUD on any MySQL table without code generation. It uses schema introspection (`engine/schema_cache.go`) to validate columns, and `engine/filter.go` to parse query-string filters (`?column=eq.value`). Row-level security is applied by `middleware.PolicyCheck`, which injects a WHERE clause via `c.Locals("policy_where", ...)` before the CRUD handler queries the DB.

## Environment Variables

See `.env.example` for all 40+ variables. Critical ones:

- `JWT_SECRET` — must be a 64-char random hex in production
- `DB_*` — MySQL connection
- `REDIS_*` — Redis connection
- `MINIO_*` — object storage
- `SMTP_*` — email for verification/reset flows
- `GOOGLE_CLIENT_ID/SECRET`, `GITHUB_CLIENT_ID/SECRET` — OAuth2 (optional)
- `APP_ENV` — `development` (auto-migrate, debug logs) vs `production`

## Service Ports

| Service | Port |
|---|---|
| gateway | 8000 |
| auth | 8001 |
| rest | 8002 |
| realtime | 8003 |
| storage | 8004 |
| functions | 8005 |

## Current Phase: 1 — Auth
