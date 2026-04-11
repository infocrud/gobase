package middleware

import (
	"io"
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v2"
	"github.com/sureshkumarselvaraj/gobase/pkg/jwt"
)

func TestJWTProtect_MissingHeader(t *testing.T) {
	app := fiber.New()
	app.Use(JWTProtect("test-secret"))
	app.Get("/", func(c *fiber.Ctx) error {
		return c.SendString("OK")
	})

	req := httptest.NewRequest("GET", "/", nil)
	resp, _ := app.Test(req)
	if resp.StatusCode != 401 {
		t.Errorf("expected 401, got %d", resp.StatusCode)
	}
}

func TestJWTProtect_InvalidFormat(t *testing.T) {
	app := fiber.New()
	app.Use(JWTProtect("test-secret"))
	app.Get("/", func(c *fiber.Ctx) error {
		return c.SendString("OK")
	})

	req := httptest.NewRequest("GET", "/", nil)
	req.Header.Set("Authorization", "InvalidFormat")
	resp, _ := app.Test(req)
	if resp.StatusCode != 401 {
		t.Errorf("expected 401, got %d", resp.StatusCode)
	}
}

func TestJWTProtect_InvalidToken(t *testing.T) {
	app := fiber.New()
	app.Use(JWTProtect("test-secret"))
	app.Get("/", func(c *fiber.Ctx) error {
		return c.SendString("OK")
	})

	req := httptest.NewRequest("GET", "/", nil)
	req.Header.Set("Authorization", "Bearer invalid.token.here")
	resp, _ := app.Test(req)
	if resp.StatusCode != 401 {
		t.Errorf("expected 401, got %d", resp.StatusCode)
	}
}

func TestJWTProtect_ValidToken(t *testing.T) {
	secret := "test-secret-for-jwt-middleware"
	token, err := jwt.GenerateAccessToken(42, "user@test.com", "user", secret, 15*60*1e9) // 15 min
	if err != nil {
		t.Fatal(err)
	}

	var gotUserID uint
	var gotEmail string
	var gotRole string

	app := fiber.New()
	app.Use(JWTProtect(secret))
	app.Get("/", func(c *fiber.Ctx) error {
		gotUserID, _ = c.Locals("user_id").(uint)
		gotEmail, _ = c.Locals("user_email").(string)
		gotRole, _ = c.Locals("user_role").(string)
		return c.SendString("OK")
	})

	req := httptest.NewRequest("GET", "/", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	resp, _ := app.Test(req)

	if resp.StatusCode != 200 {
		body, _ := io.ReadAll(resp.Body)
		t.Fatalf("expected 200, got %d: %s", resp.StatusCode, string(body))
	}
	if gotUserID != 42 {
		t.Errorf("expected user_id=42, got %d", gotUserID)
	}
	if gotEmail != "user@test.com" {
		t.Errorf("expected email=user@test.com, got %s", gotEmail)
	}
	if gotRole != "user" {
		t.Errorf("expected role=user, got %s", gotRole)
	}
}

func TestAdminOnly_NonAdmin(t *testing.T) {
	app := fiber.New()
	app.Use(func(c *fiber.Ctx) error {
		c.Locals("user_role", "user")
		return c.Next()
	})
	app.Use(AdminOnly())
	app.Get("/", func(c *fiber.Ctx) error {
		return c.SendString("OK")
	})

	req := httptest.NewRequest("GET", "/", nil)
	resp, _ := app.Test(req)
	if resp.StatusCode != 403 {
		t.Errorf("expected 403, got %d", resp.StatusCode)
	}
}

func TestAdminOnly_Admin(t *testing.T) {
	app := fiber.New()
	app.Use(func(c *fiber.Ctx) error {
		c.Locals("user_role", "admin")
		return c.Next()
	})
	app.Use(AdminOnly())
	app.Get("/", func(c *fiber.Ctx) error {
		return c.SendString("OK")
	})

	req := httptest.NewRequest("GET", "/", nil)
	resp, _ := app.Test(req)
	if resp.StatusCode != 200 {
		t.Errorf("expected 200, got %d", resp.StatusCode)
	}
}

func TestRequestID_GeneratesNew(t *testing.T) {
	app := fiber.New()
	app.Use(RequestID())
	app.Get("/", func(c *fiber.Ctx) error {
		id, _ := c.Locals("request_id").(string)
		return c.SendString(id)
	})

	req := httptest.NewRequest("GET", "/", nil)
	resp, _ := app.Test(req)
	if resp.StatusCode != 200 {
		t.Fatalf("expected 200, got %d", resp.StatusCode)
	}

	// Check response header
	requestID := resp.Header.Get("X-Request-ID")
	if requestID == "" {
		t.Error("X-Request-ID header should be set")
	}
	if len(requestID) < 32 {
		t.Errorf("request ID looks too short: %s", requestID)
	}
}

func TestRequestID_PreservesExisting(t *testing.T) {
	app := fiber.New()
	app.Use(RequestID())
	app.Get("/", func(c *fiber.Ctx) error {
		id, _ := c.Locals("request_id").(string)
		return c.SendString(id)
	})

	req := httptest.NewRequest("GET", "/", nil)
	req.Header.Set("X-Request-ID", "custom-id-123")
	resp, _ := app.Test(req)

	requestID := resp.Header.Get("X-Request-ID")
	if requestID != "custom-id-123" {
		t.Errorf("expected preserved ID 'custom-id-123', got '%s'", requestID)
	}
}

func TestValidateEmail(t *testing.T) {
	tests := []struct {
		email string
		valid bool
	}{
		{"user@example.com", true},
		{"test@test.co.uk", true},
		{"user+tag@gmail.com", true},
		{"", false},
		{"invalid", false},
		{"@no-user.com", false},
		{"no-domain@", false},
		{"spaces in@email.com", false},
	}

	for _, tt := range tests {
		result := ValidateEmail(tt.email)
		if result != tt.valid {
			t.Errorf("ValidateEmail(%q) = %v, want %v", tt.email, result, tt.valid)
		}
	}
}

func TestValidatePassword(t *testing.T) {
	tests := []struct {
		password string
		valid    bool
	}{
		{"StrongP1", true},            // 8 chars, upper, lower, digit
		{"MyP@ssw0rd", true},          // strong
		{"short1A", false},            // too short
		{"alllowercase1", false},      // no uppercase
		{"ALLUPPERCASE1", false},      // no lowercase
		{"NoDigitsHere", false},       // no digit
		{"", false},                   // empty
	}

	for _, tt := range tests {
		result := ValidatePassword(tt.password)
		if result.Valid != tt.valid {
			t.Errorf("ValidatePassword(%q).Valid = %v, want %v (msg: %s)", tt.password, result.Valid, tt.valid, result.Message)
		}
	}
}
