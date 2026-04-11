// Package apperror provides structured application errors with HTTP status codes
// and machine-readable error codes for consistent API error responses.
//
// Usage:
//
//	return apperror.New(apperror.CodeNotFound, "user not found")
//	return apperror.Wrap(err, apperror.CodeInternal, "database query failed")
//	return apperror.Validation("email", "invalid email format")
package apperror

import (
	"fmt"
	"net/http"
)

// Code is a machine-readable error code returned in API responses.
type Code string

const (
	// Client errors
	CodeBadRequest      Code = "BAD_REQUEST"
	CodeValidation      Code = "VALIDATION_ERROR"
	CodeUnauthorized    Code = "UNAUTHORIZED"
	CodeForbidden       Code = "FORBIDDEN"
	CodeNotFound        Code = "NOT_FOUND"
	CodeConflict        Code = "CONFLICT"
	CodeTooManyRequests Code = "TOO_MANY_REQUESTS"
	CodeGone            Code = "GONE"

	// Server errors
	CodeInternal Code = "INTERNAL_ERROR"
	CodeTimeout  Code = "TIMEOUT"

	// Auth-specific errors
	CodeInvalidCredentials Code = "INVALID_CREDENTIALS"
	CodeTokenExpired       Code = "TOKEN_EXPIRED"
	CodeTokenRevoked       Code = "TOKEN_REVOKED"
	CodeTokenInvalid       Code = "TOKEN_INVALID"
	CodeUserExists         Code = "USER_EXISTS"
	CodeAlreadyVerified    Code = "ALREADY_VERIFIED"
)

// httpStatusMap maps error codes to their default HTTP status codes.
var httpStatusMap = map[Code]int{
	CodeBadRequest:         http.StatusBadRequest,
	CodeValidation:         http.StatusUnprocessableEntity,
	CodeUnauthorized:       http.StatusUnauthorized,
	CodeForbidden:          http.StatusForbidden,
	CodeNotFound:           http.StatusNotFound,
	CodeConflict:           http.StatusConflict,
	CodeTooManyRequests:    http.StatusTooManyRequests,
	CodeGone:               http.StatusGone,
	CodeInternal:           http.StatusInternalServerError,
	CodeTimeout:            http.StatusGatewayTimeout,
	CodeInvalidCredentials: http.StatusUnauthorized,
	CodeTokenExpired:       http.StatusUnauthorized,
	CodeTokenRevoked:       http.StatusUnauthorized,
	CodeTokenInvalid:       http.StatusUnauthorized,
	CodeUserExists:         http.StatusConflict,
	CodeAlreadyVerified:    http.StatusOK,
}

// Error is a structured application error.
type Error struct {
	// Code is the machine-readable error code.
	Code Code `json:"code"`

	// Message is the human-readable error message.
	Message string `json:"message"`

	// HTTPStatus is the HTTP status code to return.
	HTTPStatus int `json:"-"`

	// Details contains optional field-level validation errors.
	Details map[string]string `json:"details,omitempty"`

	// Cause is the underlying error, if any.
	Cause error `json:"-"`
}

// Error implements the error interface.
func (e *Error) Error() string {
	if e.Cause != nil {
		return fmt.Sprintf("%s: %s: %v", e.Code, e.Message, e.Cause)
	}
	return fmt.Sprintf("%s: %s", e.Code, e.Message)
}

// Unwrap returns the underlying error for errors.Is/As support.
func (e *Error) Unwrap() error {
	return e.Cause
}

// New creates a new application error with the given code and message.
func New(code Code, message string) *Error {
	return &Error{
		Code:       code,
		Message:    message,
		HTTPStatus: StatusForCode(code),
	}
}

// Wrap creates a new application error wrapping an existing error.
func Wrap(err error, code Code, message string) *Error {
	return &Error{
		Code:       code,
		Message:    message,
		HTTPStatus: StatusForCode(code),
		Cause:      err,
	}
}

// Validation creates a validation error with field-level details.
func Validation(field, message string) *Error {
	return &Error{
		Code:       CodeValidation,
		Message:    fmt.Sprintf("Validation failed: %s", message),
		HTTPStatus: StatusForCode(CodeValidation),
		Details:    map[string]string{field: message},
	}
}

// StatusForCode returns the HTTP status for an error code.
func StatusForCode(code Code) int {
	if status, ok := httpStatusMap[code]; ok {
		return status
	}
	return http.StatusInternalServerError
}

// Is checks if an error matches a specific error code.
func Is(err error, code Code) bool {
	if appErr, ok := err.(*Error); ok {
		return appErr.Code == code
	}
	return false
}

// AsAppError attempts to extract an *Error from an error chain.
func AsAppError(err error) (*Error, bool) {
	if appErr, ok := err.(*Error); ok {
		return appErr, true
	}
	return nil, false
}
