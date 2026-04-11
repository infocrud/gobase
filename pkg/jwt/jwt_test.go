package jwt

import (
	"testing"
	"time"
)

func TestGenerateAndValidateAccessToken(t *testing.T) {
	secret := "test-secret-key-that-is-long-enough"
	token, err := GenerateAccessToken(1, "user@test.com", "user", secret, 15*time.Minute)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}
	if token == "" {
		t.Fatal("Expected non-empty token")
	}

	claims, err := ValidateToken(token, secret)
	if err != nil {
		t.Fatalf("Expected no error validating token, got %v", err)
	}
	if claims.UserID != 1 {
		t.Errorf("Expected UserID 1, got %d", claims.UserID)
	}
	if claims.Email != "user@test.com" {
		t.Errorf("Expected email user@test.com, got %s", claims.Email)
	}
	if claims.Role != "user" {
		t.Errorf("Expected role 'user', got %s", claims.Role)
	}
	if claims.Issuer != "gobase" {
		t.Errorf("Expected issuer 'gobase', got %s", claims.Issuer)
	}
}

func TestAdminRole(t *testing.T) {
	secret := "test-secret-key"
	token, err := GenerateAccessToken(99, "admin@test.com", "admin", secret, 1*time.Hour)
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}

	claims, err := ValidateToken(token, secret)
	if err != nil {
		t.Fatalf("Unexpected error validating: %v", err)
	}
	if claims.Role != "admin" {
		t.Errorf("Expected role 'admin', got %s", claims.Role)
	}
}

func TestExpiredToken(t *testing.T) {
	secret := "test-secret-key"
	// Create token that expires immediately
	token, err := GenerateAccessToken(1, "user@test.com", "user", secret, -1*time.Hour)
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}

	_, err = ValidateToken(token, secret)
	if err == nil {
		t.Fatal("Expected error for expired token, got nil")
	}
}

func TestInvalidSecret(t *testing.T) {
	token, err := GenerateAccessToken(1, "user@test.com", "user", "secret1", 15*time.Minute)
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}

	_, err = ValidateToken(token, "wrong-secret")
	if err == nil {
		t.Fatal("Expected error for wrong secret, got nil")
	}
}

func TestEmptyToken(t *testing.T) {
	_, err := ValidateToken("", "secret")
	if err == nil {
		t.Fatal("Expected error for empty token, got nil")
	}
}

func TestMalformedToken(t *testing.T) {
	_, err := ValidateToken("not.a.valid.jwt", "secret")
	if err == nil {
		t.Fatal("Expected error for malformed token, got nil")
	}
}

func TestGenerateRefreshToken(t *testing.T) {
	token1, err := GenerateRefreshToken()
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}
	token2, err := GenerateRefreshToken()
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}

	if token1 == "" || token2 == "" {
		t.Fatal("Tokens should not be empty")
	}
	if token1 == token2 {
		t.Fatal("Two refresh tokens should be unique")
	}
	// 64 bytes → 128 hex chars
	if len(token1) != 128 {
		t.Errorf("Expected 128 hex chars, got %d", len(token1))
	}
}

func TestGenerateRandomToken(t *testing.T) {
	token, err := GenerateRandomToken()
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}
	if token == "" {
		t.Fatal("Token should not be empty")
	}
	// 32 bytes → 64 hex chars
	if len(token) != 64 {
		t.Errorf("Expected 64 hex chars, got %d", len(token))
	}
}

func TestHashToken(t *testing.T) {
	hash1 := HashToken("test-token")
	hash2 := HashToken("test-token")
	hash3 := HashToken("different-token")

	if hash1 != hash2 {
		t.Error("Same input should produce same hash")
	}
	if hash1 == hash3 {
		t.Error("Different inputs should produce different hashes")
	}
	// SHA-256 → 64 hex chars
	if len(hash1) != 64 {
		t.Errorf("Expected 64 hex chars, got %d", len(hash1))
	}
}
