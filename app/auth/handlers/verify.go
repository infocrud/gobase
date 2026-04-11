package handlers

import (
	"errors"

	"github.com/gofiber/fiber/v2"
	"github.com/sureshkumarselvaraj/gobase/app/auth/services"
	"github.com/sureshkumarselvaraj/gobase/pkg/response"
)

// VerifyHandler handles email verification endpoints.
type VerifyHandler struct {
	authService *services.AuthService
}

// NewVerifyHandler creates a new VerifyHandler.
func NewVerifyHandler(authService *services.AuthService) *VerifyHandler {
	return &VerifyHandler{authService: authService}
}

// Verify handles GET /auth/verify?token=xxx
func (h *VerifyHandler) Verify(c *fiber.Ctx) error {
	token := c.Query("token")
	if token == "" {
		return response.Error(c, fiber.StatusBadRequest, "Verification token is required")
	}

	err := h.authService.VerifyEmail(token)
	if err != nil {
		if errors.Is(err, services.ErrInvalidToken) {
			return response.Error(c, fiber.StatusBadRequest, "Invalid verification token")
		}
		if errors.Is(err, services.ErrTokenExpired) {
			return response.Error(c, fiber.StatusGone, "Verification token has expired — request a new one")
		}
		if errors.Is(err, services.ErrAlreadyVerified) {
			return response.Success(c, fiber.Map{"message": "Email is already verified"})
		}
		return response.Error(c, fiber.StatusInternalServerError, "Verification failed")
	}

	return response.Success(c, fiber.Map{
		"message": "Email verified successfully",
	})
}

// Resend handles POST /auth/verify/resend
func (h *VerifyHandler) Resend(c *fiber.Ctx) error {
	var body struct {
		Email string `json:"email"`
	}
	if err := c.BodyParser(&body); err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid request body")
	}
	if body.Email == "" {
		return response.Error(c, fiber.StatusBadRequest, "Email is required")
	}

	err := h.authService.ResendVerification(body.Email)
	if err != nil {
		if errors.Is(err, services.ErrAlreadyVerified) {
			return response.Success(c, fiber.Map{"message": "Email is already verified"})
		}
		// Don't reveal user not found for security
	}

	return response.Success(c, fiber.Map{
		"message": "If that email exists, a verification link has been sent",
	})
}
