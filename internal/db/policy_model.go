package db

// Policy defines a row-level security policy for a table.
type Policy struct {
	BaseModel
	Name       string `gorm:"type:varchar(255);not null" json:"name"`
	Table      string `gorm:"type:varchar(255);index;not null" json:"table"`
	Operation  string `gorm:"type:varchar(20);not null;default:'ALL'" json:"operation"` // SELECT, INSERT, UPDATE, DELETE, ALL
	Expression string `gorm:"type:text;not null" json:"expression"`                     // e.g. "user_id = {{.UserID}}"
	Role       string `gorm:"type:varchar(50);not null;default:'authenticated'" json:"role"` // authenticated, anon
	Enabled    bool   `gorm:"default:true" json:"enabled"`
}

// TableName overrides the default table name.
func (Policy) TableName() string {
	return "policies"
}
