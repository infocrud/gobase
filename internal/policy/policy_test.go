package policy

import (
	"testing"
)

func TestRenderExpression(t *testing.T) {
	data := TemplateData{UserID: 42, Email: "test@example.com"}

	clause, err := renderExpression("user_id = {{.UserID}}", data)
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}
	if clause != "user_id = 42" {
		t.Errorf("Expected 'user_id = 42', got '%s'", clause)
	}
}

func TestRenderExpressionEmail(t *testing.T) {
	data := TemplateData{UserID: 1, Email: "admin@gobase.dev"}

	clause, err := renderExpression("email = '{{.Email}}'", data)
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}
	if clause != "email = 'admin@gobase.dev'" {
		t.Errorf("Expected email in clause, got '%s'", clause)
	}
}

func TestRenderExpressionStatic(t *testing.T) {
	data := TemplateData{UserID: 1, Email: "a@b.com"}

	clause, err := renderExpression("1=1", data)
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}
	if clause != "1=1" {
		t.Errorf("Expected '1=1', got '%s'", clause)
	}
}

func TestRenderExpressionInvalid(t *testing.T) {
	data := TemplateData{UserID: 1, Email: "a@b.com"}
	_, err := renderExpression("user_id = {{.Invalid}}", data)
	// template.Execute returns an error for unknown fields
	if err == nil {
		t.Fatal("Expected error for invalid template field")
	}
}

func TestRenderExpressionMalformed(t *testing.T) {
	data := TemplateData{UserID: 1, Email: "a@b.com"}
	_, err := renderExpression("user_id = {{.UserID", data)
	if err == nil {
		t.Fatal("Expected error for malformed template")
	}
}

func TestCacheKey(t *testing.T) {
	key := cacheKey("todos", "SELECT")
	if key != "todos:SELECT" {
		t.Errorf("Expected 'todos:SELECT', got '%s'", key)
	}

	key2 := cacheKey("todos", "select")
	if key2 != "todos:SELECT" {
		t.Errorf("Expected uppercase operation, got '%s'", key2)
	}
}

// ─── Safety Validation Tests ──────────────────────────────

func TestValidateExpression_Safe(t *testing.T) {
	safeExpressions := []string{
		"user_id = {{.UserID}}",
		"1=1",
		"email = '{{.Email}}'",
		"user_id = {{.UserID}} AND active = 1",
		"status = 'active'",
		"age >= 18",
		"role = 'user' OR role = 'admin'",
	}

	for _, expr := range safeExpressions {
		if err := validateExpression(expr); err != nil {
			t.Errorf("Expected expression to be safe: %q, got error: %v", expr, err)
		}
	}
}

func TestValidateExpression_DangerousSQL(t *testing.T) {
	dangerousExpressions := []string{
		"1=1; DROP TABLE users",
		"1=1 UNION SELECT * FROM users",
		"DELETE FROM users WHERE 1=1",
		"INSERT INTO users VALUES (1)",
		"UPDATE users SET role = 'admin'",
		"ALTER TABLE users ADD COLUMN hack varchar(255)",
		"TRUNCATE TABLE users",
	}

	for _, expr := range dangerousExpressions {
		if err := validateExpression(expr); err == nil {
			t.Errorf("Expected expression to be rejected as dangerous: %q", expr)
		}
	}
}

func TestValidateExpression_DangerousChars(t *testing.T) {
	dangerousExpressions := []string{
		"1=1; --",
		"user_id = 1; SELECT 1",
	}

	for _, expr := range dangerousExpressions {
		if err := validateExpression(expr); err == nil {
			t.Errorf("Expected expression to be rejected for dangerous chars: %q", expr)
		}
	}
}

func TestValidateExpression_Empty(t *testing.T) {
	if err := validateExpression(""); err == nil {
		t.Error("Expected error for empty expression")
	}
}

func TestValidateRenderedSQL_Safe(t *testing.T) {
	if err := validateRenderedSQL("user_id = 42"); err != nil {
		t.Errorf("Expected rendered SQL to be safe, got: %v", err)
	}
	if err := validateRenderedSQL(""); err != nil {
		t.Errorf("Expected empty rendered SQL to be safe, got: %v", err)
	}
}

func TestValidateRenderedSQL_Dangerous(t *testing.T) {
	if err := validateRenderedSQL("user_id = 42 UNION SELECT password FROM users"); err == nil {
		t.Error("Expected rendered SQL with UNION to be rejected")
	}
}
