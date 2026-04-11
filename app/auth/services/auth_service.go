package services

import (
	"errors"
	"fmt"
	"time"

	"github.com/rs/zerolog/log"
	"github.com/sureshkumarselvaraj/gobase/internal/config"
	"github.com/sureshkumarselvaraj/gobase/internal/db"
	"github.com/sureshkumarselvaraj/gobase/internal/email"
	"github.com/sureshkumarselvaraj/gobase/pkg/apperror"
	"github.com/sureshkumarselvaraj/gobase/pkg/jwt"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

var (
	ErrUserExists         = apperror.New(apperror.CodeUserExists, "user with this email already exists")
	ErrInvalidCredentials = apperror.New(apperror.CodeInvalidCredentials, "invalid email or password")
	ErrInvalidToken       = apperror.New(apperror.CodeTokenInvalid, "invalid or expired token")
	ErrTokenRevoked       = apperror.New(apperror.CodeTokenRevoked, "token has been revoked")
	ErrTokenExpired       = apperror.New(apperror.CodeTokenExpired, "token has expired")
	ErrUserNotFound       = apperror.New(apperror.CodeNotFound, "user not found")
	ErrAlreadyVerified    = apperror.New(apperror.CodeAlreadyVerified, "email is already verified")
)

// AuthService handles authentication business logic.
type AuthService struct {
	db          *gorm.DB
	jwtCfg      config.JWTConfig
	emailSender email.Sender
	baseURL     string
}

// NewAuthService creates a new AuthService.
func NewAuthService(database *gorm.DB, jwtCfg config.JWTConfig, emailSender email.Sender, baseURL string) *AuthService {
	return &AuthService{
		db:          database,
		jwtCfg:      jwtCfg,
		emailSender: emailSender,
		baseURL:     baseURL,
	}
}

// TokenPair holds an access token and refresh token.
type TokenPair struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int64  `json:"expires_in"`
	TokenType    string `json:"token_type"`
}

// SignupInput is the request body for signup.
type SignupInput struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// LoginInput is the request body for login.
type LoginInput struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// Signup creates a new user with email and password.
func (s *AuthService) Signup(input SignupInput) (*db.User, *TokenPair, error) {
	// Check if user exists
	var existing db.User
	result := s.db.Where("email = ?", input.Email).First(&existing)
	if result.Error == nil {
		return nil, nil, ErrUserExists
	}
	if !errors.Is(result.Error, gorm.ErrRecordNotFound) {
		return nil, nil, fmt.Errorf("database error: %w", result.Error)
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to hash password: %w", err)
	}

	// Generate verification token
	verifyToken, err := jwt.GenerateRandomToken()
	if err != nil {
		return nil, nil, err
	}
	verifyExpiry := time.Now().Add(24 * time.Hour)

	// Create user
	user := db.User{
		Email:              input.Email,
		PasswordHash:       string(hashedPassword),
		Provider:           "email",
		Role:               "user",
		VerificationToken:  jwt.HashToken(verifyToken),
		VerificationExpiry: &verifyExpiry,
	}

	if err := s.db.Create(&user).Error; err != nil {
		return nil, nil, fmt.Errorf("failed to create user: %w", err)
	}

	log.Info().Uint("user_id", user.ID).Str("email", user.Email).Msg("User created")

	// Send verification email
	verifyURL := fmt.Sprintf("%s/auth/verify?token=%s", s.baseURL, verifyToken)
	go s.emailSender.Send(user.Email, "Verify your GoBase email",
		fmt.Sprintf("Click to verify your email: <a href=\"%s\">%s</a>", verifyURL, verifyURL))

	// Generate tokens
	tokens, err := s.generateTokenPair(user.ID, user.Email, user.Role)
	if err != nil {
		return nil, nil, err
	}

	return &user, tokens, nil
}

// VerifyEmail verifies a user's email address using the verification token.
func (s *AuthService) VerifyEmail(token string) error {
	tokenHash := jwt.HashToken(token)

	var user db.User
	result := s.db.Where("verification_token = ?", tokenHash).First(&user)
	if errors.Is(result.Error, gorm.ErrRecordNotFound) {
		return ErrInvalidToken
	}
	if result.Error != nil {
		return fmt.Errorf("database error: %w", result.Error)
	}

	if user.EmailVerified {
		return ErrAlreadyVerified
	}

	if user.VerificationExpiry != nil && time.Now().After(*user.VerificationExpiry) {
		return ErrTokenExpired
	}

	user.EmailVerified = true
	user.VerificationToken = ""
	user.VerificationExpiry = nil
	s.db.Save(&user)

	log.Info().Uint("user_id", user.ID).Msg("Email verified")
	return nil
}

