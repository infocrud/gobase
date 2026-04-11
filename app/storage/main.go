package main

import (
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"

	"github.com/sureshkumarselvaraj/gobase/app/storage/handlers"
	"github.com/sureshkumarselvaraj/gobase/app/storage/routes"
	"github.com/sureshkumarselvaraj/gobase/app/storage/store"
	"github.com/sureshkumarselvaraj/gobase/internal/config"
	apphandler "github.com/sureshkumarselvaraj/gobase/internal/handler"
	"github.com/sureshkumarselvaraj/gobase/internal/middleware"
)

func main() {
	// ─── Load Config ──────────────────────────────────
	cfg, err := config.Load()
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to load config")
	}

	// ─── Setup Zerolog ────────────────────────────────
	zerolog.SetGlobalLevel(cfg.App.LogLevel)
	if cfg.App.Env == "development" {
		log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stdout, TimeFormat: time.RFC3339})
	}

	log.Info().Str("port", cfg.Services.StoragePort).Msg("Starting GoBase Storage Service")

	// ─── Validate Config ─────────────────────────────
	if err := cfg.ValidateForProduction(); err != nil {
		log.Fatal().Err(err).Msg("Config validation failed")
	}

	// ─── Initialize MinIO ─────────────────────────────
	minioStore, err := store.NewMinIOStore(cfg.MinIO)
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to initialize MinIO")
	}

	// ─── Initialize Handlers ──────────────────────────
	objectHandler := handlers.NewObjectHandler(minioStore)
	signHandler := handlers.NewSignHandler(minioStore)
	bucketHandler := handlers.NewBucketHandler(minioStore)

	// ─── Create Fiber App ─────────────────────────────
	app := fiber.New(fiber.Config{
		AppName:      "GoBase Storage",
		BodyLimit:    100 * 1024 * 1024, // 100MB max upload
		ErrorHandler: apphandler.ErrorHandler,
	})

	app.Use(recover.New())
	app.Use(middleware.RequestID())
	app.Use(middleware.CORS(cfg.CORS))
	app.Use(middleware.Logger(log.Logger))

	// ─── Health Check ─────────────────────────────────
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":  "healthy",
			"service": "storage",
			"time":    time.Now().UTC(),
		})
	})

	// ─── Storage Routes (JWT protected) ───────────
	routes.Register(app, routes.Handlers{
		Object: objectHandler,
		Sign:   signHandler,
		Bucket: bucketHandler,
	}, cfg.JWT.Secret)

	// ─── Graceful Shutdown ────────────────────────────
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		if err := app.Listen(":" + cfg.Services.StoragePort); err != nil {
			log.Fatal().Err(err).Msg("Server failed")
		}
	}()

	<-quit
	log.Info().Msg("Shutting down storage service...")
	if err := app.Shutdown(); err != nil {
		log.Error().Err(err).Msg("Error during shutdown")
	}
	log.Info().Msg("Storage service stopped")
}
