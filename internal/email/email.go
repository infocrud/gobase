package email

import (
	"fmt"
	"net/smtp"

	"github.com/rs/zerolog/log"
	"github.com/sureshkumarselvaraj/gobase/internal/config"
)

// Sender defines the interface for sending emails.
type Sender interface {
	Send(to, subject, body string) error
}

// SMTPSender sends emails via SMTP.
type SMTPSender struct {
	host     string
	port     string
	user     string
	password string
	from     string
}

// ConsoleSender logs emails to the console (for development).
type ConsoleSender struct {
	from string
}

// NewSender creates an appropriate email sender based on configuration.
func NewSender(cfg config.SMTPConfig) Sender {
	if !cfg.Enabled || cfg.Host == "" {
		log.Info().Msg("SMTP disabled — using console email sender")
		return &ConsoleSender{from: cfg.From}
	}

	log.Info().Str("host", cfg.Host).Str("from", cfg.From).Msg("SMTP email sender initialized")
	return &SMTPSender{
		host:     cfg.Host,
		port:     cfg.Port,
		user:     cfg.User,
		password: cfg.Password,
		from:     cfg.From,
	}
}

// Send sends an email via SMTP.
func (s *SMTPSender) Send(to, subject, body string) error {
	msg := fmt.Sprintf("From: %s\r\nTo: %s\r\nSubject: %s\r\nMIME-Version: 1.0\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n%s",
		s.from, to, subject, body)

	auth := smtp.PlainAuth("", s.user, s.password, s.host)
	addr := s.host + ":" + s.port

	err := smtp.SendMail(addr, auth, s.from, []string{to}, []byte(msg))
	if err != nil {
		log.Error().Err(err).Str("to", to).Str("subject", subject).Msg("Failed to send email")
		return fmt.Errorf("failed to send email: %w", err)
	}

	log.Info().Str("to", to).Str("subject", subject).Msg("Email sent")
	return nil
}

// Send logs the email to the console (development mode).
func (s *ConsoleSender) Send(to, subject, body string) error {
	log.Info().
		Str("to", to).
		Str("subject", subject).
		Str("body", body).
		Msg("📧 [DEV EMAIL] — Check logs for link")

	fmt.Printf("\n╔══════════════════════════════════════════════════════════╗\n")
	fmt.Printf("║  📧  DEV EMAIL                                         ║\n")
	fmt.Printf("╠══════════════════════════════════════════════════════════╣\n")
	fmt.Printf("║  To:      %s\n", to)
	fmt.Printf("║  Subject: %s\n", subject)
	fmt.Printf("║  Body:    %s\n", body)
	fmt.Printf("╚══════════════════════════════════════════════════════════╝\n\n")
	return nil
}
