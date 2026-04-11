package hub

import (
	"encoding/json"
	"time"

	"github.com/gofiber/contrib/websocket"
	"github.com/rs/zerolog/log"
)

const (
	// Time allowed to write a message to the peer.
	writeWait = 10 * time.Second

	// Time allowed to read the next pong message from the peer.
	pongWait = 60 * time.Second

	// Send pings to peer with this period. Must be less than pongWait.
	pingPeriod = (pongWait * 9) / 10

	// Maximum message size allowed from peer.
	maxMessageSize = 4096

	// Send buffer size per client.
	sendBufferSize = 256
)

// Client represents a single WebSocket connection.
type Client struct {
	ID     string
	UserID uint
	Email  string
	Conn   *websocket.Conn
	Hub    *Hub
	Send   chan []byte
}

// NewClient creates a new Client.
func NewClient(id string, userID uint, email string, conn *websocket.Conn, hub *Hub) *Client {
	return &Client{
		ID:     id,
		UserID: userID,
		Email:  email,
		Conn:   conn,
		Hub:    hub,
		Send:   make(chan []byte, sendBufferSize),
	}
}

// ClientMessage represents a message sent from the client.
type ClientMessage struct {
	Type    string `json:"type"`    // "subscribe", "unsubscribe"
	Channel string `json:"channel"` // e.g. "realtime:public:todos"
}

// ServerMessage represents a message sent to the client.
type ServerMessage struct {
	Type      string      `json:"type"`      // "INSERT", "UPDATE", "DELETE", "subscribed", "unsubscribed", "error"
	Channel   string      `json:"channel"`   // channel name
	Table     string      `json:"table,omitempty"`
	Record    interface{} `json:"record,omitempty"`
	Timestamp string      `json:"timestamp"`
}

// ReadPump reads messages from the WebSocket connection.
// It handles subscribe/unsubscribe commands from the client.
func (c *Client) ReadPump() {
	defer func() {
		c.Hub.Unregister(c)
		c.Conn.Close()
	}()

	c.Conn.SetReadLimit(maxMessageSize)
	c.Conn.SetReadDeadline(time.Now().Add(pongWait))
	c.Conn.SetPongHandler(func(string) error {
		c.Conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		_, message, err := c.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseNormalClosure) {
				log.Error().Err(err).Str("client_id", c.ID).Msg("WebSocket read error")
			}
			break
		}

		var msg ClientMessage
		if err := json.Unmarshal(message, &msg); err != nil {
			c.sendError("Invalid message format")
			continue
		}

		switch msg.Type {
		case "subscribe":
			if msg.Channel == "" {
				c.sendError("Channel is required")
				continue
			}
			c.Hub.Subscribe(c.ID, msg.Channel)
			c.sendAck("subscribed", msg.Channel)

		case "unsubscribe":
			if msg.Channel == "" {
				c.sendError("Channel is required")
				continue
			}
			c.Hub.Unsubscribe(c.ID, msg.Channel)
			c.sendAck("unsubscribed", msg.Channel)

		default:
			c.sendError("Unknown message type: " + msg.Type)
		}
	}
}

// WritePump sends messages from the Send channel to the WebSocket connection.
func (c *Client) WritePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.Send:
			c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				// Hub closed the channel
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			if err := c.Conn.WriteMessage(websocket.TextMessage, message); err != nil {
				log.Error().Err(err).Str("client_id", c.ID).Msg("WebSocket write error")
				return
			}

		case <-ticker.C:
			c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func (c *Client) sendAck(msgType, channel string) {
	msg := ServerMessage{
		Type:      msgType,
		Channel:   channel,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	}
	data, _ := json.Marshal(msg)
	select {
	case c.Send <- data:
	default:
	}
}

func (c *Client) sendError(message string) {
	msg := ServerMessage{
		Type:      "error",
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	}
	// Use Record field to carry error message
	msg.Record = map[string]string{"message": message}
	data, _ := json.Marshal(msg)
	select {
	case c.Send <- data:
	default:
	}
}
