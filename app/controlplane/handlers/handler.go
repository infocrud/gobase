package handlers

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/sureshkumarselvaraj/gobase/internal/db"
	"gorm.io/gorm"
)

type ControlPlaneHandler struct {
	db            *gorm.DB
	stripeSecret  string // STRIPE_WEBHOOK_SECRET env var (optional)
}

func NewControlPlaneHandler(database *gorm.DB) *ControlPlaneHandler {
	return &ControlPlaneHandler{db: database}
}

func NewControlPlaneHandlerWithStripe(database *gorm.DB, stripeSecret string) *ControlPlaneHandler {
	return &ControlPlaneHandler{db: database, stripeSecret: stripeSecret}
}

// ── Organizations ─────────────────────────────────────────────────────────────

func (h *ControlPlaneHandler) CreateOrganization(c *fiber.Ctx) error {
	var req struct {
		Name string `json:"name"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid body"})
	}
	if req.Name == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "name is required"})
	}

	userID := c.Locals("user_id").(uint)
	org := db.Organization{Name: req.Name, OwnerID: userID}
	if err := h.db.Create(&org).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to create organization"})
	}
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"data": org})
}

func (h *ControlPlaneHandler) ListOrganizations(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(uint)
	var orgs []db.Organization
	if err := h.db.Preload("Projects").Where("owner_id = ?", userID).Find(&orgs).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to fetch organizations"})
	}
	return c.JSON(fiber.Map{"data": orgs})
}

func (h *ControlPlaneHandler) GetOrganization(c *fiber.Ctx) error {
	orgID, err := strconv.Atoi(c.Params("orgID"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid org id"})
	}
	userID := c.Locals("user_id").(uint)

	var org db.Organization
	if err := h.db.Preload("Projects").First(&org, "id = ? AND owner_id = ?", orgID, userID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "organization not found"})
	}
	return c.JSON(fiber.Map{"data": org})
}

func (h *ControlPlaneHandler) UpdateOrganization(c *fiber.Ctx) error {
	orgID, err := strconv.Atoi(c.Params("orgID"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid org id"})
	}
	userID := c.Locals("user_id").(uint)

	var org db.Organization
	if err := h.db.First(&org, "id = ? AND owner_id = ?", orgID, userID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "organization not found"})
	}

	var req struct {
		Name string `json:"name"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid body"})
	}
	if req.Name != "" {
		org.Name = req.Name
		h.db.Save(&org)
	}
	return c.JSON(fiber.Map{"data": org})
}

func (h *ControlPlaneHandler) DeleteOrganization(c *fiber.Ctx) error {
	orgID, err := strconv.Atoi(c.Params("orgID"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid org id"})
	}
	userID := c.Locals("user_id").(uint)

	result := h.db.Where("id = ? AND owner_id = ?", orgID, userID).Delete(&db.Organization{})
	if result.RowsAffected == 0 {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "organization not found"})
	}
	return c.SendStatus(fiber.StatusNoContent)
}

// ── Projects ──────────────────────────────────────────────────────────────────

func (h *ControlPlaneHandler) ProvisionProject(c *fiber.Ctx) error {
	var req struct {
		Name           string `json:"name"`
		OrganizationID uint   `json:"organization_id"`
		Region         string `json:"region"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid body"})
	}
	if req.Name == "" || req.OrganizationID == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "name and organization_id are required"})
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
	if err := h.db.Create(&project).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to create project"})
	}
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "project provisioning started",
		"data":    project,
	})
}

func (h *ControlPlaneHandler) ListProjects(c *fiber.Ctx) error {
	orgID, err := strconv.Atoi(c.Params("orgID"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid org id"})
	}
	var projects []db.Project
	if err := h.db.Where("organization_id = ?", orgID).Find(&projects).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to fetch projects"})
	}
	return c.JSON(fiber.Map{"data": projects})
}

func (h *ControlPlaneHandler) GetProject(c *fiber.Ctx) error {
	projectID, err := strconv.Atoi(c.Params("projectID"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid project id"})
	}
	var project db.Project
	if err := h.db.First(&project, projectID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "project not found"})
	}
	return c.JSON(fiber.Map{"data": project})
}

func (h *ControlPlaneHandler) UpdateProject(c *fiber.Ctx) error {
	projectID, err := strconv.Atoi(c.Params("projectID"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid project id"})
	}
	var project db.Project
	if err := h.db.First(&project, projectID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "project not found"})
	}

	var req struct {
		Name   string `json:"name"`
		Status string `json:"status"`
		Region string `json:"region"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid body"})
	}

	updates := map[string]interface{}{}
	if req.Name != "" {
		updates["name"] = req.Name
	}
	if req.Status != "" {
		updates["status"] = req.Status
	}
	if req.Region != "" {
		updates["region"] = req.Region
	}
	if len(updates) > 0 {
		h.db.Model(&project).Updates(updates)
	}
	return c.JSON(fiber.Map{"data": project})
}

func (h *ControlPlaneHandler) DeleteProject(c *fiber.Ctx) error {
	projectID, err := strconv.Atoi(c.Params("projectID"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid project id"})
	}
	result := h.db.Delete(&db.Project{}, projectID)
	if result.RowsAffected == 0 {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "project not found"})
	}
	return c.SendStatus(fiber.StatusNoContent)
}

// ── API Keys ──────────────────────────────────────────────────────────────────

