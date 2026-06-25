package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"net/url"

	"github.com/gofiber/fiber/v2"
	"github.com/sureshkumarselvaraj/gobase/app/auth/services"
	"github.com/sureshkumarselvaraj/gobase/pkg/response"
)

// OAuthHandler handles OAuth2 endpoints.
type OAuthHandler struct {
	authService   *services.AuthService
	oauthService  *services.OAuthService
	dashboardURL  string // where to send the browser back to after auth
	googleEnabled bool
	githubEnabled bool
}

// NewOAuthHandler creates a new OAuthHandler.
func NewOAuthHandler(authService *services.AuthService, oauthService *services.OAuthService, dashboardURL string, googleEnabled, githubEnabled bool) *OAuthHandler {
	return &OAuthHandler{
		authService:   authService,
		oauthService:  oauthService,
		dashboardURL:  dashboardURL,
		googleEnabled: googleEnabled,
		githubEnabled: githubEnabled,
	}
}

// Providers handles GET /auth/oauth/providers — reports which OAuth providers are
// configured, so the frontend only renders buttons for usable providers.
func (h *OAuthHandler) Providers(c *fiber.Ctx) error {
	return response.Success(c, fiber.Map{
		"google": h.googleEnabled,
		"github": h.githubEnabled,
	})
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

// Callback handles GET /auth/oauth/:provider/callback — processes the OAuth
// callback and redirects the browser back to the dashboard with the issued
// tokens in the URL fragment (fragments are never sent to servers, so the
// tokens stay out of access logs).
func (h *OAuthHandler) Callback(c *fiber.Ctx) error {
	provider := c.Params("provider")

	// On any failure, bounce back to the dashboard with an error so the SPA can
	// show it, rather than dumping raw JSON in the browser.
	fail := func(msg string) error {
		return c.Redirect(h.dashboardURL+"/oauth/callback#error="+url.QueryEscape(msg), fiber.StatusTemporaryRedirect)
	}

	// Validate state (CSRF protection)
	state := c.Query("state")
	storedState := c.Cookies("oauth_state")
	if state == "" || state != storedState {
		return fail("Invalid OAuth state — possible CSRF attack")
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
		return fail("Missing authorization code")
	}

	userInfo, err := h.oauthService.ExchangeCode(c.Context(), provider, code)
	if err != nil {
		return fail("Failed to authenticate with " + provider)
	}

	// Find or create user
	_, tokens, err := h.authService.FindOrCreateOAuthUser(userInfo.Email, provider, userInfo.ProviderID)
	if err != nil {
		return fail("Failed to process OAuth user")
	}

	redirect := fmt.Sprintf("%s/oauth/callback#access_token=%s&refresh_token=%s",
		h.dashboardURL,
		url.QueryEscape(tokens.AccessToken),
		url.QueryEscape(tokens.RefreshToken),
	)
	return c.Redirect(redirect, fiber.StatusTemporaryRedirect)
}

// generateState creates a random hex string for OAuth CSRF protection.
func generateState() (string, error) {
	bytes := make([]byte, 16)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}
