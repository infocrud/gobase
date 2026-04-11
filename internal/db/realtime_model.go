package db

import "time"

// RealtimeChange tracks row-level changes for the realtime notification system.
type RealtimeChange struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Table     string    `gorm:"type:varchar(255);index;not null" json:"table"`
	Operation string    `gorm:"type:varchar(20);not null" json:"operation"` // INSERT, UPDATE, DELETE
	RecordID  string    `gorm:"type:varchar(255);not null" json:"record_id"`
	Payload   string    `gorm:"type:json" json:"payload"`
	CreatedAt time.Time `gorm:"index" json:"created_at"`
}

// TableName overrides the default table name.
func (RealtimeChange) TableName() string {
	return "realtime_changes"
}
