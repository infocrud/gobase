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

	"github.com/sureshkumarselvaraj/gobase/app/realtime/handlers"
	"github.com/sureshkumarselvaraj/gobase/app/realtime/hub"
	"github.com/sureshkumarselvaraj/gobase/app/realtime/notifier"
	"github.com/sureshkumarselvaraj/gobase/app/realtime/routes"
	"github.com/sureshkumarselvaraj/gobase/internal/config"
	"github.com/sureshkumarselvaraj/gobase/internal/db"
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

	log.Info().Str("port", cfg.Services.RealtimePort).Msg("Starting GoBase Realtime Service")

	// ─── Validate Config ─────────────────────────────
	if err := cfg.ValidateForProduction(); err != nil {
		log.Fatal().Err(err).Msg("Config validation failed")
	}

	// ─── Connect Database ─────────────────────────────
	database, err := db.Connect(cfg.DB)
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to connect to database")
	}

	// ─── Initialize Hub ───────────────────────────────
	wsHub := hub.NewHub()

	// ─── Initialize Notifier ──────────────────────────
	changeNotifier := notifier.NewNotifier(database, wsHub, cfg.Realtime.PollInterval)
	changeNotifier.Start()

	// ─── Initialize Handlers ──────────────────────────
	wsHandler := handlers.NewWSHandler(wsHub, cfg.JWT.Secret)

	// ─── Create Fiber App ─────────────────────────────
	app := fiber.New(fiber.Config{
		AppName:      "GoBase Realtime",
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
			"service": "realtime",
			"time":    time.Now().UTC(),
		})
	})

	// ─── Realtime Routes ──────────────────────────
	routes.Register(app, routes.Deps{
		Hub:       wsHub,
		WSHandler: wsHandler,
	})

	// ─── Graceful Shutdown ────────────────────────────
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		if err := app.Listen(":" + cfg.Services.RealtimePort); err != nil {
			log.Fatal().Err(err).Msg("Server failed")
		}
	}()

	<-quit
	log.Info().Msg("Shutting down realtime service...")
	changeNotifier.Stop()
	if err := app.Shutdown(); err != nil {
		log.Error().Err(err).Msg("Error during shutdown")
	}
	log.Info().Msg("Realtime service stopped")
}
