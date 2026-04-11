package routes

import (
	"github.com/gofiber/fiber/v2"
	"github.com/sureshkumarselvaraj/gobase/app/controlplane/handlers"
	"github.com/sureshkumarselvaraj/gobase/internal/middleware"
)

func Register(app *fiber.App, cpHandler *handlers.ControlPlaneHandler, jwtSecret string) {
	api := app.Group("/controlplane/v1")

	// Protected routes
	protected := api.Group("/", middleware.JWTProtect(jwtSecret))
	
	protected.Post("/organizations", cpHandler.CreateOrganization)
	protected.Post("/projects", cpHandler.ProvisionProject)

	// Webhooks (unprotected, verified via signatures)
	api.Post("/webhooks/stripe", cpHandler.StripeWebhook)
}
