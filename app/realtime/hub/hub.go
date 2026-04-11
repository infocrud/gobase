package hub

import (
	"sync"

	"github.com/rs/zerolog/log"
)

// Hub manages all WebSocket connections and channel subscriptions.
type Hub struct {
	mu sync.RWMutex

	// clients maps connection ID to Client
	clients map[string]*Client

	// channels maps channel name to set of connection IDs
	channels map[string]map[string]bool

	// Register/unregister channels
	register   chan *Client
	unregister chan *Client
}

// NewHub creates a new Hub and starts its run loop.
func NewHub() *Hub {
	h := &Hub{
		clients:    make(map[string]*Client),
		channels:   make(map[string]map[string]bool),
		register:   make(chan *Client, 256),
		unregister: make(chan *Client, 256),
	}
	go h.run()
	return h
}

// run processes register/unregister events.
func (h *Hub) run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client.ID] = client
			h.mu.Unlock()
			log.Debug().Str("client_id", client.ID).Uint("user_id", client.UserID).Msg("Client registered")

		case client := <-h.unregister:
			h.mu.Lock()
			// Remove from all channels
			for channel, members := range h.channels {
				delete(members, client.ID)
				if len(members) == 0 {
					delete(h.channels, channel)
				}
			}
			delete(h.clients, client.ID)
			close(client.Send)
			h.mu.Unlock()
			log.Debug().Str("client_id", client.ID).Msg("Client unregistered")
		}
	}
}

// Register adds a client to the hub.
func (h *Hub) Register(client *Client) {
	h.register <- client
}

// Unregister removes a client from the hub.
func (h *Hub) Unregister(client *Client) {
	h.unregister <- client
}

// Subscribe adds a client to a channel.
func (h *Hub) Subscribe(clientID, channel string) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if _, ok := h.channels[channel]; !ok {
		h.channels[channel] = make(map[string]bool)
	}
	h.channels[channel][clientID] = true

	log.Debug().Str("client_id", clientID).Str("channel", channel).Msg("Client subscribed")
}

// Unsubscribe removes a client from a channel.
func (h *Hub) Unsubscribe(clientID, channel string) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if members, ok := h.channels[channel]; ok {
		delete(members, clientID)
		if len(members) == 0 {
			delete(h.channels, channel)
		}
	}

	log.Debug().Str("client_id", clientID).Str("channel", channel).Msg("Client unsubscribed")
}

// Broadcast sends a message to all clients subscribed to a channel.
func (h *Hub) Broadcast(channel string, message []byte) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	members, ok := h.channels[channel]
	if !ok {
		return
	}

	for clientID := range members {
		client, exists := h.clients[clientID]
		if !exists {
			continue
		}

		select {
		case client.Send <- message:
		default:
			// Client send buffer full — skip
			log.Warn().Str("client_id", clientID).Str("channel", channel).Msg("Client send buffer full, dropping message")
		}
	}
}

// ClientCount returns the total number of connected clients.
func (h *Hub) ClientCount() int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return len(h.clients)
}

// ChannelCount returns the total number of active channels.
func (h *Hub) ChannelCount() int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return len(h.channels)
}
