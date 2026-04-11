package apperror

import (
	"errors"
	"fmt"
	"net/http"
	"testing"
)

func TestNew(t *testing.T) {
	err := New(CodeNotFound, "user not found")
	if err.Code != CodeNotFound {
		t.Errorf("unexpected code: %s", err.Code)
	}
	if err.Message != "user not found" {
		t.Errorf("unexpected message: %s", err.Message)
	}
	if err.HTTPStatus != http.StatusNotFound {
		t.Errorf("unexpected status: %d", err.HTTPStatus)
	}
}

func TestWrap(t *testing.T) {
	cause := fmt.Errorf("connection refused")
	err := Wrap(cause, CodeInternal, "database error")

	if err.Cause != cause {
		t.Error("cause not preserved")
	}
	if !errors.Is(err, cause) {
		t.Error("errors.Is should match cause via Unwrap")
	}
}

func TestValidation(t *testing.T) {
	err := Validation("email", "invalid format")
	if err.Code != CodeValidation {
		t.Errorf("unexpected code: %s", err.Code)
	}
	if err.Details["email"] != "invalid format" {
		t.Error("validation details not set correctly")
	}
	if err.HTTPStatus != http.StatusUnprocessableEntity {
		t.Errorf("unexpected status: %d", err.HTTPStatus)
	}
}

func TestErrorString(t *testing.T) {
	err := New(CodeNotFound, "not found")
	expected := "NOT_FOUND: not found"
	if err.Error() != expected {
		t.Errorf("expected %q, got %q", expected, err.Error())
	}

	cause := fmt.Errorf("db down")
	wrapped := Wrap(cause, CodeInternal, "query failed")
	if wrapped.Error() != "INTERNAL_ERROR: query failed: db down" {
		t.Errorf("unexpected wrapped error: %s", wrapped.Error())
	}
}

func TestIs(t *testing.T) {
	err := New(CodeNotFound, "missing")
	if !Is(err, CodeNotFound) {
		t.Error("Is should return true for matching code")
	}
	if Is(err, CodeInternal) {
		t.Error("Is should return false for non-matching code")
	}
	if Is(fmt.Errorf("plain error"), CodeNotFound) {
		t.Error("Is should return false for non-apperror")
	}
}

func TestAsAppError(t *testing.T) {
	appErr := New(CodeBadRequest, "bad")
	extracted, ok := AsAppError(appErr)
	if !ok || extracted.Code != CodeBadRequest {
		t.Error("AsAppError should extract apperror.Error")
	}

	_, ok = AsAppError(fmt.Errorf("plain"))
	if ok {
		t.Error("AsAppError should return false for non-apperror")
	}
}

func TestStatusForCode(t *testing.T) {
	tests := map[Code]int{
		CodeBadRequest:      400,
		CodeUnauthorized:    401,
		CodeForbidden:       403,
		CodeNotFound:        404,
		CodeConflict:        409,
		CodeTooManyRequests: 429,
		CodeInternal:        500,
		CodeTimeout:         504,
		Code("UNKNOWN"):     500, // fallback
	}

	for code, expected := range tests {
		if got := StatusForCode(code); got != expected {
			t.Errorf("StatusForCode(%s) = %d, want %d", code, got, expected)
		}
	}
}
