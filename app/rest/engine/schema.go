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

// Refresh re-introspects all tables from INFORMATION_SCHEMA.
func (sc *SchemaCache) Refresh() error {
	log.Info().Msg("Refreshing schema cache from INFORMATION_SCHEMA...")

	// Query all columns for all tables in the database
	type columnRow struct {
		TableName  string  `gorm:"column:TABLE_NAME"`
		ColumnName string  `gorm:"column:COLUMN_NAME"`
		DataType   string  `gorm:"column:DATA_TYPE"`
		IsNullable string  `gorm:"column:IS_NULLABLE"`
		ColumnKey  string  `gorm:"column:COLUMN_KEY"`
		Default    *string `gorm:"column:COLUMN_DEFAULT"`
	}

	var rows []columnRow
	result := sc.database.Raw(`
		SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY, COLUMN_DEFAULT
		FROM INFORMATION_SCHEMA.COLUMNS
		WHERE TABLE_SCHEMA = ?
		ORDER BY TABLE_NAME, ORDINAL_POSITION
	`, sc.dbName).Scan(&rows)

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
