package main

import (
	"fmt"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"

	"github.com/sureshkumarselvaraj/gobase/app/auth/handlers"
	"github.com/sureshkumarselvaraj/gobase/app/auth/routes"
	"github.com/sureshkumarselvaraj/gobase/app/auth/services"
	"github.com/sureshkumarselvaraj/gobase/internal/config"
	"github.com/sureshkumarselvaraj/gobase/internal/db"
	"github.com/sureshkumarselvaraj/gobase/internal/email"
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
		log.Logger = log.Output(zerolog.ConsoleWriter{
			Out:        os.Stdout,
			TimeFormat: time.RFC3339,
		})
	}

	log.Info().
		Str("env", cfg.App.Env).
		Str("port", cfg.Services.AuthPort).
		Msg("Starting GoBase Auth Service")

	// ─── Validate Config ─────────────────────────────
	if err := cfg.ValidateForProduction(); err != nil {
		log.Fatal().Err(err).Msg("Config validation failed")
	}

	// ─── Connect Database ─────────────────────────────
	database, err := db.Connect(cfg.DB)
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to connect to database")
	}

	// ─── Auto-Migrate (development only) ─────────────
	// In production, run migrations explicitly via: make migrate
	if cfg.App.Env == "development" {
		if err := db.AutoMigrate(database); err != nil {
			log.Fatal().Err(err).Msg("Failed to run migrations")
		}
	}

	// ─── Initialize Email Sender ──────────────────────
	emailSender := email.NewSender(cfg.SMTP)

	// ─── Initialize Services ──────────────────────────
	baseURL := fmt.Sprintf("http://localhost:%s", cfg.Services.GatewayPort)
	authService := services.NewAuthService(database, cfg.JWT, emailSender, baseURL)
	oauthService := services.NewOAuthService(cfg.OAuth)

	// ─── Initialize Handlers ──────────────────────────
	authHandler := handlers.NewAuthHandler(authService)
	oauthHandler := handlers.NewOAuthHandler(authService, oauthService)
	verifyHandler := handlers.NewVerifyHandler(authService)
	resetHandler := handlers.NewResetHandler(authService)
	adminHandler := handlers.NewAdminHandler(authService)

	// ─── Create Fiber App ─────────────────────────────
	app := fiber.New(fiber.Config{
		AppName:      "GoBase Auth",
		ErrorHandler: apphandler.ErrorHandler,
	})

	// ─── Global Middleware ────────────────────────────
	app.Use(recover.New())
	app.Use(middleware.RequestID())
	app.Use(middleware.CORS(cfg.CORS))
	app.Use(middleware.Logger(log.Logger))

	// ─── Health Check ─────────────────────────────────
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":  "healthy",
			"service": "auth",
			"time":    time.Now().UTC(),
		})
	})

	// ─── Auth Routes ──────────────────────────────────
	routes.Register(app, routes.Handlers{
		Auth:   authHandler,
		OAuth:  oauthHandler,
		Verify: verifyHandler,
		Reset:  resetHandler,
		Admin:  adminHandler,
	}, cfg.JWT.Secret)

	// ─── Graceful Shutdown ────────────────────────────
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		if err := app.Listen(":" + cfg.Services.AuthPort); err != nil {
			log.Fatal().Err(err).Msg("Server failed")
		}
	}()

	<-quit
	log.Info().Msg("Shutting down auth service...")
	if err := app.Shutdown(); err != nil {
		log.Error().Err(err).Msg("Error during shutdown")
	}
	log.Info().Msg("Auth service stopped")
}
