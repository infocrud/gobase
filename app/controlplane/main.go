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

	"github.com/sureshkumarselvaraj/gobase/app/controlplane/handlers"
	"github.com/sureshkumarselvaraj/gobase/app/controlplane/routes"
	"github.com/sureshkumarselvaraj/gobase/internal/config"
	"github.com/sureshkumarselvaraj/gobase/internal/db"
	apphandler "github.com/sureshkumarselvaraj/gobase/internal/handler"
	"github.com/sureshkumarselvaraj/gobase/internal/middleware"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to load config")
	}

	zerolog.SetGlobalLevel(cfg.App.LogLevel)
	if cfg.App.Env == "development" {
		log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stdout, TimeFormat: time.RFC3339})
	}

	database, err := db.Connect(cfg.DB)
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to connect to database in control_plane")
	}

	app := fiber.New(fiber.Config{AppName: "GoBase Control Plane", ErrorHandler: apphandler.ErrorHandler})
	app.Use(recover.New())
	app.Use(middleware.RequestID())
	app.Use(middleware.CORS(cfg.CORS))
	app.Use(middleware.Logger(log.Logger))

	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "healthy", "service": "controlplane"})
	})

	cpHandler := handlers.NewControlPlaneHandler(database)
	routes.Register(app, cpHandler, cfg.JWT.Secret)

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	port := "8008" // Default for control plane

	go func() {
		log.Info().Msg("Starting Control Plane on port " + port)
		if err := app.Listen(":" + port); err != nil {
			log.Fatal().Err(err).Msg("Control plane failed")
		}
	}()

	<-quit
	log.Info().Msg("Shutting down control plane...")
	_ = app.Shutdown()
}
