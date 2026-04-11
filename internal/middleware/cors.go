package middleware

import (
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/sureshkumarselvaraj/gobase/internal/config"
)

// CORS returns a configured CORS middleware using the application config.
func CORS(cfg config.CORSConfig) fiber.Handler {
	return cors.New(cors.Config{
		AllowOrigins:     cfg.AllowedOrigins,
		AllowMethods:     "GET,POST,PUT,PATCH,DELETE,OPTIONS",
		AllowHeaders:     "Origin,Content-Type,Accept,Authorization,X-Requested-With,apikey",
		ExposeHeaders:    "Content-Length,Content-Range",
		AllowCredentials: cfg.AllowedOrigins != "*", // Credentials only when origins are restricted
		MaxAge:           86400,
	})
}
