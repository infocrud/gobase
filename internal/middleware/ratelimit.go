package middleware

import (
	"context"
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/redis/go-redis/v9"
	"github.com/sureshkumarselvaraj/gobase/internal/config"
	"github.com/sureshkumarselvaraj/gobase/pkg/response"
)

// RateLimit returns a Redis-backed sliding window rate limiter middleware.
// It keys on authenticated user ID when available, falling back to IP address.
func RateLimit(rdb *redis.Client, cfg config.RateLimitConfig) fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Use user ID if authenticated, otherwise use IP
		key := rateLimitKey(c)
		ctx := context.Background()
		now := time.Now()

		// Sliding window: remove old entries, count current, add new
		windowStart := now.Add(-cfg.Window)

		pipe := rdb.Pipeline()

		// Remove entries outside the window
		pipe.ZRemRangeByScore(ctx, key, "0", fmt.Sprintf("%d", windowStart.UnixNano()))

		// Count current entries in the window
		countCmd := pipe.ZCard(ctx, key)

		// Execute pipeline
		_, err := pipe.Exec(ctx)
		if err != nil {
			// On Redis failure, allow the request (fail-open)
			return c.Next()
		}

		count := countCmd.Val()

		if count >= int64(cfg.Max) {
			retryAfter := int(cfg.Window.Seconds())
			c.Set("Retry-After", fmt.Sprintf("%d", retryAfter))
			c.Set("X-RateLimit-Limit", fmt.Sprintf("%d", cfg.Max))
			c.Set("X-RateLimit-Remaining", "0")
			c.Set("X-RateLimit-Reset", fmt.Sprintf("%d", now.Add(cfg.Window).Unix()))
			return response.Error(c, fiber.StatusTooManyRequests, "Rate limit exceeded. Try again later.")
		}

		// Add current request to the window
		rdb.ZAdd(ctx, key, redis.Z{
			Score:  float64(now.UnixNano()),
			Member: fmt.Sprintf("%d", now.UnixNano()),
		})

		// Set expiry on the key
		rdb.Expire(ctx, key, cfg.Window+time.Second)

		// Set rate limit headers
		remaining := int64(cfg.Max) - count - 1
		if remaining < 0 {
			remaining = 0
		}
		c.Set("X-RateLimit-Limit", fmt.Sprintf("%d", cfg.Max))
		c.Set("X-RateLimit-Remaining", fmt.Sprintf("%d", remaining))
		c.Set("X-RateLimit-Reset", fmt.Sprintf("%d", now.Add(cfg.Window).Unix()))

		return c.Next()
	}
}

// rateLimitKey generates the Redis key for rate limiting.
// Uses user ID for authenticated users (more precise), IP for anonymous.
func rateLimitKey(c *fiber.Ctx) string {
	if userID, ok := c.Locals("user_id").(uint); ok && userID > 0 {
		return fmt.Sprintf("ratelimit:user:%d", userID)
	}
	return fmt.Sprintf("ratelimit:ip:%s", c.IP())
}
