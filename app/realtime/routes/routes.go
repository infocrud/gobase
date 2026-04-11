package routes

import (
	"github.com/gofiber/contrib/websocket"
	"github.com/gofiber/fiber/v2"
	"github.com/sureshkumarselvaraj/gobase/app/realtime/handlers"
	"github.com/sureshkumarselvaraj/gobase/app/realtime/hub"
	"github.com/sureshkumarselvaraj/gobase/pkg/response"
)

// Deps holds the dependencies needed for realtime route registration.
type Deps struct {
	Hub       *hub.Hub
	WSHandler *handlers.WSHandler
}

// Register sets up all realtime routes on the given Fiber app.
func Register(app *fiber.App, d Deps) {
	rt := app.Group("/realtime")

	// Stats endpoint
	rt.Get("/stats", func(c *fiber.Ctx) error {
		return response.Success(c, fiber.Map{
			"clients":  d.Hub.ClientCount(),
			"channels": d.Hub.ChannelCount(),
		})
	})

	// WebSocket endpoint: authenticate via ?token= query param, then upgrade
	rt.Use("/ws", d.WSHandler.Upgrade)
	rt.Get("/ws", websocket.New(d.WSHandler.Handle()))
}
