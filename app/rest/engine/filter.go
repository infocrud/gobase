package engine

import (
	"fmt"
	"strings"
)

// Filter represents a single parsed query filter.
type Filter struct {
	Column   string
	Operator string
	Value    string
}

// Supported operators mapping from Supabase-style to SQL.
var operatorMap = map[string]string{
	"eq":    "=",
	"neq":   "!=",
	"gt":    ">",
	"gte":   ">=",
	"lt":    "<",
	"lte":   "<=",
	"like":  "LIKE",
	"ilike": "LIKE", // MySQL is case-insensitive by default with utf8mb4
	"is":    "IS",
	"in":    "IN",
}

// Reserved query params that are NOT filters.
var reservedParams = map[string]bool{
	"select": true,
	"order":  true,
	"limit":  true,
	"offset": true,
}

// ParseFilters extracts Supabase-style filters from query parameters.
// Example: ?name=eq.John&age=gte.18 → [Filter{name, =, John}, Filter{age, >=, 18}]
func ParseFilters(queryParams map[string]string, schema *TableSchema) ([]Filter, error) {
	var filters []Filter

	for key, value := range queryParams {
		// Skip reserved parameters
		if reservedParams[key] {
			continue
		}

		// Validate column exists in schema
		if !columnExists(schema, key) {
			return nil, fmt.Errorf("unknown column: %s", key)
		}

		// Parse operator.value format
		parts := strings.SplitN(value, ".", 2)
		if len(parts) != 2 {
			return nil, fmt.Errorf("invalid filter format for '%s': expected 'operator.value', got '%s'", key, value)
		}

		op := parts[0]
		val := parts[1]

		sqlOp, ok := operatorMap[op]
		if !ok {
			return nil, fmt.Errorf("unsupported operator '%s' for column '%s'", op, key)
		}

		filters = append(filters, Filter{
			Column:   key,
			Operator: sqlOp,
			Value:    val,
		})
	}

	return filters, nil
}

// BuildWhereClause converts parsed filters into a parameterized WHERE clause.
// Returns the clause string and the parameter values.
func BuildWhereClause(filters []Filter) (string, []interface{}) {
	if len(filters) == 0 {
		return "", nil
	}

	var conditions []string
	var params []interface{}

	for _, f := range filters {
		switch f.Operator {
		case "IS":
			// IS NULL / IS NOT NULL
			if strings.ToUpper(f.Value) == "NULL" {
				conditions = append(conditions, fmt.Sprintf("`%s` IS NULL", f.Column))
			} else if strings.ToUpper(f.Value) == "TRUE" {
				conditions = append(conditions, fmt.Sprintf("`%s` IS TRUE", f.Column))
			} else if strings.ToUpper(f.Value) == "FALSE" {
				conditions = append(conditions, fmt.Sprintf("`%s` IS FALSE", f.Column))
			}
		case "IN":
			// Parse comma-separated values: in.(1,2,3)
			val := strings.TrimPrefix(f.Value, "(")
			val = strings.TrimSuffix(val, ")")
			items := strings.Split(val, ",")
			placeholders := make([]string, len(items))
			for i, item := range items {
				placeholders[i] = "?"
				params = append(params, strings.TrimSpace(item))
			}
			conditions = append(conditions, fmt.Sprintf("`%s` IN (%s)", f.Column, strings.Join(placeholders, ",")))
		default:
			conditions = append(conditions, fmt.Sprintf("`%s` %s ?", f.Column, f.Operator))
			params = append(params, f.Value)
		}
	}

	return strings.Join(conditions, " AND "), params
}

// ParseSelect parses the select query parameter.
// Example: ?select=id,name,email → ["id", "name", "email"]
func ParseSelect(selectParam string, schema *TableSchema) ([]string, error) {
	if selectParam == "" || selectParam == "*" {
		return []string{"*"}, nil
	}

	columns := strings.Split(selectParam, ",")
	for i, col := range columns {
		col = strings.TrimSpace(col)
		columns[i] = col
		if !columnExists(schema, col) {
			return nil, fmt.Errorf("unknown column in select: %s", col)
		}
	}

	return columns, nil
}

// ParseOrder parses the order query parameter.
// Example: ?order=created_at.desc → "created_at DESC"
func ParseOrder(orderParam string, schema *TableSchema) (string, error) {
	if orderParam == "" {
		return "", nil
	}

	parts := strings.SplitN(orderParam, ".", 2)
	column := parts[0]

	if !columnExists(schema, column) {
		return "", fmt.Errorf("unknown column in order: %s", column)
	}

	direction := "ASC"
	if len(parts) == 2 {
		switch strings.ToLower(parts[1]) {
		case "asc":
			direction = "ASC"
		case "desc":
			direction = "DESC"
		default:
			return "", fmt.Errorf("invalid order direction: %s (use 'asc' or 'desc')", parts[1])
		}
	}

	return fmt.Sprintf("`%s` %s", column, direction), nil
}

func columnExists(schema *TableSchema, column string) bool {
	for _, col := range schema.Columns {
		if col.Name == column {
			return true
		}
	}
	return false
}
