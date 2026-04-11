# ─── Build Stage ──────────────────────────────────────
FROM golang:1.22-alpine AS builder

RUN apk add --no-cache git ca-certificates

WORKDIR /app

# Cache dependency downloads
COPY go.mod go.sum ./
RUN go mod download

# Copy source and build all binaries
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /bin/gateway   ./app/gateway
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /bin/auth      ./app/auth
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /bin/rest      ./app/rest
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /bin/realtime  ./app/realtime
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /bin/storage   ./app/storage
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /bin/functions ./app/functions
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /bin/migrate   ./app/migrate

# ─── Runtime Stage ────────────────────────────────────
FROM alpine:3.20

RUN apk add --no-cache ca-certificates tzdata \
    && addgroup -S gobase \
    && adduser -S -G gobase gobase

COPY --from=builder /bin/ /usr/local/bin/

# Run as non-root
USER gobase

# Default entrypoint is the gateway
ENTRYPOINT ["gateway"]

EXPOSE 8000
