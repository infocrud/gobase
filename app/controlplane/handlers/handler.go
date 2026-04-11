package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/sureshkumarselvaraj/gobase/internal/db"
	"gorm.io/gorm"
)

type ControlPlaneHandler struct {
	db *gorm.DB
}

func NewControlPlaneHandler(database *gorm.DB) *ControlPlaneHandler {
	return &ControlPlaneHandler{db: database}
}

// CreateOrganization handles the creation of a new billing entity/organization
func (h *ControlPlaneHandler) CreateOrganization(c *fiber.Ctx) error {
	var req struct {
		Name string `json:"name"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	userID := c.Locals("user_id").(uint) // from JWT protect

	org := db.Organization{
		Name:    req.Name,
		OwnerID: userID,
	}

	if err := h.db.Create(&org).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create organization"})
	}

	return c.Status(fiber.StatusCreated).JSON(org)
}

// ProvisionProject handles creating a new project under an organization
func (h *ControlPlaneHandler) ProvisionProject(c *fiber.Ctx) error {
	var req struct {
		Name           string `json:"name"`
		OrganizationID uint   `json:"organization_id"`
		Region         string `json:"region"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	if req.Region == "" {
		req.Region = "us-east-1"
	}

	project := db.Project{
		Name:           req.Name,
		OrganizationID: req.OrganizationID,
		Region:         req.Region,
		Status:         "provisioning",
	}

	// First, save project intent to database
	if err := h.db.Create(&project).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create project intent"})
	}

	// TODO: Dispatch message to Orchestrator to physically provision resources via K8s/Docker

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "Project provisioning started",
		"project": project,
	})
}

// StripeWebhook handles events from Stripe
func (h *ControlPlaneHandler) StripeWebhook(c *fiber.Ctx) error {
	// TODO: verify stripe signature, process subscription created/deleted
	return c.SendStatus(fiber.StatusOK)
}
