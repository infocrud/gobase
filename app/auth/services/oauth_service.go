package services

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"github.com/sureshkumarselvaraj/gobase/internal/config"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/github"
	googleOAuth "golang.org/x/oauth2/google"
)

// OAuthUserInfo holds user information from an OAuth provider.
type OAuthUserInfo struct {
	Email      string `json:"email"`
	Name       string `json:"name"`
	ProviderID string `json:"provider_id"`
}

// OAuthService handles OAuth2 flows.
type OAuthService struct {
	googleConfig *oauth2.Config
	githubConfig *oauth2.Config
}

// NewOAuthService creates a new OAuthService with Google and GitHub configs.
func NewOAuthService(cfg config.OAuthConfig) *OAuthService {
	return &OAuthService{
		googleConfig: &oauth2.Config{
			ClientID:     cfg.Google.ClientID,
			ClientSecret: cfg.Google.ClientSecret,
			RedirectURL:  cfg.Google.RedirectURL,
			Scopes:       []string{"openid", "email", "profile"},
			Endpoint:     googleOAuth.Endpoint,
		},
		githubConfig: &oauth2.Config{
			ClientID:     cfg.GitHub.ClientID,
			ClientSecret: cfg.GitHub.ClientSecret,
			RedirectURL:  cfg.GitHub.RedirectURL,
			Scopes:       []string{"user:email", "read:user"},
			Endpoint:     github.Endpoint,
		},
	}
}

// GetAuthURL returns the OAuth2 authorization URL for a provider.
func (s *OAuthService) GetAuthURL(provider, state string) (string, error) {
	cfg, err := s.getConfig(provider)
	if err != nil {
		return "", err
	}
	return cfg.AuthCodeURL(state, oauth2.AccessTypeOffline), nil
}

// ExchangeCode exchanges an authorization code for user info.
func (s *OAuthService) ExchangeCode(ctx context.Context, provider, code string) (*OAuthUserInfo, error) {
	cfg, err := s.getConfig(provider)
	if err != nil {
		return nil, err
	}

	token, err := cfg.Exchange(ctx, code)
	if err != nil {
		return nil, fmt.Errorf("failed to exchange code: %w", err)
	}

	switch provider {
	case "google":
		return s.getGoogleUserInfo(ctx, token)
	case "github":
		return s.getGitHubUserInfo(ctx, token)
	default:
		return nil, fmt.Errorf("unsupported provider: %s", provider)
	}
}

func (s *OAuthService) getConfig(provider string) (*oauth2.Config, error) {
	switch provider {
	case "google":
		return s.googleConfig, nil
	case "github":
		return s.githubConfig, nil
	default:
		return nil, fmt.Errorf("unsupported OAuth provider: %s", provider)
	}
}

// getGoogleUserInfo fetches user info from Google's userinfo endpoint.
func (s *OAuthService) getGoogleUserInfo(ctx context.Context, token *oauth2.Token) (*OAuthUserInfo, error) {
	client := s.googleConfig.Client(ctx, token)
	resp, err := client.Get("https://www.googleapis.com/oauth2/v2/userinfo")
	if err != nil {
		return nil, fmt.Errorf("failed to get Google user info: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("Google userinfo returned status %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read Google response: %w", err)
	}

	var data struct {
		ID    string `json:"id"`
		Email string `json:"email"`
		Name  string `json:"name"`
	}
	if err := json.Unmarshal(body, &data); err != nil {
		return nil, fmt.Errorf("failed to parse Google response: %w", err)
	}

	return &OAuthUserInfo{
		Email:      data.Email,
		Name:       data.Name,
		ProviderID: data.ID,
	}, nil
}

// getGitHubUserInfo fetches user info from GitHub's user API.
func (s *OAuthService) getGitHubUserInfo(ctx context.Context, token *oauth2.Token) (*OAuthUserInfo, error) {
	client := s.githubConfig.Client(ctx, token)

	// Get user profile
	resp, err := client.Get("https://api.github.com/user")
	if err != nil {
		return nil, fmt.Errorf("failed to get GitHub user info: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("GitHub user API returned status %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read GitHub response: %w", err)
	}

	var userData struct {
		ID    int    `json:"id"`
		Login string `json:"login"`
		Email string `json:"email"`
		Name  string `json:"name"`
	}
	if err := json.Unmarshal(body, &userData); err != nil {
		return nil, fmt.Errorf("failed to parse GitHub response: %w", err)
	}

	email := userData.Email

	// If email is private, fetch from emails endpoint
	if email == "" {
		email, err = s.getGitHubPrimaryEmail(ctx, client)
		if err != nil {
			return nil, err
		}
	}

	return &OAuthUserInfo{
		Email:      email,
		Name:       userData.Name,
		ProviderID: fmt.Sprintf("%d", userData.ID),
	}, nil
}

// getGitHubPrimaryEmail fetches the primary email from GitHub's emails API.
func (s *OAuthService) getGitHubPrimaryEmail(ctx context.Context, client *http.Client) (string, error) {
	resp, err := client.Get("https://api.github.com/user/emails")
	if err != nil {
		return "", fmt.Errorf("failed to get GitHub emails: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read GitHub emails: %w", err)
	}

	var emails []struct {
		Email   string `json:"email"`
		Primary bool   `json:"primary"`
	}
	if err := json.Unmarshal(body, &emails); err != nil {
		return "", fmt.Errorf("failed to parse GitHub emails: %w", err)
	}

	for _, e := range emails {
		if e.Primary {
			return e.Email, nil
		}
	}

	if len(emails) > 0 {
		return emails[0].Email, nil
	}

	return "", fmt.Errorf("no email found for GitHub user")
}
