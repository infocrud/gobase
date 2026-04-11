package middleware

import (
	"github.com/gofiber/fiber/v2"
	"github.com/sureshkumarselvaraj/gobase/pkg/response"
)

// AdminOnly returns middleware that restricts access to admin users.
func AdminOnly() fiber.Handler {
	return func(c *fiber.Ctx) error {
		role, _ := c.Locals("user_role").(string)
		if role != "admin" {
			return response.Error(c, fiber.StatusForbidden, "Admin access required")
		}
		return c.Next()
	}
}
