package engine

import (
	"fmt"
	"strings"
	"sync"

	"github.com/rs/zerolog/log"
	"gorm.io/gorm"
)

// ColumnInfo holds metadata about a single table column.
type ColumnInfo struct {
	Name       string `json:"name"`
	DataType   string `json:"data_type"`
	IsNullable bool   `json:"is_nullable"`
	IsPrimary  bool   `json:"is_primary"`
	Default    string `json:"default,omitempty"`
}

// TableSchema holds the schema for a single table.
type TableSchema struct {
	Name       string       `json:"name"`
	Columns    []ColumnInfo `json:"columns"`
	PrimaryKey string       `json:"primary_key"`
}

// SchemaCache caches table schemas introspected from MySQL INFORMATION_SCHEMA.
type SchemaCache struct {
	mu       sync.RWMutex
	tables   map[string]*TableSchema
	database *gorm.DB
	dbName   string

	// Internal tables excluded from the REST API
	excluded map[string]bool
}

// NewSchemaCache creates a new SchemaCache and performs initial introspection.
func NewSchemaCache(database *gorm.DB, dbName string) *SchemaCache {
	sc := &SchemaCache{
		tables:   make(map[string]*TableSchema),
		database: database,
		dbName:   dbName,
		excluded: map[string]bool{
			"users":          true,
			"refresh_tokens": true,
			"policies":       true,
		},
	}
	sc.Refresh()
	return sc
}

// Refresh re-introspects all tables from information_schema.
func (sc *SchemaCache) Refresh() error {
	log.Info().Msg("Refreshing schema cache from information_schema...")

	// Query all columns for all tables in the public schema.
	// PostgreSQL's information_schema has no MySQL-style COLUMN_KEY, so primary
	// keys are derived by joining table_constraints/key_column_usage.
	type columnRow struct {
		TableName  string  `gorm:"column:table_name"`
		ColumnName string  `gorm:"column:column_name"`
		DataType   string  `gorm:"column:data_type"`
		IsNullable string  `gorm:"column:is_nullable"`
		ColumnKey  string  `gorm:"column:column_key"`
		Default    *string `gorm:"column:column_default"`
	}

	var rows []columnRow
	result := sc.database.Raw(`
		SELECT
			c.table_name    AS table_name,
			c.column_name   AS column_name,
			c.data_type     AS data_type,
			c.is_nullable   AS is_nullable,
			c.column_default AS column_default,
			CASE WHEN pk.column_name IS NOT NULL THEN 'PRI' ELSE '' END AS column_key
		FROM information_schema.columns c
		LEFT JOIN (
			SELECT kcu.table_name, kcu.column_name
			FROM information_schema.table_constraints tc
			JOIN information_schema.key_column_usage kcu
				ON tc.constraint_name = kcu.constraint_name
				AND tc.table_schema = kcu.table_schema
			WHERE tc.constraint_type = 'PRIMARY KEY'
				AND tc.table_schema = 'public'
		) pk ON pk.table_name = c.table_name AND pk.column_name = c.column_name
		WHERE c.table_schema = 'public'
		ORDER BY c.table_name, c.ordinal_position
	`).Scan(&rows)

	if result.Error != nil {
		return fmt.Errorf("schema introspection failed: %w", result.Error)
	}

	// Build table schemas
	tables := make(map[string]*TableSchema)
	for _, row := range rows {
		// Skip excluded internal tables
		if sc.excluded[row.TableName] {
			continue
		}

		schema, exists := tables[row.TableName]
		if !exists {
			schema = &TableSchema{
				Name:    row.TableName,
				Columns: []ColumnInfo{},
			}
			tables[row.TableName] = schema
		}

		col := ColumnInfo{
			Name:       row.ColumnName,
			DataType:   row.DataType,
			IsNullable: row.IsNullable == "YES",
			IsPrimary:  row.ColumnKey == "PRI",
		}
		if row.Default != nil {
			col.Default = *row.Default
		}

		if col.IsPrimary && schema.PrimaryKey == "" {
			schema.PrimaryKey = col.Name
		}

		schema.Columns = append(schema.Columns, col)
	}

	sc.mu.Lock()
	sc.tables = tables
	sc.mu.Unlock()

	tableNames := make([]string, 0, len(tables))
	for name := range tables {
		tableNames = append(tableNames, name)
	}
	log.Info().Strs("tables", tableNames).Msg("Schema cache refreshed")

	return nil
}

// GetTable returns the schema for a table, or nil if not found.
func (sc *SchemaCache) GetTable(name string) *TableSchema {
	sc.mu.RLock()
	defer sc.mu.RUnlock()
	return sc.tables[name]
}

// ListTables returns all cached table schemas.
func (sc *SchemaCache) ListTables() []*TableSchema {
	sc.mu.RLock()
	defer sc.mu.RUnlock()

	result := make([]*TableSchema, 0, len(sc.tables))
	for _, t := range sc.tables {
		result = append(result, t)
	}
	return result
}

// ValidateColumn checks if a column exists in the given table.
func (sc *SchemaCache) ValidateColumn(table, column string) bool {
	schema := sc.GetTable(table)
	if schema == nil {
		return false
	}
	for _, col := range schema.Columns {
		if col.Name == column {
			return true
		}
	}
	return false
}

// ValidateColumns checks if all columns exist in the given table.
func (sc *SchemaCache) ValidateColumns(table string, columns []string) (invalid []string) {
	for _, col := range columns {
		if !sc.ValidateColumn(table, strings.TrimSpace(col)) {
			invalid = append(invalid, col)
		}
	}
	return
}
