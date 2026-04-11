package notifier

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/rs/zerolog/log"
	"github.com/sureshkumarselvaraj/gobase/app/realtime/hub"
	"github.com/sureshkumarselvaraj/gobase/internal/db"
	"gorm.io/gorm"
)

// Notifier polls the realtime_changes table and broadcasts changes to WebSocket clients.
type Notifier struct {
	database     *gorm.DB
	hub          *hub.Hub
	pollInterval time.Duration
	lastID       uint
	stopCh       chan struct{}
}

// NewNotifier creates a new Notifier.
func NewNotifier(database *gorm.DB, h *hub.Hub, pollInterval time.Duration) *Notifier {
	// Get the latest ID to start from
	var lastChange db.RealtimeChange
	database.Order("id DESC").First(&lastChange)

	return &Notifier{
		database:     database,
		hub:          h,
		pollInterval: pollInterval,
		lastID:       lastChange.ID,
		stopCh:       make(chan struct{}),
	}
}

// Start begins polling for changes in a background goroutine.
func (n *Notifier) Start() {
	log.Info().Dur("poll_interval", n.pollInterval).Msg("Realtime notifier started")

	go func() {
		ticker := time.NewTicker(n.pollInterval)
		defer ticker.Stop()

		for {
			select {
			case <-ticker.C:
				n.poll()
			case <-n.stopCh:
				log.Info().Msg("Realtime notifier stopped")
				return
			}
		}
	}()
}

// Stop halts the polling loop.
func (n *Notifier) Stop() {
	close(n.stopCh)
}

// poll checks for new changes since the last processed ID.
func (n *Notifier) poll() {
	var changes []db.RealtimeChange
	result := n.database.Where("id > ?", n.lastID).Order("id ASC").Limit(100).Find(&changes)
	if result.Error != nil {
		log.Error().Err(result.Error).Msg("Failed to poll realtime changes")
		return
	}

	if len(changes) == 0 {
		return
	}

	for _, change := range changes {
		n.broadcast(change)
		n.lastID = change.ID
	}

	log.Debug().Int("count", len(changes)).Uint("last_id", n.lastID).Msg("Processed realtime changes")
}

// broadcast sends a change event to all subscribers of the relevant channel.
func (n *Notifier) broadcast(change db.RealtimeChange) {
	// Channel format: realtime:public:<table>
	channel := fmt.Sprintf("realtime:public:%s", change.Table)

	// Parse payload JSON
	var record interface{}
	if change.Payload != "" {
		json.Unmarshal([]byte(change.Payload), &record)
	}

	msg := hub.ServerMessage{
		Type:      change.Operation,
		Channel:   channel,
		Table:     change.Table,
		Record:    record,
		Timestamp: change.CreatedAt.UTC().Format(time.RFC3339),
	}

	data, err := json.Marshal(msg)
	if err != nil {
		log.Error().Err(err).Msg("Failed to marshal change event")
		return
	}

	n.hub.Broadcast(channel, data)
}
