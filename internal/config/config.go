package config

import (
	"strings"
	"time"

	"github.com/rs/zerolog"
	"github.com/spf13/viper"
)

// Config holds all configuration for the application.
type Config struct {
	App       AppConfig
	DB        DBConfig
	Redis     RedisConfig
	MinIO     MinIOConfig
	JWT       JWTConfig
	OAuth     OAuthConfig
	Services  ServicesConfig
	RateLimit RateLimitConfig
	Realtime  RealtimeConfig
	SMTP      SMTPConfig
	CORS      CORSConfig
}

// CORSConfig holds CORS configuration.
type CORSConfig struct {
	AllowedOrigins string
}

type SMTPConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	From     string
	Enabled  bool
}

type RealtimeConfig struct {
	PollInterval time.Duration
}

type RateLimitConfig struct {
	Max    int
	Window time.Duration
}

type AppConfig struct {
	Env      string
	LogLevel zerolog.Level
}

type DBConfig struct {
	Host            string
	Port            string
	User            string
	Password        string
	Name            string
	MaxOpenConns    int
	MaxIdleConns    int
	ConnMaxLifetime time.Duration
	LogVerbose      bool // When true, GORM logs all SQL queries (only in development)
}

// DSN returns the MySQL Data Source Name.
func (d DBConfig) DSN() string {
	return d.User + ":" + d.Password + "@tcp(" + d.Host + ":" + d.Port + ")/" + d.Name + "?charset=utf8mb4&parseTime=True&loc=Local"
}

type RedisConfig struct {
	Host     string
	Port     string
	Password string
	DB       int
}

// Addr returns the Redis address.
func (r RedisConfig) Addr() string {
	return r.Host + ":" + r.Port
}

type MinIOConfig struct {
	Endpoint        string
	AccessKey       string
	SecretKey       string
	UseSSL          bool
	Bucket          string
	SignedURLExpiry time.Duration
}

type JWTConfig struct {
	Secret        string
	AccessExpiry  time.Duration
	RefreshExpiry time.Duration
}

type OAuthConfig struct {
	Google OAuthProviderConfig
	GitHub OAuthProviderConfig
}

type OAuthProviderConfig struct {
	ClientID     string
	ClientSecret string
	RedirectURL  string
}

type ServicesConfig struct {
	GatewayPort   string
	AuthPort      string
	RestPort      string
	RealtimePort  string
	StoragePort   string
	FunctionsPort string
	// Service URLs for gateway proxying (allows Docker/K8s service discovery)
	AuthURL      string
	RestURL      string
	RealtimeURL  string
	StorageURL   string
	FunctionsURL string
}

