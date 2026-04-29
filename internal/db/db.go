package db

import (
	"fmt"
	"time"

	"github.com/rs/zerolog/log"
	"github.com/sureshkumarselvaraj/gobase/internal/config"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// BaseModel is embedded in all DB models per project convention.
type BaseModel struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`
}

// Connect establishes a GORM MySQL connection with connection pooling
// and retry logic with exponential backoff.
func Connect(cfg config.DBConfig) (*gorm.DB, error) {
	if cfg.Host == "" {
		return nil, fmt.Errorf("database host is required")
	}

	// Set GORM log level based on environment
	gormLogLevel := logger.Warn
	if cfg.LogVerbose {
		gormLogLevel = logger.Info
	}

	var db *gorm.DB
	var err error

	// Retry with exponential backoff: 1s, 2s, 4s, 8s, 16s
	maxRetries := 5
	for attempt := 0; attempt < maxRetries; attempt++ {
		db, err = gorm.Open(postgres.Open(cfg.DSN()), &gorm.Config{
			Logger:                 logger.Default.LogMode(gormLogLevel),
			SkipDefaultTransaction: true,
			PrepareStmt:            true,
		})
		if err == nil {
			break
		}

		waitTime := time.Duration(1<<uint(attempt)) * time.Second
		log.Warn().
			Err(err).
			Int("attempt", attempt+1).
			Int("max_retries", maxRetries).
			Dur("retry_in", waitTime).
			Msg("Failed to connect to database, retrying...")
		time.Sleep(waitTime)
	}

	if err != nil {
		return nil, fmt.Errorf("failed to connect to database after %d attempts: %w", maxRetries, err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to get underlying sql.DB: %w", err)
	}

	// Configure connection pool
	sqlDB.SetMaxOpenConns(cfg.MaxOpenConns)
	sqlDB.SetMaxIdleConns(cfg.MaxIdleConns)
	sqlDB.SetConnMaxLifetime(cfg.ConnMaxLifetime)

	log.Info().
		Str("host", cfg.Host).
		Str("port", cfg.Port).
		Str("database", cfg.Name).
		Int("max_open_conns", cfg.MaxOpenConns).
		Int("max_idle_conns", cfg.MaxIdleConns).
		Msg("Database connected")

	return db, nil
}

// AutoMigrate runs GORM auto-migration for all models.
func AutoMigrate(db *gorm.DB) error {
	log.Info().Msg("Running auto-migrations...")

	err := db.AutoMigrate(
		&User{},
		&RefreshToken{},
		&Policy{},
		&RealtimeChange{},
		&Organization{},
		&Project{},
	)
	if err != nil {
		return fmt.Errorf("auto-migration failed: %w", err)
	}

	log.Info().Msg("Auto-migrations completed successfully")
	return nil
}
