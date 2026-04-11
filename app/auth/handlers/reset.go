package handlers

import (
	"errors"

	"github.com/gofiber/fiber/v2"
	"github.com/sureshkumarselvaraj/gobase/app/auth/services"
	"github.com/sureshkumarselvaraj/gobase/internal/middleware"
	"github.com/sureshkumarselvaraj/gobase/pkg/response"
)

// ResetHandler handles password reset endpoints.
type ResetHandler struct {
	authService *services.AuthService
}

// NewResetHandler creates a new ResetHandler.
func NewResetHandler(authService *services.AuthService) *ResetHandler {
	return &ResetHandler{authService: authService}
}

// ForgotPassword handles POST /auth/forgot-password
func (h *ResetHandler) ForgotPassword(c *fiber.Ctx) error {
	var body struct {
		Email string `json:"email"`
	}
	if err := c.BodyParser(&body); err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid request body")
	}
	if body.Email == "" {
		return response.Error(c, fiber.StatusBadRequest, "Email is required")
	}

	// Always return success to avoid user enumeration
	_ = h.authService.ForgotPassword(body.Email)

	return response.Success(c, fiber.Map{
		"message": "If that email exists, a password reset link has been sent",
	})
}

// ResetPassword handles POST /auth/reset-password
func (h *ResetHandler) ResetPassword(c *fiber.Ctx) error {
	var body struct {
		Token       string `json:"token"`
		NewPassword string `json:"new_password"`
	}
	if err := c.BodyParser(&body); err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid request body")
	}
	if body.Token == "" {
		return response.Error(c, fiber.StatusBadRequest, "Reset token is required")
	}
	if body.NewPassword == "" {
		return response.Error(c, fiber.StatusBadRequest, "New password is required")
	}
	if ps := middleware.ValidatePassword(body.NewPassword); !ps.Valid {
		return response.Error(c, fiber.StatusBadRequest, ps.Message)
	}

	err := h.authService.ResetPassword(body.Token, body.NewPassword)
	if err != nil {
		if errors.Is(err, services.ErrInvalidToken) {
			return response.Error(c, fiber.StatusBadRequest, "Invalid or expired reset token")
		}
		if errors.Is(err, services.ErrTokenExpired) {
			return response.Error(c, fiber.StatusGone, "Reset token has expired — request a new one")
		}
		return response.Error(c, fiber.StatusInternalServerError, "Password reset failed")
	}

	return response.Success(c, fiber.Map{
		"message": "Password has been reset successfully. Please sign in with your new password.",
	})
}
