package routes

import (
	"github.com/gofiber/fiber/v2"
	"github.com/sureshkumarselvaraj/gobase/app/functions/handlers"
	"github.com/sureshkumarselvaraj/gobase/internal/middleware"
)

// Register sets up all functions routes on the given Fiber app.
func Register(app *fiber.App, funcHandler *handlers.FunctionHandler, jwtSecret string) {
	fn := app.Group("/functions/v1", middleware.JWTProtect(jwtSecret))

	fn.Post("/deploy", funcHandler.Deploy)
	fn.Get("/", funcHandler.List)
	fn.Post("/:name", funcHandler.Invoke)
	fn.Delete("/:name", funcHandler.Delete)
}