func generateAPIKey() (raw, hash, preview string, err error) {
	b := make([]byte, 32)
	if _, err = rand.Read(b); err != nil {
		return
	}
	raw = "gbk_" + hex.EncodeToString(b)   // e.g. gbk_<64 hex chars>
	preview = raw[:12]                       // show first 12 chars in list
	sum := sha256.Sum256([]byte(raw))
	hash = hex.EncodeToString(sum[:])
	return
}

func (h *ControlPlaneHandler) CreateAPIKey(c *fiber.Ctx) error {
	projectID, err := strconv.Atoi(c.Params("projectID"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid project id"})
	}

	var req struct {
		Name      string     `json:"name"`
		Scopes    string     `json:"scopes"`
		ExpiresAt *time.Time `json:"expires_at"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid body"})
	}
	if req.Name == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "name is required"})
	}
	if req.Scopes == "" {
		req.Scopes = "read"
	}

	raw, hash, preview, err := generateAPIKey()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to generate key"})
	}

	key := db.APIKey{
		ProjectID:  uint(projectID),
		Name:       req.Name,
		KeyHash:    hash,
		KeyPreview: preview,
		Scopes:     req.Scopes,
		ExpiresAt:  req.ExpiresAt,
	}
	if err := h.db.Create(&key).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to create api key"})
	}

	// Return the raw key once — never stored
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"data": fiber.Map{
			"id":         key.ID,
			"name":       key.Name,
			"key":        raw, // shown only on creation
			"key_preview": key.KeyPreview,
			"scopes":     key.Scopes,
			"expires_at": key.ExpiresAt,
			"created_at": key.CreatedAt,
		},
		"message": "store this key now — it won't be shown again",
	})
}

func (h *ControlPlaneHandler) ListAPIKeys(c *fiber.Ctx) error {
	projectID, err := strconv.Atoi(c.Params("projectID"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid project id"})
	}
	var keys []db.APIKey
	if err := h.db.Where("project_id = ?", projectID).Find(&keys).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to fetch keys"})
	}
	return c.JSON(fiber.Map{"data": keys})
}

func (h *ControlPlaneHandler) DeleteAPIKey(c *fiber.Ctx) error {
	keyID, err := strconv.Atoi(c.Params("keyID"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid key id"})
	}
	result := h.db.Delete(&db.APIKey{}, keyID)
	if result.RowsAffected == 0 {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "api key not found"})
	}
	return c.SendStatus(fiber.StatusNoContent)
}

// ── Stripe Webhook ────────────────────────────────────────────────────────────

func (h *ControlPlaneHandler) StripeWebhook(c *fiber.Ctx) error {
	payload := c.Body()

	// Verify signature when secret is configured
	if h.stripeSecret != "" {
		sig := c.Get("Stripe-Signature")
		if !verifyStripeSignature(payload, sig, h.stripeSecret) {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "invalid stripe signature"})
		}
	}

	var event struct {
		Type string          `json:"type"`
		Data json.RawMessage `json:"data"`
	}
	if err := json.Unmarshal(payload, &event); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid payload"})
	}

	switch event.Type {
	case "customer.subscription.created", "customer.subscription.updated":
		var data struct {
			Object struct {
				CustomerID string `json:"customer"`
				Status     string `json:"status"`
				Items      struct {
					Data []struct {
						Price struct {
							Nickname string `json:"nickname"`
						} `json:"price"`
					} `json:"data"`
				} `json:"items"`
			} `json:"object"`
		}
		if err := json.Unmarshal(event.Data, &data); err == nil {
			plan := "free"
			if len(data.Object.Items.Data) > 0 {
				plan = data.Object.Items.Data[0].Price.Nickname
			}
			h.db.Model(&db.Organization{}).
				Where("stripe_customer_id = ?", data.Object.CustomerID).
				Update("billing_plan", plan)
		}

	case "customer.subscription.deleted":
		var data struct {
			Object struct {
				CustomerID string `json:"customer"`
			} `json:"object"`
		}
		if err := json.Unmarshal(event.Data, &data); err == nil {
			h.db.Model(&db.Organization{}).
				Where("stripe_customer_id = ?", data.Object.CustomerID).
				Update("billing_plan", "free")
		}
	}

	return c.SendStatus(fiber.StatusOK)
}

// verifyStripeSignature validates the Stripe-Signature header using HMAC-SHA256.
func verifyStripeSignature(payload []byte, sigHeader, secret string) bool {
	// Stripe-Signature: t=<timestamp>,v1=<sig>
	var ts, v1 string
	for _, part := range splitComma(sigHeader) {
		if len(part) > 2 && part[:2] == "t=" {
			ts = part[2:]
		}
		if len(part) > 3 && part[:3] == "v1=" {
			v1 = part[3:]
		}
	}
	if ts == "" || v1 == "" {
		return false
	}
	signed := fmt.Sprintf("%s.%s", ts, string(payload))
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(signed))
	expected := hex.EncodeToString(mac.Sum(nil))
	return hmac.Equal([]byte(expected), []byte(v1))
}

func splitComma(s string) []string {
	var out []string
	start := 0
	for i := 0; i < len(s); i++ {
		if s[i] == ',' {
			out = append(out, s[start:i])
			start = i + 1
		}
	}
	out = append(out, s[start:])
	return out
}

// ensure io is used (body reading for future use)
var _ = io.Discard
