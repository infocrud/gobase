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

	"github.com/sureshkumarselvaraj/gobase/app/functions/handlers"
	"github.com/sureshkumarselvaraj/gobase/app/functions/routes"
	"github.com/sureshkumarselvaraj/gobase/app/functions/runner"
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

	log.Info().Str("port", cfg.Services.FunctionsPort).Msg("Starting GoBase Functions Service")

	// ─── Validate Config ─────────────────────────────
	if err := cfg.ValidateForProduction(); err != nil {
		log.Fatal().Err(err).Msg("Config validation failed")
	}

	// ─── Initialize Runner ────────────────────────────
	funcRunner := runner.NewRunner()

	// ─── Initialize Handlers ──────────────────────────
	funcHandler := handlers.NewFunctionHandler(funcRunner)

	// ─── Create Fiber App ─────────────────────────────
	app := fiber.New(fiber.Config{
		AppName:      "GoBase Functions",
		BodyLimit:    10 * 1024 * 1024, // 10MB max function size
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
			"service": "functions",
			"time":    time.Now().UTC(),
		})
	})

	// ─── Functions Routes (JWT protected) ─────────
	routes.Register(app, funcHandler, cfg.JWT.Secret)

	// ─── Graceful Shutdown ────────────────────────────
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		if err := app.Listen(":" + cfg.Services.FunctionsPort); err != nil {
			log.Fatal().Err(err).Msg("Server failed")
		}
	}()

	<-quit
	log.Info().Msg("Shutting down functions service...")
	if err := app.Shutdown(); err != nil {
		log.Error().Err(err).Msg("Error during shutdown")
	}
	log.Info().Msg("Functions service stopped")
}
