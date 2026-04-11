package routes

import (
	"github.com/gofiber/fiber/v2"
	"github.com/sureshkumarselvaraj/gobase/app/rest/engine"
	"github.com/sureshkumarselvaraj/gobase/internal/middleware"
	"github.com/sureshkumarselvaraj/gobase/internal/policy"
	"github.com/sureshkumarselvaraj/gobase/pkg/response"
)

// Deps holds the dependencies needed for REST route registration.
type Deps struct {
	SchemaCache  *engine.SchemaCache
	PolicyEngine *policy.Engine
	CRUDHandler  *engine.CRUDHandler
	JWTSecret    string
}

// Register sets up all REST API routes on the given Fiber app.
func Register(app *fiber.App, d Deps) {
	rest := app.Group("/rest/v1")

	// Internal management endpoints (no policy check)
	rest.Get("/_schema", func(c *fiber.Ctx) error {
		return response.Success(c, d.SchemaCache.ListTables())
	})

	rest.Post("/_schema/refresh", middleware.JWTProtect(d.JWTSecret), func(c *fiber.Ctx) error {
		if err := d.SchemaCache.Refresh(); err != nil {
			return response.Error(c, fiber.StatusInternalServerError, "Failed to refresh schema")
		}
		return response.Success(c, fiber.Map{"message": "Schema refreshed", "tables": d.SchemaCache.ListTables()})
	})

	rest.Post("/_policies/reload", middleware.JWTProtect(d.JWTSecret), func(c *fiber.Ctx) error {
		d.PolicyEngine.Reload()
		return response.Success(c, fiber.Map{"message": "Policies reloaded"})
	})

	// Dynamic CRUD routes with JWT + RLS policy enforcement
	tableRoutes := rest.Group("/:table",
		middleware.JWTProtect(d.JWTSecret),
		middleware.PolicyCheck(d.PolicyEngine),
	)

	tableRoutes.Get("/", d.CRUDHandler.List)
	tableRoutes.Get("/:id", d.CRUDHandler.GetByID)
	tableRoutes.Post("/", d.CRUDHandler.Create)
	tableRoutes.Patch("/:id", d.CRUDHandler.Update)
	tableRoutes.Delete("/:id", d.CRUDHandler.Delete)
}
