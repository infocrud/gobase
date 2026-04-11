package handlers

import (
	"errors"

	"github.com/gofiber/fiber/v2"
	"github.com/sureshkumarselvaraj/gobase/app/auth/services"
	"github.com/sureshkumarselvaraj/gobase/internal/db"
	"github.com/sureshkumarselvaraj/gobase/internal/middleware"
	"github.com/sureshkumarselvaraj/gobase/pkg/response"
)

// AuthHandler handles authentication endpoints.
type AuthHandler struct {
	authService *services.AuthService
}

// NewAuthHandler creates a new AuthHandler.
func NewAuthHandler(authService *services.AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

// Signup handles POST /auth/signup
func (h *AuthHandler) Signup(c *fiber.Ctx) error {
	var input services.SignupInput
	if err := c.BodyParser(&input); err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Validate input
	if input.Email == "" {
		return response.Error(c, fiber.StatusBadRequest, "Email is required")
	}
	if !middleware.ValidateEmail(input.Email) {
		return response.Error(c, fiber.StatusBadRequest, "Invalid email format")
	}
	if input.Password == "" {
		return response.Error(c, fiber.StatusBadRequest, "Password is required")
	}
	if ps := middleware.ValidatePassword(input.Password); !ps.Valid {
		return response.Error(c, fiber.StatusBadRequest, ps.Message)
	}

	user, tokens, err := h.authService.Signup(input)
	if err != nil {
		if errors.Is(err, services.ErrUserExists) {
			return response.Error(c, fiber.StatusConflict, err.Error())
		}
		return response.Error(c, fiber.StatusInternalServerError, "Failed to create user")
	}

	return response.SuccessWithStatus(c, fiber.StatusCreated, fiber.Map{
		"user":   sanitizeUser(user),
		"tokens": tokens,
	})
}

// Login handles POST /auth/login
func (h *AuthHandler) Login(c *fiber.Ctx) error {
	var input services.LoginInput
	if err := c.BodyParser(&input); err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid request body")
	}

	if input.Email == "" || input.Password == "" {
		return response.Error(c, fiber.StatusBadRequest, "Email and password are required")
	}

	user, tokens, err := h.authService.Login(input)
	if err != nil {
		if errors.Is(err, services.ErrInvalidCredentials) {
			return response.Error(c, fiber.StatusUnauthorized, err.Error())
		}
		return response.Error(c, fiber.StatusInternalServerError, "Login failed")
	}

	return response.Success(c, fiber.Map{
		"user":   sanitizeUser(user),
		"tokens": tokens,
	})
}

// Refresh handles POST /auth/refresh
func (h *AuthHandler) Refresh(c *fiber.Ctx) error {
	var body struct {
		RefreshToken string `json:"refresh_token"`
	}
	if err := c.BodyParser(&body); err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid request body")
	}

	if body.RefreshToken == "" {
		return response.Error(c, fiber.StatusBadRequest, "Refresh token is required")
	}

	tokens, err := h.authService.RefreshTokens(body.RefreshToken)
	if err != nil {
		if errors.Is(err, services.ErrInvalidToken) || errors.Is(err, services.ErrTokenRevoked) {
			return response.Error(c, fiber.StatusUnauthorized, err.Error())
		}
		return response.Error(c, fiber.StatusInternalServerError, "Failed to refresh tokens")
	}

	return response.Success(c, fiber.Map{
		"tokens": tokens,
	})
}

// Logout handles POST /auth/logout (protected route)
func (h *AuthHandler) Logout(c *fiber.Ctx) error {
	userID, ok := c.Locals("user_id").(uint)
	if !ok {
		return response.Error(c, fiber.StatusUnauthorized, "Invalid user context")
	}

	if err := h.authService.Logout(userID); err != nil {
		return response.Error(c, fiber.StatusInternalServerError, "Failed to logout")
	}

	return response.Success(c, fiber.Map{
		"message": "Successfully logged out",
	})
}

// Me handles GET /auth/me (protected route)
func (h *AuthHandler) Me(c *fiber.Ctx) error {
	userID, ok := c.Locals("user_id").(uint)
	if !ok {
		return response.Error(c, fiber.StatusUnauthorized, "Invalid user context")
	}
	email, _ := c.Locals("user_email").(string)

	return response.Success(c, fiber.Map{
		"id":    userID,
		"email": email,
	})
}

// sanitizeUser removes sensitive fields from user for response.
func sanitizeUser(u *db.User) fiber.Map {
	if u == nil {
		return nil
	}
	return fiber.Map{
		"id":             u.ID,
		"email":          u.Email,
		"provider":       u.Provider,
		"email_verified": u.EmailVerified,
		"created_at":     u.CreatedAt,
	}
}