// Load reads configuration from .env file and environment variables.
func Load() (*Config, error) {
	viper.SetConfigFile(".env")
	viper.SetConfigType("env")
	viper.AutomaticEnv()

	// Read .env file (ignore error if not found — env vars will be used)
	_ = viper.ReadInConfig()

	// Set defaults
	viper.SetDefault("APP_ENV", "development")
	viper.SetDefault("LOG_LEVEL", "debug")
	viper.SetDefault("DB_HOST", "localhost")
	viper.SetDefault("DB_PORT", "3306")
	viper.SetDefault("DB_USER", "gobase")
	viper.SetDefault("DB_PASSWORD", "gobase_secret")
	viper.SetDefault("DB_NAME", "gobase")
	viper.SetDefault("DB_MAX_OPEN_CONNS", 25)
	viper.SetDefault("DB_MAX_IDLE_CONNS", 10)
	viper.SetDefault("DB_CONN_MAX_LIFETIME", "5m")
	viper.SetDefault("REDIS_HOST", "localhost")
	viper.SetDefault("REDIS_PORT", "6379")
	viper.SetDefault("REDIS_PASSWORD", "")
	viper.SetDefault("REDIS_DB", 0)
	viper.SetDefault("MINIO_ENDPOINT", "localhost:9000")
	viper.SetDefault("MINIO_ACCESS_KEY", "minioadmin")
	viper.SetDefault("MINIO_SECRET_KEY", "minioadmin")
	viper.SetDefault("MINIO_USE_SSL", false)
	viper.SetDefault("MINIO_BUCKET", "gobase-storage")
	viper.SetDefault("JWT_SECRET", "change-me-to-a-random-64-char-string")
	viper.SetDefault("JWT_ACCESS_EXPIRY", "15m")
	viper.SetDefault("JWT_REFRESH_EXPIRY", "168h")
	viper.SetDefault("GATEWAY_PORT", "8000")
	viper.SetDefault("AUTH_PORT", "8001")
	viper.SetDefault("REST_PORT", "8002")
	viper.SetDefault("REALTIME_PORT", "8003")
	viper.SetDefault("STORAGE_PORT", "8004")
	viper.SetDefault("FUNCTIONS_PORT", "8005")
	// Gateway proxy target URLs — override for Docker/K8s
	viper.SetDefault("AUTH_URL", "")
	viper.SetDefault("REST_URL", "")
	viper.SetDefault("REALTIME_URL", "")
	viper.SetDefault("STORAGE_URL", "")
	viper.SetDefault("FUNCTIONS_URL", "")
	viper.SetDefault("RATE_LIMIT_MAX", 100)
	viper.SetDefault("RATE_LIMIT_WINDOW", "1m")
	viper.SetDefault("REALTIME_POLL_INTERVAL", "1s")
	viper.SetDefault("SIGNED_URL_EXPIRY", "1h")
	viper.SetDefault("SMTP_HOST", "smtp.gmail.com")
	viper.SetDefault("SMTP_PORT", "587")
	viper.SetDefault("SMTP_USER", "")
	viper.SetDefault("SMTP_PASSWORD", "")
	viper.SetDefault("SMTP_FROM", "noreply@gobase.dev")
	viper.SetDefault("SMTP_ENABLED", false)
	viper.SetDefault("CORS_ALLOWED_ORIGINS", "*")

	connMaxLifetime, _ := time.ParseDuration(viper.GetString("DB_CONN_MAX_LIFETIME"))
	accessExpiry, _ := time.ParseDuration(viper.GetString("JWT_ACCESS_EXPIRY"))
	refreshExpiry, _ := time.ParseDuration(viper.GetString("JWT_REFRESH_EXPIRY"))
	rateLimitWindow, _ := time.ParseDuration(viper.GetString("RATE_LIMIT_WINDOW"))
	realtimePollInterval, _ := time.ParseDuration(viper.GetString("REALTIME_POLL_INTERVAL"))
	signedURLExpiry, _ := time.ParseDuration(viper.GetString("SIGNED_URL_EXPIRY"))

	logLevel := parseLogLevel(viper.GetString("LOG_LEVEL"))

	cfg := &Config{
		App: AppConfig{
			Env:      viper.GetString("APP_ENV"),
			LogLevel: logLevel,
		},
		DB: DBConfig{
			Host:            viper.GetString("DB_HOST"),
			Port:            viper.GetString("DB_PORT"),
			User:            viper.GetString("DB_USER"),
			Password:        viper.GetString("DB_PASSWORD"),
			Name:            viper.GetString("DB_NAME"),
			MaxOpenConns:    viper.GetInt("DB_MAX_OPEN_CONNS"),
			MaxIdleConns:    viper.GetInt("DB_MAX_IDLE_CONNS"),
			ConnMaxLifetime: connMaxLifetime,
			LogVerbose:      strings.EqualFold(viper.GetString("APP_ENV"), "development"),
		},
		Redis: RedisConfig{
			Host:     viper.GetString("REDIS_HOST"),
			Port:     viper.GetString("REDIS_PORT"),
			Password: viper.GetString("REDIS_PASSWORD"),
			DB:       viper.GetInt("REDIS_DB"),
		},
		MinIO: MinIOConfig{
			Endpoint:        viper.GetString("MINIO_ENDPOINT"),
			AccessKey:       viper.GetString("MINIO_ACCESS_KEY"),
			SecretKey:       viper.GetString("MINIO_SECRET_KEY"),
			UseSSL:          viper.GetBool("MINIO_USE_SSL"),
			Bucket:          viper.GetString("MINIO_BUCKET"),
			SignedURLExpiry: signedURLExpiry,
		},
		JWT: JWTConfig{
			Secret:        viper.GetString("JWT_SECRET"),
			AccessExpiry:  accessExpiry,
			RefreshExpiry: refreshExpiry,
		},
		OAuth: OAuthConfig{
			Google: OAuthProviderConfig{
				ClientID:     viper.GetString("GOOGLE_CLIENT_ID"),
				ClientSecret: viper.GetString("GOOGLE_CLIENT_SECRET"),
				RedirectURL:  viper.GetString("GOOGLE_REDIRECT_URL"),
			},
			GitHub: OAuthProviderConfig{
				ClientID:     viper.GetString("GITHUB_CLIENT_ID"),
				ClientSecret: viper.GetString("GITHUB_CLIENT_SECRET"),
				RedirectURL:  viper.GetString("GITHUB_REDIRECT_URL"),
			},
		},
		Services: ServicesConfig{
			GatewayPort:   viper.GetString("GATEWAY_PORT"),
			AuthPort:      viper.GetString("AUTH_PORT"),
			RestPort:      viper.GetString("REST_PORT"),
			RealtimePort:  viper.GetString("REALTIME_PORT"),
			StoragePort:   viper.GetString("STORAGE_PORT"),
			FunctionsPort: viper.GetString("FUNCTIONS_PORT"),
			AuthURL:       serviceURL(viper.GetString("AUTH_URL"), viper.GetString("AUTH_PORT")),
			RestURL:       serviceURL(viper.GetString("REST_URL"), viper.GetString("REST_PORT")),
			RealtimeURL:   serviceURL(viper.GetString("REALTIME_URL"), viper.GetString("REALTIME_PORT")),
			StorageURL:    serviceURL(viper.GetString("STORAGE_URL"), viper.GetString("STORAGE_PORT")),
			FunctionsURL:  serviceURL(viper.GetString("FUNCTIONS_URL"), viper.GetString("FUNCTIONS_PORT")),
		},
		RateLimit: RateLimitConfig{
			Max:    viper.GetInt("RATE_LIMIT_MAX"),
			Window: rateLimitWindow,
		},
		Realtime: RealtimeConfig{
			PollInterval: realtimePollInterval,
		},
		SMTP: SMTPConfig{
			Host:     viper.GetString("SMTP_HOST"),
			Port:     viper.GetString("SMTP_PORT"),
			User:     viper.GetString("SMTP_USER"),
			Password: viper.GetString("SMTP_PASSWORD"),
			From:     viper.GetString("SMTP_FROM"),
			Enabled:  viper.GetBool("SMTP_ENABLED"),
		},
		CORS: CORSConfig{
			AllowedOrigins: viper.GetString("CORS_ALLOWED_ORIGINS"),
		},
	}

	return cfg, nil
}

func parseLogLevel(level string) zerolog.Level {
	switch strings.ToLower(level) {
	case "trace":
		return zerolog.TraceLevel
	case "debug":
		return zerolog.DebugLevel
	case "info":
		return zerolog.InfoLevel
	case "warn":
		return zerolog.WarnLevel
	case "error":
		return zerolog.ErrorLevel
	case "fatal":
		return zerolog.FatalLevel
	default:
		return zerolog.InfoLevel
	}
}

// serviceURL returns the explicit URL if set, otherwise builds http://localhost:{port}.
func serviceURL(explicit, port string) string {
	if explicit != "" {
		return explicit
	}
	return "http://localhost:" + port
}
