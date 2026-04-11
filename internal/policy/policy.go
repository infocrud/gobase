package policy

import (
	"bytes"
	"fmt"
	"regexp"
	"strings"
	"sync"
	"text/template"

	"github.com/rs/zerolog/log"
	"github.com/sureshkumarselvaraj/gobase/internal/db"
	"gorm.io/gorm"
)

// Engine evaluates row-level security policies for table operations.
// Policies are cached in memory and loaded from the DB.
type Engine struct {
	mu       sync.RWMutex
	policies map[string][]db.Policy // key: "table:operation" or "table:ALL"
	database *gorm.DB
}

// TemplateData holds the values available in policy expressions.
type TemplateData struct {
	UserID uint
	Email  string
}

// NewEngine creates a new policy engine and loads policies from the database.
func NewEngine(database *gorm.DB) *Engine {
	e := &Engine{
		policies: make(map[string][]db.Policy),
		database: database,
	}
	e.Reload()
	return e
}

// Reload fetches all enabled policies from the DB and rebuilds the cache.
func (e *Engine) Reload() {
	var policies []db.Policy
	result := e.database.Where("enabled = ?", true).Find(&policies)
	if result.Error != nil {
		log.Error().Err(result.Error).Msg("Failed to load policies")
		return
	}

	e.mu.Lock()
	defer e.mu.Unlock()

	// Clear and rebuild cache
	e.policies = make(map[string][]db.Policy)
	for _, p := range policies {
		// Validate each policy expression at load time
		if err := validateExpression(p.Expression); err != nil {
			log.Error().
				Err(err).
				Str("policy", p.Name).
				Str("expression", p.Expression).
				Msg("Skipping policy with unsafe expression")
			continue
		}

		key := cacheKey(p.Table, p.Operation)
		e.policies[key] = append(e.policies[key], p)

		// Also index under specific operations if this is an ALL policy
		if strings.ToUpper(p.Operation) == "ALL" {
			for _, op := range []string{"SELECT", "INSERT", "UPDATE", "DELETE"} {
				specificKey := cacheKey(p.Table, op)
				e.policies[specificKey] = append(e.policies[specificKey], p)
			}
		}
	}

	log.Info().Int("count", len(policies)).Msg("Policies loaded")
}

// Evaluate checks policies for the given table and operation.
// Returns a SQL WHERE clause to append to the query.
// If no policy exists for the table+operation, returns empty string and allowed=false (deny by default).
func (e *Engine) Evaluate(userID uint, email string, table string, operation string) (whereClause string, allowed bool) {
	e.mu.RLock()
	defer e.mu.RUnlock()

	operation = strings.ToUpper(operation)
	key := cacheKey(table, operation)

	policies, exists := e.policies[key]
	if !exists || len(policies) == 0 {
		// No policy = deny by default
		return "", false
	}

	// Evaluate all matching policies — any match allows access (OR logic)
	data := TemplateData{
		UserID: userID,
		Email:  email,
	}

	var clauses []string
	for _, p := range policies {
		// Check role
		if p.Role == "authenticated" && userID == 0 {
			continue
		}

		clause, err := renderExpression(p.Expression, data)
		if err != nil {
			log.Error().Err(err).Str("policy", p.Name).Msg("Failed to render policy expression")
			continue
		}

		// Double-check rendered output is safe
		if err := validateRenderedSQL(clause); err != nil {
			log.Error().Err(err).Str("policy", p.Name).Str("rendered", clause).Msg("Rendered expression failed safety check")
			continue
		}

		if clause != "" {
			clauses = append(clauses, "("+clause+")")
		}
	}

	if len(clauses) == 0 {
		return "", false
	}

	// Combine with OR — if any policy allows, access is granted
	return strings.Join(clauses, " OR "), true
}

// HasPolicies returns true if any policies exist for the given table.
func (e *Engine) HasPolicies(table string) bool {
	e.mu.RLock()
	defer e.mu.RUnlock()

	for key := range e.policies {
		if strings.HasPrefix(key, table+":") {
			return true
		}
	}
	return false
}

// ─── Expression Safety ────────────────────────────────────

// dangerousKeywords are SQL keywords that should never appear in a policy WHERE expression.
var dangerousKeywords = regexp.MustCompile(`(?i)\b(DROP|ALTER|CREATE|INSERT|UPDATE|DELETE|TRUNCATE|EXEC|EXECUTE|GRANT|REVOKE|UNION|INTO|OUTFILE|DUMPFILE|LOAD_FILE|SLEEP|BENCHMARK|INFORMATION_SCHEMA)\b`)

// dangerousChars are characters/sequences that indicate injection attempts.
var dangerousChars = regexp.MustCompile(`[;\\]|--|\\/\\*|\\*\\/`)

// safeExpressionPattern matches valid WHERE clause patterns:
//   - column = value comparisons
//   - column = {{.UserID}} or {{.Email}} template variables
//   - 1=1 (allow-all)
//   - AND/OR combinators
//   - IN (...) clauses
//   - IS NULL / IS NOT NULL
var safeExpressionPattern = regexp.MustCompile(`^[\w\s=<>!.'"\(\),\{\}\.]+$`)

// validateExpression checks that a policy expression template is safe
// BEFORE it's stored in the cache. This catches obviously malicious expressions.
func validateExpression(expression string) error {
	if expression == "" {
		return fmt.Errorf("expression is empty")
	}

	// Check for dangerous SQL keywords
	if dangerousKeywords.MatchString(expression) {
		return fmt.Errorf("expression contains dangerous SQL keyword: %s", expression)
	}

	// Check for dangerous characters (semicolons, comment markers)
	if dangerousChars.MatchString(expression) {
		return fmt.Errorf("expression contains dangerous characters: %s", expression)
	}

	// Ensure only safe characters are present
	if !safeExpressionPattern.MatchString(expression) {
		return fmt.Errorf("expression contains disallowed characters: %s", expression)
	}

	// Ensure the template is valid
	_, err := template.New("validate").Parse(expression)
	if err != nil {
		return fmt.Errorf("invalid template syntax: %w", err)
	}

	return nil
}

// validateRenderedSQL checks the RENDERED output (after template substitution)
// to ensure no injection slipped through via template data.
func validateRenderedSQL(rendered string) error {
	if rendered == "" {
		return nil
	}

	if dangerousKeywords.MatchString(rendered) {
		return fmt.Errorf("rendered expression contains dangerous SQL keyword")
	}

	if dangerousChars.MatchString(rendered) {
		return fmt.Errorf("rendered expression contains dangerous characters")
	}

	return nil
}

// renderExpression evaluates a Go template expression with the given data.
func renderExpression(expression string, data TemplateData) (string, error) {
	tmpl, err := template.New("policy").Parse(expression)
	if err != nil {
		return "", fmt.Errorf("invalid policy expression: %w", err)
	}

	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, data); err != nil {
		return "", fmt.Errorf("failed to execute policy expression: %w", err)
	}

	return buf.String(), nil
}

func cacheKey(table, operation string) string {
	return table + ":" + strings.ToUpper(operation)
}
