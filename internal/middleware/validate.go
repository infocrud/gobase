package middleware

import (
	"net/mail"
	"regexp"
	"unicode"
)

// emailRegex provides a basic email format check for common cases.
var emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)

// ValidateEmail checks that the email address is syntactically valid.
func ValidateEmail(email string) bool {
	if len(email) > 254 {
		return false
	}

	// Use Go's net/mail parser as primary check
	_, err := mail.ParseAddress(email)
	if err != nil {
		return false
	}

	// Additional regex check for common patterns
	return emailRegex.MatchString(email)
}

// PasswordStrength describes the strength validation result.
type PasswordStrength struct {
	Valid    bool
	Message string
}

// ValidatePassword checks password meets minimum security requirements:
//   - At least 8 characters
//   - At least 1 uppercase letter
//   - At least 1 lowercase letter
//   - At least 1 digit
func ValidatePassword(password string) PasswordStrength {
	if len(password) < 8 {
		return PasswordStrength{Valid: false, Message: "Password must be at least 8 characters"}
	}
	if len(password) > 128 {
		return PasswordStrength{Valid: false, Message: "Password must be at most 128 characters"}
	}

	var hasUpper, hasLower, hasDigit bool
	for _, ch := range password {
		switch {
		case unicode.IsUpper(ch):
			hasUpper = true
		case unicode.IsLower(ch):
			hasLower = true
		case unicode.IsDigit(ch):
			hasDigit = true
		}
	}

	if !hasUpper {
		return PasswordStrength{Valid: false, Message: "Password must contain at least one uppercase letter"}
	}
	if !hasLower {
		return PasswordStrength{Valid: false, Message: "Password must contain at least one lowercase letter"}
	}
	if !hasDigit {
		return PasswordStrength{Valid: false, Message: "Password must contain at least one digit"}
	}

	return PasswordStrength{Valid: true, Message: ""}
}
