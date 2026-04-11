package db

import (
	"time"
)

// User represents an authenticated user in the system.
type User struct {
	BaseModel
	Email              string     `gorm:"type:varchar(255);uniqueIndex;not null" json:"email"`
	PasswordHash       string     `gorm:"type:varchar(255)" json:"-"`
	Provider           string     `gorm:"type:varchar(50);default:'email'" json:"provider"`
	ProviderID         string     `gorm:"type:varchar(255);index" json:"provider_id,omitempty"`
	EmailVerified      bool       `gorm:"default:false" json:"email_verified"`
	Role               string     `gorm:"type:varchar(20);default:'user'" json:"role"`
	Metadata           *string    `gorm:"type:json" json:"metadata,omitempty"`
	VerificationToken  string     `gorm:"type:varchar(255);index" json:"-"`
	VerificationExpiry *time.Time `json:"-"`
	ResetToken         string     `gorm:"type:varchar(255);index" json:"-"`
	ResetTokenExpiry   *time.Time `json:"-"`

	RefreshTokens []RefreshToken `gorm:"foreignKey:UserID" json:"-"`
}

// TableName overrides the default table name.
func (User) TableName() string {
	return "users"
}

// RefreshToken stores hashed refresh tokens for token rotation.
type RefreshToken struct {
	BaseModel
	UserID    uint      `gorm:"index;not null" json:"user_id"`
	TokenHash string    `gorm:"type:varchar(255);uniqueIndex;not null" json:"-"`
	ExpiresAt time.Time `gorm:"not null" json:"expires_at"`
	Revoked   bool      `gorm:"default:false" json:"revoked"`

	User User `gorm:"foreignKey:UserID" json:"-"`
}

// TableName overrides the default table name.
func (RefreshToken) TableName() string {
	return "refresh_tokens"
}

// Organization represents a billing entity that groups multiple projects.
type Organization struct {
	BaseModel
	Name             string `gorm:"type:varchar(255);not null" json:"name"`
	OwnerID          uint   `gorm:"index;not null" json:"owner_id"`
	StripeCustomerID string `gorm:"type:varchar(255)" json:"stripe_customer_id,omitempty"`
	BillingPlan      string `gorm:"type:varchar(50);default:'free'" json:"billing_plan"`

	Owner    User      `gorm:"foreignKey:OwnerID" json:"-"`
	Projects []Project `gorm:"foreignKey:OrganizationID" json:"projects,omitempty"`
}

func (Organization) TableName() string {
	return "organizations"
}

// Project represents a single GoBase instance managed by the control plane.
type Project struct {
	BaseModel
	Name           string `gorm:"type:varchar(255);not null" json:"name"`
	OrganizationID uint   `gorm:"index;not null" json:"organization_id"`
	Region         string `gorm:"type:varchar(50);default:'us-east-1'" json:"region"`
	DatabaseURL    string `gorm:"type:varchar(255)" json:"-"`
	Status         string `gorm:"type:varchar(50);default:'provisioning'" json:"status"` // provisioning, active, paused
	
	Organization Organization `gorm:"foreignKey:OrganizationID" json:"-"`
}

func (Project) TableName() string {
	return "projects"
}
