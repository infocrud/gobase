package handlers

import (
	"crypto/rand"
	"encoding/hex"

	"github.com/gofiber/fiber/v2"
	"github.com/sureshkumarselvaraj/gobase/app/auth/services"
	"github.com/sureshkumarselvaraj/gobase/pkg/response"
)

// OAuthHandler handles OAuth2 endpoints.
type OAuthHandler struct {
	authService  *services.AuthService
	oauthService *services.OAuthService
}

// NewOAuthHandler creates a new OAuthHandler.
func NewOAuthHandler(authService *services.AuthService, oauthService *services.OAuthService) *OAuthHandler {
	return &OAuthHandler{
		authService:  authService,
		oauthService: oauthService,
	}
}

// Redirect handles GET /auth/oauth/:provider — redirects to OAuth provider.
func (h *OAuthHandler) Redirect(c *fiber.Ctx) error {
	provider := c.Params("provider")
	if provider != "google" && provider != "github" {
		return response.Error(c, fiber.StatusBadRequest, "Unsupported OAuth provider. Use 'google' or 'github'")
	}

	// Generate random state for CSRF protection
	state, err := generateState()
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, "Failed to generate OAuth state")
	}

	// Store state in cookie for validation in callback
	c.Cookie(&fiber.Cookie{
		Name:     "oauth_state",
		Value:    state,
		HTTPOnly: true,
		Secure:   false, // Set to true in production
		SameSite: "Lax",
		MaxAge:   600, // 10 minutes
	})

	url, err := h.oauthService.GetAuthURL(provider, state)
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, "Failed to generate OAuth URL")
	}

	return c.Redirect(url, fiber.StatusTemporaryRedirect)
}

// Callback handles GET /auth/oauth/:provider/callback — processes OAuth callback.
func (h *OAuthHandler) Callback(c *fiber.Ctx) error {
	provider := c.Params("provider")

	// Validate state
	state := c.Query("state")
	storedState := c.Cookies("oauth_state")
	if state == "" || state != storedState {
		return response.Error(c, fiber.StatusBadRequest, "Invalid OAuth state — possible CSRF attack")
	}

	// Clear state cookie
	c.Cookie(&fiber.Cookie{
		Name:     "oauth_state",
		Value:    "",
		HTTPOnly: true,
		MaxAge:   -1,
	})

	// Exchange code for user info
	code := c.Query("code")
	if code == "" {
		return response.Error(c, fiber.StatusBadRequest, "Missing authorization code")
	}

	userInfo, err := h.oauthService.ExchangeCode(c.Context(), provider, code)
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, "Failed to authenticate with "+provider)
	}

	// Find or create user
	user, tokens, err := h.authService.FindOrCreateOAuthUser(userInfo.Email, provider, userInfo.ProviderID)
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, "Failed to process OAuth user")
	}

	return response.Success(c, fiber.Map{
		"user":   sanitizeUser(user),
		"tokens": tokens,
	})
}

// generateState creates a random hex string for OAuth CSRF protection.
func generateState() (string, error) {
	bytes := make([]byte, 16)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}
