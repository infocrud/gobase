package runner

import (
	"bytes"
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"time"

	"github.com/rs/zerolog/log"
)

const (
	defaultTimeout  = 30 * time.Second
	functionsDir    = "data/functions"
)

// Runner executes user-defined functions via Deno subprocess.
type Runner struct {
	baseDir string
}

// NewRunner creates a new Runner, ensuring the functions directory exists.
func NewRunner() *Runner {
	dir := functionsDir
	if err := os.MkdirAll(dir, 0755); err != nil {
		log.Fatal().Err(err).Msg("Failed to create functions directory")
	}
	return &Runner{baseDir: dir}
}

// FunctionInfo holds metadata about a deployed function.
type FunctionInfo struct {
	Name      string    `json:"name"`
	Path      string    `json:"path"`
	Size      int64     `json:"size"`
	UpdatedAt time.Time `json:"updated_at"`
}

// Deploy saves a function script to the filesystem.
func (r *Runner) Deploy(name string, code []byte) (*FunctionInfo, error) {
	path := r.functionPath(name)

	if err := os.WriteFile(path, code, 0644); err != nil {
		return nil, fmt.Errorf("failed to write function: %w", err)
	}

	info, err := os.Stat(path)
	if err != nil {
		return nil, fmt.Errorf("failed to stat function: %w", err)
	}

	log.Info().Str("name", name).Int64("size", info.Size()).Msg("Function deployed")

	return &FunctionInfo{
		Name:      name,
		Path:      path,
		Size:      info.Size(),
		UpdatedAt: info.ModTime(),
	}, nil
}

// Invoke executes a function and returns the output.
func (r *Runner) Invoke(name string, payload string, timeout time.Duration) (string, string, error) {
	path := r.functionPath(name)

	// Check if function exists
	if _, err := os.Stat(path); os.IsNotExist(err) {
		return "", "", fmt.Errorf("function '%s' not found", name)
	}

	if timeout == 0 {
		timeout = defaultTimeout
	}

	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()

	// Check if Deno is available
	denoPath, err := exec.LookPath("deno")
	if err != nil {
		// Fallback: try Node.js for .js files
		nodePath, nodeErr := exec.LookPath("node")
		if nodeErr != nil {
			return "", "", fmt.Errorf("neither Deno nor Node.js found in PATH — install one to run functions")
		}
		return r.execWithRuntime(ctx, nodePath, path, payload)
	}

	return r.execWithRuntime(ctx, denoPath, path, payload, "--allow-net", "--allow-env", "--allow-read")
}

// execWithRuntime runs a script with the given runtime binary.
func (r *Runner) execWithRuntime(ctx context.Context, runtime, scriptPath, payload string, extraArgs ...string) (string, string, error) {
	args := []string{"run"}
	args = append(args, extraArgs...)
	args = append(args, scriptPath)

	cmd := exec.CommandContext(ctx, runtime, args...)

	// Pass payload via stdin
	if payload != "" {
		cmd.Stdin = bytes.NewBufferString(payload)
	}

	// Set environment variables
	cmd.Env = append(os.Environ(),
		fmt.Sprintf("GOBASE_PAYLOAD=%s", payload),
	)

	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	err := cmd.Run()
	if ctx.Err() == context.DeadlineExceeded {
		return "", "", fmt.Errorf("function timed out after %v", defaultTimeout)
	}
	if err != nil {
		return stdout.String(), stderr.String(), fmt.Errorf("function execution failed: %w", err)
	}

	return stdout.String(), stderr.String(), nil
}

// List returns all deployed functions.
func (r *Runner) List() ([]FunctionInfo, error) {
	entries, err := os.ReadDir(r.baseDir)
	if err != nil {
		return nil, fmt.Errorf("failed to read functions directory: %w", err)
	}

	var functions []FunctionInfo
	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}
		info, err := entry.Info()
		if err != nil {
			continue
		}
		functions = append(functions, FunctionInfo{
			Name:      entry.Name(),
			Path:      filepath.Join(r.baseDir, entry.Name()),
			Size:      info.Size(),
			UpdatedAt: info.ModTime(),
		})
	}

	return functions, nil
}

// Delete removes a function from the filesystem.
func (r *Runner) Delete(name string) error {
	path := r.functionPath(name)
	if _, err := os.Stat(path); os.IsNotExist(err) {
		return fmt.Errorf("function '%s' not found", name)
	}
	return os.Remove(path)
}

// Exists checks if a function is deployed.
func (r *Runner) Exists(name string) bool {
	_, err := os.Stat(r.functionPath(name))
	return err == nil
}

func (r *Runner) functionPath(name string) string {
	return filepath.Join(r.baseDir, name)
}
