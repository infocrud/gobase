package main

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"os"
	"os/exec"
	"os/signal"
	"syscall"
	"time"

	"gorm.io/gorm"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"

	"github.com/sureshkumarselvaraj/gobase/internal/config"
	"github.com/sureshkumarselvaraj/gobase/internal/db"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to load config")
	}

	zerolog.SetGlobalLevel(cfg.App.LogLevel)
	if cfg.App.Env == "development" {
		log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stdout, TimeFormat: time.RFC3339})
	}

	database, err := db.Connect(cfg.DB)
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to connect to database in orchestrator")
	}

	log.Info().Msg("Starting GoBase Orchestrator...")

	ticker := time.NewTicker(5 * time.Second)
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	for {
		select {
		case <-ticker.C:
			processProvisioningQueue(database)
		case <-quit:
			log.Info().Msg("Shutting down orchestrator...")
			ticker.Stop()
			return
		}
	}
}

func processProvisioningQueue(database *gorm.DB) {
	var projects []db.Project
	// Assume db.Connect returns *gorm.DB
	result := database.Where("status = ?", "provisioning").Find(&projects)

	if result.Error != nil {
		log.Error().Err(result.Error).Msg("Failed to fetch provisioning projects")
		return
	}

	for _, p := range projects {
		log.Info().Str("project_name", p.Name).Msg("Provisioning resources for project")

		containerName := fmt.Sprintf("gobase-tenant-%d", p.ID)

		pwBytes := make([]byte, 24)
		if _, err := rand.Read(pwBytes); err != nil {
			log.Error().Err(err).Str("project", p.Name).Msg("Failed to generate tenant password")
			database.Model(&p).Update("status", "failed")
			continue
		}
		tenantPassword := hex.EncodeToString(pwBytes)

		cmd := exec.Command("docker", "run", "-d", "--name", containerName,
			"-e", "POSTGRES_PASSWORD="+tenantPassword,
			"-e", "POSTGRES_DB=gobase",
			"postgres:15-alpine")
			
		err := cmd.Run()
		if err != nil {
			log.Error().Err(err).Str("project", p.Name).Msg("Failed to execute docker container creation")
			database.Model(&p).Update("status", "failed")
			continue
		}

		// 2. Mark project as active and save connection string
		// In a real scenario, we'd assign an available port or use a docker network internal IP
		fakeDSN := fmt.Sprintf("root:gobase_secure_123@tcp(%s:3306)/gobase?parseTime=true", containerName)
		
		database.Model(&p).Updates(map[string]interface{}{
			"status":       "active",
			"database_url": fakeDSN,
		})

		log.Info().Str("project_name", p.Name).Msg("Project provisioned successfully")
	}
}
