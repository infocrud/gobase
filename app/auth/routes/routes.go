package routes

import (
	"github.com/gofiber/fiber/v2"
	"github.com/sureshkumarselvaraj/gobase/app/auth/handlers"
	"github.com/sureshkumarselvaraj/gobase/internal/middleware"
)

// Handlers holds all auth handler instances needed for route registration.
type Handlers struct {
	Auth   *handlers.AuthHandler
	OAuth  *handlers.OAuthHandler
	Verify *handlers.VerifyHandler
	Reset  *handlers.ResetHandler
	Admin  *handlers.AdminHandler
	Audit  *handlers.AuditHandler
}

// Register sets up all auth routes on the given Fiber app.
func Register(app *fiber.App, h Handlers, jwtSecret string) {
	auth := app.Group("/auth")

	// Public routes
	auth.Post("/signup", h.Auth.Signup)
	auth.Post("/login", h.Auth.Login)
	auth.Post("/refresh", h.Auth.Refresh)
	auth.Get("/verify", h.Verify.Verify)
	auth.Post("/verify/resend", h.Verify.Resend)
	auth.Post("/forgot-password", h.Reset.ForgotPassword)
	auth.Post("/reset-password", h.Reset.ResetPassword)

	// OAuth routes — register the static /providers path before the :provider
	// wildcard so it isn't captured as a provider name.
	auth.Get("/oauth/providers", h.OAuth.Providers)
	auth.Get("/oauth/:provider", h.OAuth.Redirect)
	auth.Get("/oauth/:provider/callback", h.OAuth.Callback)

	// Protected routes (require JWT)
	protected := auth.Group("", middleware.JWTProtect(jwtSecret))
	protected.Post("/logout", h.Auth.Logout)
	protected.Get("/me", h.Auth.Me)

	// Admin routes (require JWT + admin role)
	admin := auth.Group("/admin", middleware.JWTProtect(jwtSecret), middleware.AdminOnly())
	admin.Get("/users", h.Admin.ListUsers)
	admin.Get("/users/:id", h.Admin.GetUser)
	admin.Patch("/users/:id", h.Admin.UpdateUser)
	admin.Delete("/users/:id", h.Admin.DeleteUser)

	// Audit logs (admin only)
	if h.Audit != nil {
		admin.Get("/audit", h.Audit.ListAuditLogs)
	}
}
