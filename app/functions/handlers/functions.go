package handlers

import (
	"io"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/rs/zerolog/log"
	"github.com/sureshkumarselvaraj/gobase/app/functions/runner"
	"github.com/sureshkumarselvaraj/gobase/pkg/response"
)

// FunctionHandler handles edge function endpoints.
type FunctionHandler struct {
	runner *runner.Runner
}

// NewFunctionHandler creates a new FunctionHandler.
func NewFunctionHandler(r *runner.Runner) *FunctionHandler {
	return &FunctionHandler{runner: r}
}

// Deploy handles POST /functions/v1/deploy — deploy a function.
func (h *FunctionHandler) Deploy(c *fiber.Ctx) error {
	name := c.Query("name")
	if name == "" {
		return response.Error(c, fiber.StatusBadRequest, "Function name is required (use ?name=my-func.ts)")
	}

	// Read function code from request body
	code := c.Body()
	if len(code) == 0 {
		// Try multipart file upload
		file, err := c.FormFile("file")
		if err != nil {
			return response.Error(c, fiber.StatusBadRequest, "Function code is required (send as body or file upload)")
		}
		f, err := file.Open()
		if err != nil {
			return response.Error(c, fiber.StatusInternalServerError, "Failed to read uploaded file")
		}
		defer f.Close()
		code, err = io.ReadAll(f)
		if err != nil {
			return response.Error(c, fiber.StatusInternalServerError, "Failed to read file contents")
		}
		if name == "" {
			name = file.Filename
		}
	}

	info, err := h.runner.Deploy(name, code)
	if err != nil {
		log.Error().Err(err).Str("name", name).Msg("Deploy failed")
		return response.Error(c, fiber.StatusInternalServerError, "Failed to deploy function")
	}

	return response.SuccessWithStatus(c, fiber.StatusCreated, fiber.Map{
		"message":  "Function deployed successfully",
		"function": info,
	})
}

// Invoke handles POST /functions/v1/:name — invoke a function.
func (h *FunctionHandler) Invoke(c *fiber.Ctx) error {
	name := c.Params("name")

	if !h.runner.Exists(name) {
		return response.Error(c, fiber.StatusNotFound, "Function '"+name+"' not found")
	}

	// Get payload from request body
	payload := string(c.Body())

	// Parse optional timeout
	var timeout time.Duration
	if t := c.Query("timeout"); t != "" {
		var err error
		timeout, err = time.ParseDuration(t)
		if err != nil {
			return response.Error(c, fiber.StatusBadRequest, "Invalid timeout format")
		}
	}

	start := time.Now()
	stdout, stderr, err := h.runner.Invoke(name, payload, timeout)
	duration := time.Since(start)

	if err != nil {
		log.Error().Err(err).Str("name", name).Dur("duration", duration).Msg("Function invocation failed")
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success":  false,
			"error":    err.Error(),
			"stdout":   stdout,
			"stderr":   stderr,
			"duration": duration.String(),
		})
	}

	return response.Success(c, fiber.Map{
		"output":   stdout,
		"stderr":   stderr,
		"duration": duration.String(),
	})
}

// List handles GET /functions/v1 — list deployed functions.
func (h *FunctionHandler) List(c *fiber.Ctx) error {
	functions, err := h.runner.List()
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, "Failed to list functions")
	}

	return response.Success(c, fiber.Map{
		"functions": functions,
		"count":     len(functions),
	})
}

// Delete handles DELETE /functions/v1/:name — remove a function.
func (h *FunctionHandler) Delete(c *fiber.Ctx) error {
	name := c.Params("name")

	if err := h.runner.Delete(name); err != nil {
		return response.Error(c, fiber.StatusNotFound, err.Error())
	}

	return response.Success(c, fiber.Map{
		"message": "Function deleted",
		"name":    name,
	})
}
