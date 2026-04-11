package response

import (
	"encoding/json"
	"io"
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v2"
	"github.com/sureshkumarselvaraj/gobase/pkg/apperror"
)

func TestSuccess(t *testing.T) {
	app := fiber.New()
	app.Get("/", func(c *fiber.Ctx) error {
		return Success(c, fiber.Map{"key": "value"})
	})

	req := httptest.NewRequest("GET", "/", nil)
	resp, err := app.Test(req)
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != 200 {
		t.Errorf("Expected status 200, got %d", resp.StatusCode)
	}

	body, _ := io.ReadAll(resp.Body)
	var result SuccessResponse
	json.Unmarshal(body, &result)
	if !result.Success {
		t.Error("Expected success=true")
	}
}

func TestSuccessWithStatus(t *testing.T) {
	app := fiber.New()
	app.Post("/", func(c *fiber.Ctx) error {
		return SuccessWithStatus(c, fiber.StatusCreated, fiber.Map{"id": 1})
	})

	req := httptest.NewRequest("POST", "/", nil)
	resp, _ := app.Test(req)
	if resp.StatusCode != 201 {
		t.Errorf("Expected status 201, got %d", resp.StatusCode)
	}
}

func TestError(t *testing.T) {
	app := fiber.New()
	app.Get("/", func(c *fiber.Ctx) error {
		return Error(c, fiber.StatusBadRequest, "bad input")
	})

	req := httptest.NewRequest("GET", "/", nil)
	resp, _ := app.Test(req)
	if resp.StatusCode != 400 {
		t.Errorf("Expected status 400, got %d", resp.StatusCode)
	}

	body, _ := io.ReadAll(resp.Body)
	var result ErrorResponse
	json.Unmarshal(body, &result)
	if result.Success {
		t.Error("Expected success=false")
	}
	if result.Error.Code != apperror.CodeBadRequest {
		t.Errorf("Expected code BAD_REQUEST, got %s", result.Error.Code)
	}
	if result.Error.Message != "bad input" {
		t.Errorf("Expected message 'bad input', got '%s'", result.Error.Message)
	}
}

func TestAppError(t *testing.T) {
	app := fiber.New()
	app.Get("/", func(c *fiber.Ctx) error {
		return AppError(c, apperror.New(apperror.CodeNotFound, "user not found"))
	})

	req := httptest.NewRequest("GET", "/", nil)
	resp, _ := app.Test(req)
	if resp.StatusCode != 404 {
		t.Errorf("Expected status 404, got %d", resp.StatusCode)
	}

	body, _ := io.ReadAll(resp.Body)
	var result ErrorResponse
	json.Unmarshal(body, &result)
	if result.Error.Code != apperror.CodeNotFound {
		t.Errorf("Expected code NOT_FOUND, got %s", result.Error.Code)
	}
}

func TestErrorCodeMapping(t *testing.T) {
	tests := []struct {
		status   int
		expected apperror.Code
	}{
		{400, apperror.CodeBadRequest},
		{401, apperror.CodeUnauthorized},
		{403, apperror.CodeForbidden},
		{404, apperror.CodeNotFound},
		{409, apperror.CodeConflict},
		{429, apperror.CodeTooManyRequests},
		{410, apperror.CodeGone},
		{500, apperror.CodeInternal},
	}

	for _, tt := range tests {
		app := fiber.New()
		app.Get("/", func(c *fiber.Ctx) error {
			return Error(c, tt.status, "test")
		})

		req := httptest.NewRequest("GET", "/", nil)
		resp, _ := app.Test(req)

		body, _ := io.ReadAll(resp.Body)
		var result ErrorResponse
		json.Unmarshal(body, &result)
		if result.Error.Code != tt.expected {
			t.Errorf("Status %d: expected code %s, got %s", tt.status, tt.expected, result.Error.Code)
		}
	}
}
