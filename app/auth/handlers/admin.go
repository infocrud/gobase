package handlers

import (
	"errors"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/sureshkumarselvaraj/gobase/app/auth/services"
	"github.com/sureshkumarselvaraj/gobase/internal/db"
	"github.com/sureshkumarselvaraj/gobase/pkg/response"
)

// AdminHandler handles admin user management endpoints.
type AdminHandler struct {
	authService *services.AuthService
}

// NewAdminHandler creates a new AdminHandler.
func NewAdminHandler(authService *services.AuthService) *AdminHandler {
	return &AdminHandler{authService: authService}
}

// ListUsers handles GET /auth/admin/users
func (h *AdminHandler) ListUsers(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "20"))

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	users, total, err := h.authService.ListUsers(page, limit)
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, "Failed to list users")
	}

	sanitized := make([]fiber.Map, len(users))
	for i, u := range users {
		sanitized[i] = sanitizeUserFull(&u)
	}

	return response.Success(c, fiber.Map{
		"users":      sanitized,
		"total":      total,
		"page":       page,
		"limit":      limit,
		"total_pages": (total + int64(limit) - 1) / int64(limit),
	})
}

// GetUser handles GET /auth/admin/users/:id
func (h *AdminHandler) GetUser(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid user ID")
	}

	user, err := h.authService.GetUser(uint(id))
	if err != nil {
		if errors.Is(err, services.ErrUserNotFound) {
			return response.Error(c, fiber.StatusNotFound, "User not found")
		}
		return response.Error(c, fiber.StatusInternalServerError, "Failed to get user")
	}

	return response.Success(c, sanitizeUserFull(user))
}

// UpdateUser handles PATCH /auth/admin/users/:id
func (h *AdminHandler) UpdateUser(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid user ID")
	}

	var body struct {
		Role string `json:"role"`
	}
	if err := c.BodyParser(&body); err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid request body")
	}

	if body.Role != "" {
		if body.Role != "user" && body.Role != "admin" {
			return response.Error(c, fiber.StatusBadRequest, "Role must be 'user' or 'admin'")
		}
		if err := h.authService.UpdateUserRole(uint(id), body.Role); err != nil {
			if errors.Is(err, services.ErrUserNotFound) {
				return response.Error(c, fiber.StatusNotFound, "User not found")
			}
			return response.Error(c, fiber.StatusInternalServerError, "Failed to update user")
		}
	}

	return response.Success(c, fiber.Map{
		"message": "User updated",
	})
}

// DeleteUser handles DELETE /auth/admin/users/:id
func (h *AdminHandler) DeleteUser(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid user ID")
	}

	if err := h.authService.DeleteUser(uint(id)); err != nil {
		if errors.Is(err, services.ErrUserNotFound) {
			return response.Error(c, fiber.StatusNotFound, "User not found")
		}
		return response.Error(c, fiber.StatusInternalServerError, "Failed to delete user")
	}

	return response.Success(c, fiber.Map{
		"message": "User deleted",
	})
}

func sanitizeUserFull(u *db.User) fiber.Map {
	return fiber.Map{
		"id":             u.ID,
		"email":          u.Email,
		"provider":       u.Provider,
		"role":           u.Role,
		"email_verified": u.EmailVerified,
		"created_at":     u.CreatedAt,
		"updated_at":     u.UpdatedAt,
	}
}