// ResendVerification sends a new verification email.
func (s *AuthService) ResendVerification(emailAddr string) error {
	var user db.User
	result := s.db.Where("email = ?", emailAddr).First(&user)
	if errors.Is(result.Error, gorm.ErrRecordNotFound) {
		return ErrUserNotFound
	}

	if user.EmailVerified {
		return ErrAlreadyVerified
	}

	verifyToken, err := jwt.GenerateRandomToken()
	if err != nil {
		return err
	}
	verifyExpiry := time.Now().Add(24 * time.Hour)
	user.VerificationToken = jwt.HashToken(verifyToken)
	user.VerificationExpiry = &verifyExpiry
	s.db.Save(&user)

	verifyURL := fmt.Sprintf("%s/auth/verify?token=%s", s.baseURL, verifyToken)
	go s.emailSender.Send(user.Email, "Verify your GoBase email",
		fmt.Sprintf("Click to verify your email: <a href=\"%s\">%s</a>", verifyURL, verifyURL))

	return nil
}

// ForgotPassword generates a password reset token and sends it via email.
func (s *AuthService) ForgotPassword(emailAddr string) error {
	var user db.User
	result := s.db.Where("email = ? AND provider = ?", emailAddr, "email").First(&user)
	if errors.Is(result.Error, gorm.ErrRecordNotFound) {
		// Don't reveal whether user exists
		return nil
	}

	resetToken, err := jwt.GenerateRandomToken()
	if err != nil {
		return err
	}
	resetExpiry := time.Now().Add(1 * time.Hour)
	user.ResetToken = jwt.HashToken(resetToken)
	user.ResetTokenExpiry = &resetExpiry
	s.db.Save(&user)

	resetURL := fmt.Sprintf("%s/auth/reset-password?token=%s", s.baseURL, resetToken)
	go s.emailSender.Send(user.Email, "Reset your GoBase password",
		fmt.Sprintf("Click to reset your password: <a href=\"%s\">%s</a>", resetURL, resetURL))

	log.Info().Str("email", emailAddr).Msg("Password reset email sent")
	return nil
}

// ResetPassword resets the user's password using a reset token.
func (s *AuthService) ResetPassword(token, newPassword string) error {
	tokenHash := jwt.HashToken(token)

	var user db.User
	result := s.db.Where("reset_token = ?", tokenHash).First(&user)
	if errors.Is(result.Error, gorm.ErrRecordNotFound) {
		return ErrInvalidToken
	}

	if user.ResetTokenExpiry != nil && time.Now().After(*user.ResetTokenExpiry) {
		return ErrTokenExpired
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}

	user.PasswordHash = string(hashedPassword)
	user.ResetToken = ""
	user.ResetTokenExpiry = nil
	s.db.Save(&user)

	// Revoke all refresh tokens for security
	s.db.Model(&db.RefreshToken{}).
		Where("user_id = ? AND revoked = ?", user.ID, false).
		Update("revoked", true)

	log.Info().Uint("user_id", user.ID).Msg("Password reset completed")
	return nil
}

// Login authenticates a user with email and password.
func (s *AuthService) Login(input LoginInput) (*db.User, *TokenPair, error) {
	var user db.User
	result := s.db.Where("email = ? AND provider = ?", input.Email, "email").First(&user)
	if errors.Is(result.Error, gorm.ErrRecordNotFound) {
		return nil, nil, ErrInvalidCredentials
	}
	if result.Error != nil {
		return nil, nil, fmt.Errorf("database error: %w", result.Error)
	}

	// Verify password
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(input.Password)); err != nil {
		return nil, nil, ErrInvalidCredentials
	}

	log.Info().Uint("user_id", user.ID).Msg("User logged in")

	// Generate tokens
	tokens, err := s.generateTokenPair(user.ID, user.Email, user.Role)
	if err != nil {
		return nil, nil, err
	}

	return &user, tokens, nil
}

// RefreshTokens validates a refresh token and returns a new token pair (rotation).
func (s *AuthService) RefreshTokens(refreshToken string) (*TokenPair, error) {
	tokenHash := jwt.HashToken(refreshToken)

	var storedToken db.RefreshToken
	result := s.db.Where("token_hash = ?", tokenHash).First(&storedToken)
	if errors.Is(result.Error, gorm.ErrRecordNotFound) {
		return nil, ErrInvalidToken
	}
	if result.Error != nil {
		return nil, fmt.Errorf("database error: %w", result.Error)
	}

	// Check if revoked
	if storedToken.Revoked {
		// Possible token reuse attack — revoke all tokens for this user
		s.db.Model(&db.RefreshToken{}).
			Where("user_id = ?", storedToken.UserID).
			Update("revoked", true)
		log.Warn().Uint("user_id", storedToken.UserID).Msg("Possible token reuse attack detected — all tokens revoked")
		return nil, ErrTokenRevoked
	}

	// Check if expired
	if time.Now().After(storedToken.ExpiresAt) {
		return nil, ErrInvalidToken
	}

	// Revoke old token
	s.db.Model(&storedToken).Update("revoked", true)

	// Get user for new token
	var user db.User
	if err := s.db.First(&user, storedToken.UserID).Error; err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}

	// Generate new token pair
	tokens, err := s.generateTokenPair(storedToken.UserID, user.Email, user.Role)
	if err != nil {
		return nil, err
	}

	log.Info().Uint("user_id", storedToken.UserID).Msg("Tokens refreshed")
	return tokens, nil
}

