package engine

import (
	"testing"
)

// Helper to create a test schema.
func testSchema() *TableSchema {
	return &TableSchema{
		Name: "todos",
		Columns: []ColumnInfo{
			{Name: "id", DataType: "bigint", IsPrimary: true},
			{Name: "title", DataType: "varchar"},
			{Name: "done", DataType: "tinyint"},
			{Name: "user_id", DataType: "bigint"},
			{Name: "created_at", DataType: "datetime"},
		},
		PrimaryKey: "id",
	}
}

func TestParseFiltersEq(t *testing.T) {
	schema := testSchema()
	filters, err := ParseFilters(map[string]string{"title": "eq.hello"}, schema)
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}
	if len(filters) != 1 {
		t.Fatalf("Expected 1 filter, got %d", len(filters))
	}
	if filters[0].Column != "title" || filters[0].Operator != "=" || filters[0].Value != "hello" {
		t.Errorf("Unexpected filter: %+v", filters[0])
	}
}

func TestParseFiltersMultiple(t *testing.T) {
	schema := testSchema()
	filters, err := ParseFilters(map[string]string{
		"done":    "eq.1",
		"user_id": "gt.5",
	}, schema)
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}
	if len(filters) != 2 {
		t.Fatalf("Expected 2 filters, got %d", len(filters))
	}
}

func TestParseFiltersUnknownColumn(t *testing.T) {
	schema := testSchema()
	_, err := ParseFilters(map[string]string{"nonexistent": "eq.val"}, schema)
	if err == nil {
		t.Fatal("Expected error for unknown column")
	}
}

func TestParseFiltersInvalidFormat(t *testing.T) {
	schema := testSchema()
	_, err := ParseFilters(map[string]string{"title": "nope"}, schema)
	if err == nil {
		t.Fatal("Expected error for invalid filter format (no dot)")
	}
}

func TestParseFiltersUnsupportedOperator(t *testing.T) {
	schema := testSchema()
	_, err := ParseFilters(map[string]string{"title": "foo.bar"}, schema)
	if err == nil {
		t.Fatal("Expected error for unsupported operator")
	}
}

func TestParseFiltersReservedParams(t *testing.T) {
	schema := testSchema()
	// Reserved params should be skipped silently
	filters, err := ParseFilters(map[string]string{
		"select": "id,title",
		"order":  "id.asc",
		"limit":  "10",
		"offset": "0",
	}, schema)
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}
	if len(filters) != 0 {
		t.Errorf("Expected 0 filters (all reserved), got %d", len(filters))
	}
}

func TestBuildWhereClauseSimple(t *testing.T) {
	filters := []Filter{
		{Column: "title", Operator: "=", Value: "hello"},
	}
	clause, params := BuildWhereClause(filters)
	if clause != "`title` = ?" {
		t.Errorf("Expected '`title` = ?', got '%s'", clause)
	}
	if len(params) != 1 || params[0] != "hello" {
		t.Errorf("Unexpected params: %v", params)
	}
}

func TestBuildWhereClauseIN(t *testing.T) {
	filters := []Filter{
		{Column: "id", Operator: "IN", Value: "(1,2,3)"},
	}
	clause, params := BuildWhereClause(filters)
	if clause != "`id` IN (?,?,?)" {
		t.Errorf("Expected '`id` IN (?,?,?)', got '%s'", clause)
	}
	if len(params) != 3 {
		t.Errorf("Expected 3 params, got %d", len(params))
	}
}

func TestBuildWhereClauseIS(t *testing.T) {
	filters := []Filter{
		{Column: "done", Operator: "IS", Value: "NULL"},
	}
	clause, params := BuildWhereClause(filters)
	if clause != "`done` IS NULL" {
		t.Errorf("Expected '`done` IS NULL', got '%s'", clause)
	}
	if len(params) != 0 {
		t.Errorf("IS NULL should have 0 params, got %d", len(params))
	}
}

func TestBuildWhereClauseEmpty(t *testing.T) {
	clause, params := BuildWhereClause(nil)
	if clause != "" {
		t.Errorf("Expected empty clause, got '%s'", clause)
	}
	if params != nil {
		t.Errorf("Expected nil params, got %v", params)
	}
}

func TestBuildWhereClauseMultiple(t *testing.T) {
	filters := []Filter{
		{Column: "done", Operator: "=", Value: "1"},
		{Column: "user_id", Operator: ">", Value: "5"},
	}
	clause, params := BuildWhereClause(filters)
	expected := "`done` = ? AND `user_id` > ?"
	if clause != expected {
		t.Errorf("Expected '%s', got '%s'", expected, clause)
	}
	if len(params) != 2 {
		t.Errorf("Expected 2 params, got %d", len(params))
	}
}

func TestParseSelectAll(t *testing.T) {
	schema := testSchema()
	cols, err := ParseSelect("*", schema)
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}
	if len(cols) != 1 || cols[0] != "*" {
		t.Errorf("Expected ['*'], got %v", cols)
	}
}

func TestParseSelectEmpty(t *testing.T) {
	schema := testSchema()
	cols, err := ParseSelect("", schema)
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}
	if len(cols) != 1 || cols[0] != "*" {
		t.Errorf("Expected ['*'], got %v", cols)
	}
}

func TestParseSelectSpecific(t *testing.T) {
	schema := testSchema()
	cols, err := ParseSelect("id,title", schema)
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}
	if len(cols) != 2 {
		t.Fatalf("Expected 2 columns, got %d", len(cols))
	}
}

func TestParseSelectUnknownColumn(t *testing.T) {
	schema := testSchema()
	_, err := ParseSelect("id,nonexistent", schema)
	if err == nil {
		t.Fatal("Expected error for unknown column")
	}
}

func TestParseOrderAsc(t *testing.T) {
	schema := testSchema()
	order, err := ParseOrder("created_at.asc", schema)
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}
	if order != "`created_at` ASC" {
		t.Errorf("Expected '`created_at` ASC', got '%s'", order)
	}
}

func TestParseOrderDesc(t *testing.T) {
	schema := testSchema()
	order, err := ParseOrder("id.desc", schema)
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}
	if order != "`id` DESC" {
		t.Errorf("Expected '`id` DESC', got '%s'", order)
	}
}

func TestParseOrderDefault(t *testing.T) {
	schema := testSchema()
	order, err := ParseOrder("id", schema)
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}
	if order != "`id` ASC" {
		t.Errorf("Expected default ASC, got '%s'", order)
	}
}

func TestParseOrderEmpty(t *testing.T) {
	schema := testSchema()
	order, err := ParseOrder("", schema)
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}
	if order != "" {
		t.Errorf("Expected empty string, got '%s'", order)
	}
}

func TestParseOrderInvalidDirection(t *testing.T) {
	schema := testSchema()
	_, err := ParseOrder("id.sideways", schema)
	if err == nil {
		t.Fatal("Expected error for invalid direction")
	}
}

func TestParseOrderUnknownColumn(t *testing.T) {
	schema := testSchema()
	_, err := ParseOrder("nonexistent.asc", schema)
	if err == nil {
		t.Fatal("Expected error for unknown column")
	}
}
