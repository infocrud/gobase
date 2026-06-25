package routes

import (
	"github.com/gofiber/fiber/v2"
	"github.com/sureshkumarselvaraj/gobase/app/storage/handlers"
	"github.com/sureshkumarselvaraj/gobase/internal/middleware"
)

// Handlers holds all storage handler instances needed for route registration.
type Handlers struct {
	Object *handlers.ObjectHandler
	Sign   *handlers.SignHandler
	Bucket *handlers.BucketHandler
}

// Register sets up all storage routes on the given Fiber app.
func Register(app *fiber.App, h Handlers, jwtSecret string) {
	storage := app.Group("/storage/v1", middleware.JWTProtect(jwtSecret))

	// Object operations
	// NOTE: the exact "/object/:bucket" (list) route must be registered before the
	// "/object/:bucket/*" wildcard routes, otherwise a no-path GET matches the
	// wildcard Download handler with an empty path and 400s.
	storage.Get("/object/:bucket", h.Object.List)
	storage.Post("/object/:bucket/*", h.Object.Upload)
	storage.Get("/object/:bucket/*", h.Object.Download)
	storage.Delete("/object/:bucket/*", h.Object.Delete)

	// Signed URL generation
	storage.Post("/sign/:bucket/*", h.Sign.SignDownload)
	storage.Post("/sign/upload/:bucket/*", h.Sign.SignUpload)

	// Bucket management
	storage.Get("/bucket", h.Bucket.List)
	storage.Post("/bucket", h.Bucket.Create)
	storage.Delete("/bucket/:name", h.Bucket.Delete)
}
