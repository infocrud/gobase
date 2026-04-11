// Package response provides standardized JSON response helpers for Fiber HTTP handlers.
// All API responses follow a consistent envelope format:
//
//	Success: {"success": true, "data": ...}
//	Error:   {"success": false, "error": {"code": "...", "message": "...", "details": ...}}
package response

import (
	"github.com/gofiber/fiber/v2"
	"github.com/sureshkumarselvaraj/gobase/pkg/apperror"
)

// SuccessResponse is the standard success response envelope.
type SuccessResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
}

// ErrorBody is the structured error object inside an error response.
type ErrorBody struct {
	Code    apperror.Code     `json:"code"`
	Message string            `json:"message"`
	Details map[string]string `json:"details,omitempty"`
}

// ErrorResponse is the standard error response envelope.
type ErrorResponse struct {
	Success bool      `json:"success"`
	Error   ErrorBody `json:"error"`
}

// Success returns a 200 OK JSON response with the given data.
func Success(c *fiber.Ctx, data interface{}) error {
	return c.Status(fiber.StatusOK).JSON(SuccessResponse{
		Success: true,
		Data:    data,
	})
}

// SuccessWithStatus returns a success JSON response with a custom HTTP status code.
func SuccessWithStatus(c *fiber.Ctx, status int, data interface{}) error {
	return c.Status(status).JSON(SuccessResponse{
		Success: true,
		Data:    data,
	})
}

// Error returns a standardized error JSON response with a string message.
// Prefer AppError() for structured errors with error codes.
func Error(c *fiber.Ctx, status int, message string) error {
	code := apperror.CodeInternal
	switch {
	case status == fiber.StatusBadRequest:
		code = apperror.CodeBadRequest
	case status == fiber.StatusUnauthorized:
		code = apperror.CodeUnauthorized
	case status == fiber.StatusForbidden:
		code = apperror.CodeForbidden
	case status == fiber.StatusNotFound:
		code = apperror.CodeNotFound
	case status == fiber.StatusConflict:
		code = apperror.CodeConflict
	case status == fiber.StatusTooManyRequests:
		code = apperror.CodeTooManyRequests
	case status == fiber.StatusGone:
		code = apperror.CodeGone
	case status == fiber.StatusUnprocessableEntity:
		code = apperror.CodeValidation
	}

	return c.Status(status).JSON(ErrorResponse{
		Success: false,
		Error: ErrorBody{
			Code:    code,
			Message: message,
		},
	})
}

// AppError returns a structured error response from an apperror.Error.
// This is the preferred way to return errors in handlers.
func AppError(c *fiber.Ctx, err *apperror.Error) error {
	return c.Status(err.HTTPStatus).JSON(ErrorResponse{
		Success: false,
		Error: ErrorBody{
			Code:    err.Code,
			Message: err.Message,
			Details: err.Details,
		},
	})
}
