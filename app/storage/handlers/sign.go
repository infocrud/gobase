package handlers

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/sureshkumarselvaraj/gobase/app/storage/store"
	"github.com/sureshkumarselvaraj/gobase/pkg/response"
)

// SignHandler handles presigned URL generation.
type SignHandler struct {
	store *store.MinIOStore
}

// NewSignHandler creates a new SignHandler.
func NewSignHandler(s *store.MinIOStore) *SignHandler {
	return &SignHandler{store: s}
}

// SignDownload handles POST /storage/v1/sign/:bucket/*path — generate presigned download URL.
func (h *SignHandler) SignDownload(c *fiber.Ctx) error {
	bucket := c.Params("bucket")
	objectPath := c.Params("*")

	if objectPath == "" {
		return response.Error(c, fiber.StatusBadRequest, "Object path is required")
	}

	// Parse optional expiry from request body
	var body struct {
		ExpiresIn string `json:"expires_in"` // e.g. "1h", "30m"
	}
	c.BodyParser(&body)

	var expiry time.Duration
	if body.ExpiresIn != "" {
		var err error
		expiry, err = time.ParseDuration(body.ExpiresIn)
		if err != nil {
			return response.Error(c, fiber.StatusBadRequest, "Invalid expires_in format. Use Go duration format (e.g. '1h', '30m')")
		}
	}

	url, err := h.store.PresignedGetURL(c.Context(), bucket, objectPath, expiry)
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, "Failed to generate signed URL")
	}

	return response.Success(c, fiber.Map{
		"signed_url": url,
		"key":        bucket + "/" + objectPath,
		"method":     "GET",
	})
}

// SignUpload handles POST /storage/v1/sign/upload/:bucket/*path — generate presigned upload URL.
func (h *SignHandler) SignUpload(c *fiber.Ctx) error {
	bucket := c.Params("bucket")
	objectPath := c.Params("*")

	if objectPath == "" {
		return response.Error(c, fiber.StatusBadRequest, "Object path is required")
	}

	var body struct {
		ExpiresIn string `json:"expires_in"`
	}
	c.BodyParser(&body)

	var expiry time.Duration
	if body.ExpiresIn != "" {
		var err error
		expiry, err = time.ParseDuration(body.ExpiresIn)
		if err != nil {
			return response.Error(c, fiber.StatusBadRequest, "Invalid expires_in format")
		}
	}

	url, err := h.store.PresignedPutURL(c.Context(), bucket, objectPath, expiry)
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, "Failed to generate signed upload URL")
	}

	return response.Success(c, fiber.Map{
		"signed_url": url,
		"key":        bucket + "/" + objectPath,
		"method":     "PUT",
	})
}
