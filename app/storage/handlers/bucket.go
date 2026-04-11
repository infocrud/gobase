package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/sureshkumarselvaraj/gobase/app/storage/store"
	"github.com/sureshkumarselvaraj/gobase/pkg/response"
)

// BucketHandler handles bucket management operations.
type BucketHandler struct {
	store *store.MinIOStore
}

// NewBucketHandler creates a new BucketHandler.
func NewBucketHandler(s *store.MinIOStore) *BucketHandler {
	return &BucketHandler{store: s}
}

// List handles GET /storage/v1/bucket — list all buckets.
func (h *BucketHandler) List(c *fiber.Ctx) error {
	buckets, err := h.store.ListBuckets(c.Context())
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, "Failed to list buckets")
	}

	result := make([]fiber.Map, len(buckets))
	for i, b := range buckets {
		result[i] = fiber.Map{
			"name":       b.Name,
			"created_at": b.CreationDate,
		}
	}

	return response.Success(c, fiber.Map{
		"buckets": result,
		"count":   len(result),
	})
}

// Create handles POST /storage/v1/bucket — create a new bucket.
func (h *BucketHandler) Create(c *fiber.Ctx) error {
	var body struct {
		Name string `json:"name"`
	}
	if err := c.BodyParser(&body); err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid request body")
	}

	if body.Name == "" {
		return response.Error(c, fiber.StatusBadRequest, "Bucket name is required")
	}

	if err := h.store.CreateBucket(c.Context(), body.Name); err != nil {
		return response.Error(c, fiber.StatusInternalServerError, "Failed to create bucket: "+err.Error())
	}

	return response.SuccessWithStatus(c, fiber.StatusCreated, fiber.Map{
		"message": "Bucket created",
		"name":    body.Name,
	})
}

// Delete handles DELETE /storage/v1/bucket/:name — delete an empty bucket.
func (h *BucketHandler) Delete(c *fiber.Ctx) error {
	name := c.Params("name")
	if name == "" {
		return response.Error(c, fiber.StatusBadRequest, "Bucket name is required")
	}

	if err := h.store.DeleteBucket(c.Context(), name); err != nil {
		return response.Error(c, fiber.StatusInternalServerError, "Failed to delete bucket (must be empty): "+err.Error())
	}

	return response.Success(c, fiber.Map{
		"message": "Bucket deleted",
		"name":    name,
	})
}
