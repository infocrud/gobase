// Package handler provides shared HTTP handler utilities for all GoBase services.
package handler

import (
	"github.com/gofiber/fiber/v2"
	"github.com/rs/zerolog/log"
	"github.com/sureshkumarselvaraj/gobase/pkg/apperror"
)

// ErrorHandler is a centralized Fiber error handler that understands apperror types.
// It returns structured error responses with machine-readable codes.
func ErrorHandler(c *fiber.Ctx, err error) error {
	// Check for apperror.Error
	if appErr, ok := apperror.AsAppError(err); ok {
		return c.Status(appErr.HTTPStatus).JSON(fiber.Map{
			"success": false,
			"error": fiber.Map{
				"code":    appErr.Code,
				"message": appErr.Message,
				"details": appErr.Details,
			},
		})
	}

	// Check for Fiber's own errors (404, etc.)
	if fiberErr, ok := err.(*fiber.Error); ok {
		code := apperror.CodeInternal
		switch fiberErr.Code {
		case fiber.StatusNotFound:
			code = apperror.CodeNotFound
		case fiber.StatusMethodNotAllowed:
			code = apperror.CodeBadRequest
		case fiber.StatusTooManyRequests:
			code = apperror.CodeTooManyRequests
		}
		return c.Status(fiberErr.Code).JSON(fiber.Map{
			"success": false,
			"error": fiber.Map{
				"code":    code,
				"message": fiberErr.Message,
			},
		})
	}

	// Unknown errors — log and return generic 500
	log.Error().Err(err).Str("path", c.Path()).Msg("Unhandled error")
	return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
		"success": false,
		"error": fiber.Map{
			"code":    apperror.CodeInternal,
			"message": "An unexpected error occurred",
		},
	})
}
