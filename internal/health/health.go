// Package health provides liveness and readiness probe handlers for microservices.
package health

import (
	"context"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

// Checker holds dependencies for health checks.
type Checker struct {
	ServiceName string
	DB          *gorm.DB
	Redis       *redis.Client
}

// LivenessHandler returns a simple liveness check (is the service running?).
func (h *Checker) LivenessHandler() fiber.Handler {
	return func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":  "alive",
			"service": h.ServiceName,
			"time":    time.Now().UTC(),
		})
	}
}

// ReadinessHandler returns a readiness check that verifies all dependencies.
// Returns 503 if any dependency is unreachable.
func (h *Checker) ReadinessHandler() fiber.Handler {
	return func(c *fiber.Ctx) error {
		checks := fiber.Map{}
		allHealthy := true

		// Check database
		if h.DB != nil {
			sqlDB, err := h.DB.DB()
			if err != nil {
				checks["database"] = "error: " + err.Error()
				allHealthy = false
			} else {
				ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
				defer cancel()
				if err := sqlDB.PingContext(ctx); err != nil {
					checks["database"] = "unreachable: " + err.Error()
					allHealthy = false
				} else {
					checks["database"] = "connected"
				}
			}
		}

		// Check Redis
		if h.Redis != nil {
			ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
			defer cancel()
			if err := h.Redis.Ping(ctx).Err(); err != nil {
				checks["redis"] = "unreachable: " + err.Error()
				allHealthy = false
			} else {
				checks["redis"] = "connected"
			}
		}

		result := fiber.Map{
			"service": h.ServiceName,
			"time":    time.Now().UTC(),
			"checks":  checks,
		}

		if allHealthy {
			result["status"] = "ready"
			return c.JSON(result)
		}

		result["status"] = "not_ready"
		return c.Status(fiber.StatusServiceUnavailable).JSON(result)
	}
}
