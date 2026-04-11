package main

import (
	"os"
	"time"

	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"

	"github.com/sureshkumarselvaraj/gobase/internal/config"
	"github.com/sureshkumarselvaraj/gobase/internal/db"
)

// cleanup removes expired and revoked refresh tokens from the database.
// Run via: go run ./app/cleanup   or   make cleanup
func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to load config")
	}

	zerolog.SetGlobalLevel(cfg.App.LogLevel)
	if cfg.App.Env == "development" {
		log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stdout, TimeFormat: time.RFC3339})
	}

	log.Info().Msg("Starting token cleanup...")

	database, err := db.Connect(cfg.DB)
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to connect to database")
	}

	// Delete expired tokens
	result := database.Where("expires_at < ?", time.Now()).Delete(&db.RefreshToken{})
	log.Info().Int64("expired_deleted", result.RowsAffected).Msg("Deleted expired tokens")

	// Delete revoked tokens older than 30 days
	cutoff := time.Now().Add(-30 * 24 * time.Hour)
	result = database.Where("revoked = ? AND updated_at < ?", true, cutoff).Delete(&db.RefreshToken{})
	log.Info().Int64("revoked_deleted", result.RowsAffected).Msg("Deleted old revoked tokens")

	log.Info().Msg("Token cleanup completed")
}
