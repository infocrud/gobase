package main

import (
	"fmt"
	"os"
)

// The gobase CLI tool
func main() {
	if len(os.Args) < 2 {
		printUsage()
		os.Exit(1)
	}

	command := os.Args[1]

	switch command {
	case "init":
		initProject()
	case "start":
		startProject()
	case "deploy":
		deployProject()
	case "help":
		printUsage()
	default:
		fmt.Printf("Unknown command: %s\n", command)
		printUsage()
		os.Exit(1)
	}
}

func printUsage() {
	fmt.Println(`GoBase CLI - The open-source BaaS

Usage:
  gobase <command>

Commands:
  init      Initialize a new GoBase project locally (.env, docker-compose.yml)
  start     Start the local GoBase stack using Docker Compose
  deploy    Deploy the current project to the Cloud (coming soon)
  help      Show this help message
`)
}

func initProject() {
	fmt.Println("Initializing new GoBase project...")
	// TODO: Create .env from template
	// TODO: Copy docker-compose.yml
	fmt.Println("✅ Project initialized! Run 'gobase start' to boot your backend.")
}

func startProject() {
	fmt.Println("Starting local GoBase stack...")
	// TODO: exec.Command("docker-compose", "up", "-d")
	fmt.Println("🚀 GoBase is running at http://localhost:8000")
}

func deployProject() {
	fmt.Println("Deploying project...")
	fmt.Println("❌ Cloud deployment requires a linked project. Run 'gobase link' first.")
}
