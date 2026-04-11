package handlers

import (
	"fmt"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/rs/zerolog/log"
	"github.com/sureshkumarselvaraj/gobase/app/storage/store"
	"github.com/sureshkumarselvaraj/gobase/pkg/response"
)

// ObjectHandler handles file upload, download, delete, and list operations.
type ObjectHandler struct {
	store *store.MinIOStore
}

// NewObjectHandler creates a new ObjectHandler.
func NewObjectHandler(s *store.MinIOStore) *ObjectHandler {
	return &ObjectHandler{store: s}
}

// Upload handles POST /storage/v1/object/:bucket/*path — upload a file.
func (h *ObjectHandler) Upload(c *fiber.Ctx) error {
	bucket := c.Params("bucket")
	objectPath := c.Params("*")

	if objectPath == "" {
		return response.Error(c, fiber.StatusBadRequest, "Object path is required")
	}

	// Get file from multipart form
	file, err := c.FormFile("file")
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, "File is required (use 'file' field in multipart form)")
	}

	// Open the file
	src, err := file.Open()
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, "Failed to read uploaded file")
	}
	defer src.Close()

	// Detect content type
	contentType := file.Header.Get("Content-Type")
	if contentType == "" {
		contentType = "application/octet-stream"
	}

	info, err := h.store.Upload(c.Context(), bucket, objectPath, src, file.Size, contentType)
	if err != nil {
		log.Error().Err(err).Str("bucket", bucket).Str("path", objectPath).Msg("Upload failed")
		return response.Error(c, fiber.StatusInternalServerError, "Failed to upload file")
	}

	return response.SuccessWithStatus(c, fiber.StatusCreated, fiber.Map{
		"key":          fmt.Sprintf("%s/%s", bucket, objectPath),
		"size":         info.Size,
		"etag":         info.ETag,
		"content_type": contentType,
	})
}

// Download handles GET /storage/v1/object/:bucket/*path — download a file.
func (h *ObjectHandler) Download(c *fiber.Ctx) error {
	bucket := c.Params("bucket")
	objectPath := c.Params("*")

	if objectPath == "" {
		return response.Error(c, fiber.StatusBadRequest, "Object path is required")
	}

	obj, stat, err := h.store.Download(c.Context(), bucket, objectPath)
	if err != nil {
		if strings.Contains(err.Error(), "NoSuchKey") || strings.Contains(err.Error(), "not found") {
			return response.Error(c, fiber.StatusNotFound, "File not found")
		}
		log.Error().Err(err).Str("bucket", bucket).Str("path", objectPath).Msg("Download failed")
		return response.Error(c, fiber.StatusInternalServerError, "Failed to download file")
	}
	defer obj.Close()

	c.Set("Content-Type", stat.ContentType)
	c.Set("Content-Length", fmt.Sprintf("%d", stat.Size))
	c.Set("ETag", stat.ETag)
	c.Set("Cache-Control", "public, max-age=3600")

	return c.SendStream(obj, int(stat.Size))
}

// Delete handles DELETE /storage/v1/object/:bucket/*path — delete a file.
func (h *ObjectHandler) Delete(c *fiber.Ctx) error {
	bucket := c.Params("bucket")
	objectPath := c.Params("*")

	if objectPath == "" {
		return response.Error(c, fiber.StatusBadRequest, "Object path is required")
	}

	if err := h.store.Delete(c.Context(), bucket, objectPath); err != nil {
		log.Error().Err(err).Str("bucket", bucket).Str("path", objectPath).Msg("Delete failed")
		return response.Error(c, fiber.StatusInternalServerError, "Failed to delete file")
	}

	return response.Success(c, fiber.Map{
		"message": "File deleted successfully",
		"key":     fmt.Sprintf("%s/%s", bucket, objectPath),
	})
}

// List handles GET /storage/v1/object/:bucket — list files in a bucket.
func (h *ObjectHandler) List(c *fiber.Ctx) error {
	bucket := c.Params("bucket")
	prefix := c.Query("prefix", "")

	objects, err := h.store.List(c.Context(), bucket, prefix)
	if err != nil {
		log.Error().Err(err).Str("bucket", bucket).Msg("List failed")
		return response.Error(c, fiber.StatusInternalServerError, "Failed to list files")
	}

	return response.Success(c, fiber.Map{
		"bucket":  bucket,
		"prefix":  prefix,
		"objects": objects,
		"count":   len(objects),
	})
}
