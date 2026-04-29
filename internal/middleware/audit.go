package middleware

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/sureshkumarselvaraj/gobase/internal/db"
	"gorm.io/gorm"
)

// AuditLog returns a middleware that writes an AuditLog row after every
// non-GET request that has an authenticated user. Safe to skip on read paths
// by not mounting it there, or extend the skip list as needed.
func AuditLog(database *gorm.DB) fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Run the handler first so we capture the status code
		err := c.Next()

		method := c.Method()
		// Only log state-changing requests (or override per route by not mounting)
		if method == "GET" || method == "HEAD" || method == "OPTIONS" {
			return err
		}

		var userID *uint
		var userEmail string
		if uid, ok := c.Locals("user_id").(uint); ok && uid != 0 {
			userID = &uid
		}
		if email, ok := c.Locals("user_email").(string); ok {
			userEmail = email
		}

		// Build a short action string from method + path prefix
		action := buildAction(method, c.Path())
		resource := strings.TrimPrefix(c.Path(), "/")

		var meta string
		if len(c.Body()) > 0 && len(c.Body()) <= 4096 {
			// Store body keys only (not values) to avoid logging secrets
			var bodyMap map[string]interface{}
			if json.Unmarshal(c.Body(), &bodyMap) == nil {
				keys := make([]string, 0, len(bodyMap))
				for k := range bodyMap {
					keys = append(keys, k)
				}
				b, _ := json.Marshal(fiber.Map{"fields": keys})
				meta = string(b)
			}
		}

		entry := db.AuditLog{
			UserID:     userID,
			UserEmail:  userEmail,
			Action:     action,
			Resource:   resource,
			Method:     method,
			StatusCode: c.Response().StatusCode(),
			IPAddress:  c.IP(),
			UserAgent:  c.Get("User-Agent"),
			RequestID:  c.GetRespHeader("X-Request-ID"),
			Metadata:   meta,
		}

		// Fire-and-forget — don't block the response
		go database.Create(&entry)

		return err
	}
}

func buildAction(method, path string) string {
	parts := strings.SplitN(strings.TrimPrefix(path, "/"), "/", 3)
	if len(parts) == 0 {
		return fmt.Sprintf("%s.request", strings.ToLower(method))
	}
	switch parts[0] {
	case "auth":
		if len(parts) > 1 {
			return "auth." + parts[1]
		}
		return "auth.request"
	case "rest":
		switch method {
		case "POST":
			return "rest.insert"
		case "PATCH", "PUT":
			return "rest.update"
		case "DELETE":
			return "rest.delete"
		}
		return "rest.request"
	case "storage":
		return "storage." + strings.ToLower(method)
	case "functions":
		return "functions.invoke"
	default:
		return fmt.Sprintf("%s.%s", parts[0], strings.ToLower(method))
	}
}