// Logout revokes all refresh tokens for a user.
func (s *AuthService) Logout(userID uint) error {
	result := s.db.Model(&db.RefreshToken{}).
		Where("user_id = ? AND revoked = ?", userID, false).
		Update("revoked", true)

	if result.Error != nil {
		return fmt.Errorf("failed to revoke tokens: %w", result.Error)
	}

	log.Info().Uint("user_id", userID).Int64("revoked_count", result.RowsAffected).Msg("User logged out")
	return nil
}

// FindOrCreateOAuthUser finds or creates a user from an OAuth provider.
func (s *AuthService) FindOrCreateOAuthUser(email, provider, providerID string) (*db.User, *TokenPair, error) {
	var user db.User

	// Try to find by provider + provider_id
	result := s.db.Where("provider = ? AND provider_id = ?", provider, providerID).First(&user)
	if result.Error == nil {
		// Existing OAuth user — generate tokens
		tokens, err := s.generateTokenPair(user.ID, user.Email, user.Role)
		if err != nil {
			return nil, nil, err
		}
		return &user, tokens, nil
	}

	if !errors.Is(result.Error, gorm.ErrRecordNotFound) {
		return nil, nil, fmt.Errorf("database error: %w", result.Error)
	}

	// Check if email exists with different provider
	result = s.db.Where("email = ?", email).First(&user)
	if result.Error == nil {
		// Link OAuth to existing account
		user.Provider = provider
		user.ProviderID = providerID
		user.EmailVerified = true
		s.db.Save(&user)

		tokens, err := s.generateTokenPair(user.ID, user.Email, user.Role)
		if err != nil {
			return nil, nil, err
		}
		return &user, tokens, nil
	}

	// Create new OAuth user
	user = db.User{
		Email:         email,
		Provider:      provider,
		ProviderID:    providerID,
		EmailVerified: true,
		Role:          "user",
	}

	if err := s.db.Create(&user).Error; err != nil {
		return nil, nil, fmt.Errorf("failed to create OAuth user: %w", err)
	}

	log.Info().Uint("user_id", user.ID).Str("provider", provider).Msg("OAuth user created")

	tokens, err := s.generateTokenPair(user.ID, user.Email, user.Role)
	if err != nil {
		return nil, nil, err
	}

	return &user, tokens, nil
}

// ─── Admin Methods ────────────────────────────────────

// ListUsers returns paginated list of all users. Admin only.
func (s *AuthService) ListUsers(page, limit int) ([]db.User, int64, error) {
	var users []db.User
	var total int64

	s.db.Model(&db.User{}).Count(&total)

	offset := (page - 1) * limit
	result := s.db.Order("created_at DESC").Offset(offset).Limit(limit).Find(&users)
	if result.Error != nil {
		return nil, 0, result.Error
	}

	return users, total, nil
}

// GetUser returns a single user by ID. Admin only.
func (s *AuthService) GetUser(id uint) (*db.User, error) {
	var user db.User
	if err := s.db.First(&user, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}
	return &user, nil
}

// UpdateUserRole updates a user's role. Admin only.
func (s *AuthService) UpdateUserRole(id uint, role string) error {
	result := s.db.Model(&db.User{}).Where("id = ?", id).Update("role", role)
	if result.RowsAffected == 0 {
		return ErrUserNotFound
	}
	return result.Error
}

// DeleteUser removes a user and their tokens. Admin only.
func (s *AuthService) DeleteUser(id uint) error {
	// Delete refresh tokens
	s.db.Where("user_id = ?", id).Delete(&db.RefreshToken{})
	// Delete user
	result := s.db.Delete(&db.User{}, id)
	if result.RowsAffected == 0 {
		return ErrUserNotFound
	}
	return result.Error
}

// generateTokenPair creates an access token and stores a hashed refresh token.
func (s *AuthService) generateTokenPair(userID uint, email string, role string) (*TokenPair, error) {
	// Generate access token
	accessToken, err := jwt.GenerateAccessToken(userID, email, role, s.jwtCfg.Secret, s.jwtCfg.AccessExpiry)
	if err != nil {
		return nil, fmt.Errorf("failed to generate access token: %w", err)
	}

	// Generate refresh token
	refreshToken, err := jwt.GenerateRefreshToken()
	if err != nil {
		return nil, fmt.Errorf("failed to generate refresh token: %w", err)
	}

	// Store hashed refresh token in DB
	tokenHash := jwt.HashToken(refreshToken)
	storedToken := db.RefreshToken{
		UserID:    userID,
		TokenHash: tokenHash,
		ExpiresAt: time.Now().Add(s.jwtCfg.RefreshExpiry),
	}

	if err := s.db.Create(&storedToken).Error; err != nil {
		return nil, fmt.Errorf("failed to store refresh token: %w", err)
	}

	return &TokenPair{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    int64(s.jwtCfg.AccessExpiry.Seconds()),
		TokenType:    "Bearer",
	}, nil
}
