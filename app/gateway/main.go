package main

import (
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/redis/go-redis/v9"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"

	"github.com/sureshkumarselvaraj/gobase/app/gateway/routes"
	"github.com/sureshkumarselvaraj/gobase/internal/config"
	apphandler "github.com/sureshkumarselvaraj/gobase/internal/handler"
	"github.com/sureshkumarselvaraj/gobase/internal/health"
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

	log.Info().Str("port", cfg.Services.GatewayPort).Msg("Starting GoBase Gateway")

	// ─── Validate Config ─────────────────────────────
	if err := cfg.ValidateForProduction(); err != nil {
		log.Fatal().Err(err).Msg("Config validation failed")
	}

	// ─── Connect Redis ────────────────────────────────
	rdb := redis.NewClient(&redis.Options{
		Addr:     cfg.Redis.Addr(),
		Password: cfg.Redis.Password,
		DB:       cfg.Redis.DB,
	})

	// ─── Create Fiber App ─────────────────────────────
	app := fiber.New(fiber.Config{
		AppName:      "GoBase Gateway",
		ErrorHandler: apphandler.ErrorHandler,
	})

	app.Use(recover.New())
	app.Use(middleware.RequestID())
	app.Use(middleware.Metrics())
	app.Use(middleware.CORS(cfg.CORS))
	app.Use(middleware.Logger(log.Logger))

	// ─── Rate Limiting ────────────────────────────────
	app.Use(middleware.RateLimit(rdb, cfg.RateLimit))

	// ─── Health & Metrics Endpoints ───────────────
	healthChecker := &health.Checker{ServiceName: "gateway", Redis: rdb}
	app.Get("/health/live", healthChecker.LivenessHandler())
	app.Get("/health/ready", healthChecker.ReadinessHandler())
	app.Get("/health", healthChecker.LivenessHandler()) // backward compat
	app.Get("/metrics", middleware.MetricsHandler())

	// ─── Reverse Proxy Routes ─────────────────────
	routes.Register(app, cfg.Services)

	// ─── Graceful Shutdown ────────────────────────────
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		if err := app.Listen(":" + cfg.Services.GatewayPort); err != nil {
			log.Fatal().Err(err).Msg("Server failed")
		}
	}()

	<-quit
	log.Info().Msg("Shutting down gateway...")
	rdb.Close()
	if err := app.Shutdown(); err != nil {
		log.Error().Err(err).Msg("Error during shutdown")
	}
	log.Info().Msg("Gateway stopped")
}
