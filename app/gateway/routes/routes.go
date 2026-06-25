package routes

import (
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/proxy"
	"github.com/sureshkumarselvaraj/gobase/internal/config"
)

// Register sets up all gateway reverse proxy routes.
func Register(app *fiber.App, cfg config.ServicesConfig) {
	authURL := cfg.AuthURL
	restURL := cfg.RestURL
	realtimeURL := cfg.RealtimeURL
	storageURL := cfg.StorageURL
	functionsURL := cfg.FunctionsURL
	controlPlaneURL := cfg.ControlPlaneURL

	// Auth service
	app.All("/auth/*", func(c *fiber.Ctx) error {
		url := authURL + c.OriginalURL()
		if err := proxy.Do(c, url); err != nil {
			return err
		}
		c.Response().Header.Del(fiber.HeaderServer)
		return nil
	})

	// REST service
	app.All("/rest/*", func(c *fiber.Ctx) error {
		url := restURL + c.OriginalURL()
		if err := proxy.Do(c, url); err != nil {
			return err
		}
		c.Response().Header.Del(fiber.HeaderServer)
		return nil
	})

	// Realtime service
	app.All("/realtime/*", func(c *fiber.Ctx) error {
		url := realtimeURL + c.OriginalURL()
		if err := proxy.Do(c, url); err != nil {
			return err
		}
		c.Response().Header.Del(fiber.HeaderServer)
		return nil
	})

	// Storage service
	app.All("/storage/*", func(c *fiber.Ctx) error {
		url := storageURL + c.OriginalURL()
		if err := proxy.Do(c, url); err != nil {
			return err
		}
		c.Response().Header.Del(fiber.HeaderServer)
		return nil
	})

	// Functions service
	app.All("/functions/*", func(c *fiber.Ctx) error {
		url := functionsURL + c.OriginalURL()
		if err := proxy.Do(c, url); err != nil {
			return err
		}
		c.Response().Header.Del(fiber.HeaderServer)
		return nil
	})

	// Control plane service (organizations, projects, API keys)
	app.All("/controlplane/*", func(c *fiber.Ctx) error {
		url := controlPlaneURL + c.OriginalURL()
		if err := proxy.Do(c, url); err != nil {
			return err
		}
		c.Response().Header.Del(fiber.HeaderServer)
		return nil
	})
}
