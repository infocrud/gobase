package middleware

import (
	"github.com/gofiber/fiber/v2"
	"github.com/sureshkumarselvaraj/gobase/internal/policy"
	"github.com/sureshkumarselvaraj/gobase/pkg/response"
)

// PolicyCheck returns a Fiber middleware that evaluates RLS policies.
// It injects the resulting WHERE clause into c.Locals("policy_where") for the CRUD handler.
func PolicyCheck(engine *policy.Engine) fiber.Handler {
	return func(c *fiber.Ctx) error {
		table := c.Params("table")
		if table == "" || table[0] == '_' {
			// Skip policy check for internal endpoints (_schema, _policies)
			return c.Next()
		}

		// Map HTTP method to SQL operation
		operation := httpMethodToOperation(c.Method())

		// Get authenticated user
		userID, _ := c.Locals("user_id").(uint)
		email, _ := c.Locals("user_email").(string)

		// Evaluate policy
		whereClause, allowed := engine.Evaluate(userID, email, table, operation)
		if !allowed {
			return response.Error(c, fiber.StatusForbidden,
				"Access denied: no policy allows this operation on table '"+table+"'")
		}

		// Inject WHERE clause for CRUD handler to use
		c.Locals("policy_where", whereClause)

		return c.Next()
	}
}

func httpMethodToOperation(method string) string {
	switch method {
	case "GET":
		return "SELECT"
	case "POST":
		return "INSERT"
	case "PUT", "PATCH":
		return "UPDATE"
	case "DELETE":
		return "DELETE"
	default:
		return "SELECT"
	}
}
