package routes

import (
	"github.com/gofiber/fiber/v2"
	"github.com/sureshkumarselvaraj/gobase/app/controlplane/handlers"
	"github.com/sureshkumarselvaraj/gobase/internal/middleware"
)

func Register(app *fiber.App, h *handlers.ControlPlaneHandler, jwtSecret string) {
	api := app.Group("/controlplane/v1")

	protected := api.Group("/", middleware.JWTProtect(jwtSecret))

	// Organizations
	protected.Post("/organizations", h.CreateOrganization)
	protected.Get("/organizations", h.ListOrganizations)
	protected.Get("/organizations/:orgID", h.GetOrganization)
	protected.Patch("/organizations/:orgID", h.UpdateOrganization)
	protected.Delete("/organizations/:orgID", h.DeleteOrganization)

	// Projects
	protected.Post("/projects", h.ProvisionProject)
	protected.Get("/organizations/:orgID/projects", h.ListProjects)
	protected.Get("/projects/:projectID", h.GetProject)
	protected.Patch("/projects/:projectID", h.UpdateProject)
	protected.Delete("/projects/:projectID", h.DeleteProject)

	// API Keys (scoped to project)
	protected.Post("/projects/:projectID/keys", h.CreateAPIKey)
	protected.Get("/projects/:projectID/keys", h.ListAPIKeys)
	protected.Delete("/projects/:projectID/keys/:keyID", h.DeleteAPIKey)

	// Webhooks — verified via Stripe signature, not JWT
	api.Post("/webhooks/stripe", h.StripeWebhook)
}
