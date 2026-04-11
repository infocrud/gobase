package middleware

import (
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/sureshkumarselvaraj/gobase/pkg/jwt"
	"github.com/sureshkumarselvaraj/gobase/pkg/response"
)

// JWTProtect returns a Fiber middleware that validates JWT bearer tokens.
// On success, it sets "user_id" and "user_email" in c.Locals().
func JWTProtect(jwtSecret string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return response.Error(c, fiber.StatusUnauthorized, "Missing authorization header")
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
			return response.Error(c, fiber.StatusUnauthorized, "Invalid authorization header format")
		}

		tokenString := parts[1]
		claims, err := jwt.ValidateToken(tokenString, jwtSecret)
		if err != nil {
			return response.Error(c, fiber.StatusUnauthorized, "Invalid or expired token")
		}

		// Set user info in context for downstream handlers
		c.Locals("user_id", claims.UserID)
		c.Locals("user_email", claims.Email)
		c.Locals("user_role", claims.Role)

		return c.Next()
	}
}
