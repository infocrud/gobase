package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"

	"github.com/gofiber/contrib/websocket"
	"github.com/gofiber/fiber/v2"
	"github.com/rs/zerolog/log"
	"github.com/sureshkumarselvaraj/gobase/app/realtime/hub"
	"github.com/sureshkumarselvaraj/gobase/pkg/jwt"
	"github.com/sureshkumarselvaraj/gobase/pkg/response"
)

// WSHandler handles WebSocket connections.
type WSHandler struct {
	hub       *hub.Hub
	jwtSecret string
}

// NewWSHandler creates a new WSHandler.
func NewWSHandler(h *hub.Hub, jwtSecret string) *WSHandler {
	return &WSHandler{hub: h, jwtSecret: jwtSecret}
}

// Upgrade is the HTTP handler that checks for WebSocket upgrade eligibility.
// Must be used before the WebSocket handler.
func (h *WSHandler) Upgrade(c *fiber.Ctx) error {
	if websocket.IsWebSocketUpgrade(c) {
		// Authenticate via token query parameter
		token := c.Query("token")
		if token == "" {
			return response.Error(c, fiber.StatusUnauthorized, "Missing token query parameter")
		}

		claims, err := jwt.ValidateToken(token, h.jwtSecret)
		if err != nil {
			return response.Error(c, fiber.StatusUnauthorized, "Invalid or expired token")
		}

		// Store user info for the WebSocket handler
		c.Locals("user_id", claims.UserID)
		c.Locals("user_email", claims.Email)

		return c.Next()
	}
	return fiber.ErrUpgradeRequired
}

// Handle is the WebSocket handler that manages the connection lifecycle.
func (h *WSHandler) Handle() func(*websocket.Conn) {
	return func(conn *websocket.Conn) {
		userID, _ := conn.Locals("user_id").(uint)
		email, _ := conn.Locals("user_email").(string)

		clientID := generateClientID()

		client := hub.NewClient(clientID, userID, email, conn, h.hub)

		log.Info().
			Str("client_id", clientID).
			Uint("user_id", userID).
			Str("email", email).
			Msg("WebSocket client connected")

		h.hub.Register(client)

		// Start write pump in a goroutine
		go client.WritePump()

		// Read pump runs in the current goroutine (blocks until disconnect)
		client.ReadPump()

		log.Info().Str("client_id", clientID).Msg("WebSocket client disconnected")
	}
}

// Stats returns current hub statistics.
func (h *WSHandler) Stats(c *fiber.Ctx) error {
	return response.Success(c, fiber.Map{
		"clients":  h.hub.ClientCount(),
		"channels": h.hub.ChannelCount(),
	})
}

func generateClientID() string {
	bytes := make([]byte, 16)
	rand.Read(bytes)
	return fmt.Sprintf("ws_%s", hex.EncodeToString(bytes))
}
