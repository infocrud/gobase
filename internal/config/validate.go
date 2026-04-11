package config

import (
	"fmt"
	"strings"

	"github.com/rs/zerolog/log"
)

// insecure defaults that must be changed for production.
var insecureDefaults = map[string]string{
	"JWT_SECRET":      "change-me-to-a-random-64-char-string",
	"MINIO_ACCESS_KEY": "minioadmin",
	"MINIO_SECRET_KEY": "minioadmin",
}

// ValidateForProduction checks that security-sensitive config values
// have been changed from their insecure defaults. It returns an error
// if the application is running in production with dangerous settings.
// In development mode it logs warnings instead.
func (c *Config) ValidateForProduction() error {
	isProduction := strings.EqualFold(c.App.Env, "production")
	var errs []string

	// ── Secret Defaults ──────────────────────────────────
	if c.JWT.Secret == insecureDefaults["JWT_SECRET"] {
		msg := "JWT_SECRET is set to the insecure default — generate one with: openssl rand -hex 32"
		if isProduction {
			errs = append(errs, msg)
		} else {
			log.Warn().Msg("⚠ " + msg)
		}
	}

	if c.MinIO.AccessKey == insecureDefaults["MINIO_ACCESS_KEY"] {
		msg := "MINIO_ACCESS_KEY is set to the insecure default 'minioadmin'"
		if isProduction {
			errs = append(errs, msg)
		} else {
			log.Warn().Msg("⚠ " + msg)
		}
	}

	if c.MinIO.SecretKey == insecureDefaults["MINIO_SECRET_KEY"] {
		msg := "MINIO_SECRET_KEY is set to the insecure default 'minioadmin'"
		if isProduction {
			errs = append(errs, msg)
		} else {
			log.Warn().Msg("⚠ " + msg)
		}
	}

	// ── Database ─────────────────────────────────────────
	if c.DB.User == "root" {
		msg := "DB_USER is 'root' — use a dedicated database user with limited privileges"
		if isProduction {
			errs = append(errs, msg)
		} else {
			log.Warn().Msg("⚠ " + msg)
		}
	}

	if c.DB.Password == "" {
		msg := "DB_PASSWORD is empty"
		if isProduction {
			errs = append(errs, msg)
		} else {
			log.Warn().Msg("⚠ " + msg)
		}
	}

	// ── Redis ────────────────────────────────────────────
	if isProduction && c.Redis.Password == "" {
		errs = append(errs, "REDIS_PASSWORD is empty — Redis must be password-protected in production")
	}

	// ── MinIO SSL ────────────────────────────────────────
	if isProduction && !c.MinIO.UseSSL {
		log.Warn().Msg("⚠ MINIO_USE_SSL is false — enable SSL for production MinIO connections")
	}

	// ── CORS ─────────────────────────────────────────────
	if isProduction && c.CORS.AllowedOrigins == "*" {
		errs = append(errs, "CORS_ALLOWED_ORIGINS is '*' — restrict to your actual frontend domain(s) in production")
	}

	// ── TLS ──────────────────────────────────────────────
	if isProduction {
		log.Warn().Msg("⚠ Ensure a TLS-terminating reverse proxy (Nginx/Caddy) is in front of all services")
	}

	// ── Log Level ────────────────────────────────────────
	if isProduction && c.App.LogLevel.String() == "debug" {
		log.Warn().Msg("⚠ LOG_LEVEL is 'debug' in production — consider 'info' or 'warn' to reduce log volume")
	}

	if len(errs) > 0 {
		return fmt.Errorf("production config validation failed:\n  • %s", strings.Join(errs, "\n  • "))
	}

	return nil
}
