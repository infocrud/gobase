package engine

import (
	"encoding/json"
	"fmt"
	"strconv"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/rs/zerolog/log"
	"github.com/sureshkumarselvaraj/gobase/internal/db"
	"github.com/sureshkumarselvaraj/gobase/pkg/response"
	"gorm.io/gorm"
)

// CRUDHandler provides dynamic CRUD operations for any table.
type CRUDHandler struct {
	db     *gorm.DB
	schema *SchemaCache
}

// NewCRUDHandler creates a new CRUDHandler.
func NewCRUDHandler(db *gorm.DB, schema *SchemaCache) *CRUDHandler {
	return &CRUDHandler{db: db, schema: schema}
}

// List handles GET /rest/v1/:table — select rows with filters, ordering, pagination.
func (h *CRUDHandler) List(c *fiber.Ctx) error {
	table := c.Params("table")
	tableSchema := h.schema.GetTable(table)
	if tableSchema == nil {
		return response.Error(c, fiber.StatusNotFound, "Table '"+table+"' not found")
	}

	// Parse select columns
	selectCols, err := ParseSelect(c.Query("select"), tableSchema)
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error())
	}

	// Parse filters from query params
	queryParams := make(map[string]string)
	c.Context().QueryArgs().VisitAll(func(key, value []byte) {
		queryParams[string(key)] = string(value)
	})
	filters, err := ParseFilters(queryParams, tableSchema)
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error())
	}

	// Build query
	selectStr := "*"
	if len(selectCols) > 0 && selectCols[0] != "*" {
		quoted := make([]string, len(selectCols))
		for i, col := range selectCols {
			quoted[i] = `"` + col + `"`
		}
		selectStr = strings.Join(quoted, ", ")
	}

	query := h.db.Table(table).Select(selectStr)

	// Apply filters
	whereClause, whereParams := BuildWhereClause(filters)
	if whereClause != "" {
		query = query.Where(whereClause, whereParams...)
	}

	// Apply RLS policy WHERE clause
	policyWhere, _ := c.Locals("policy_where").(string)
	if policyWhere != "" {
		query = query.Where(policyWhere)
	}

	// Apply ordering
	if orderParam := c.Query("order"); orderParam != "" {
		orderClause, err := ParseOrder(orderParam, tableSchema)
		if err != nil {
			return response.Error(c, fiber.StatusBadRequest, err.Error())
		}
		query = query.Order(orderClause)
	}

	// Apply pagination
	if limitStr := c.Query("limit"); limitStr != "" {
		limit, err := strconv.Atoi(limitStr)
		if err != nil || limit < 0 {
			return response.Error(c, fiber.StatusBadRequest, "Invalid limit value")
		}
		query = query.Limit(limit)
	} else {
		query = query.Limit(100) // Default limit
	}

	if offsetStr := c.Query("offset"); offsetStr != "" {
		offset, err := strconv.Atoi(offsetStr)
		if err != nil || offset < 0 {
			return response.Error(c, fiber.StatusBadRequest, "Invalid offset value")
		}
		query = query.Offset(offset)
	}

	// Execute query
	var results []map[string]interface{}
	if err := query.Find(&results).Error; err != nil {
		log.Error().Err(err).Str("table", table).Msg("Query failed")
		return response.Error(c, fiber.StatusInternalServerError, "Query failed")
	}

	return response.Success(c, results)
}

// GetByID handles GET /rest/v1/:table/:id — get a single row.
func (h *CRUDHandler) GetByID(c *fiber.Ctx) error {
	table := c.Params("table")
	id := c.Params("id")

	tableSchema := h.schema.GetTable(table)
	if tableSchema == nil {
		return response.Error(c, fiber.StatusNotFound, "Table '"+table+"' not found")
	}

	pk := tableSchema.PrimaryKey
	if pk == "" {
		return response.Error(c, fiber.StatusBadRequest, "Table has no primary key")
	}

	query := h.db.Table(table).Where(fmt.Sprintf(`"%s" = ?`, pk), id)

	// Apply RLS policy
	policyWhere, _ := c.Locals("policy_where").(string)
	if policyWhere != "" {
		query = query.Where(policyWhere)
	}

	var result map[string]interface{}
	// Use Take, not First: First auto-appends "ORDER BY <pk>", but with a raw
	// Table() query GORM doesn't know the primary key and emits a broken
	// "ORDER BY \"table\". LIMIT 1". Take fetches one row without ordering.
	if err := query.Take(&result).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return response.Error(c, fiber.StatusNotFound, "Record not found")
		}
		log.Error().Err(err).Str("table", table).Msg("GetByID query failed")
		return response.Error(c, fiber.StatusInternalServerError, "Query failed")
	}

	return response.Success(c, result)
}

// Create handles POST /rest/v1/:table — insert one or more rows.
func (h *CRUDHandler) Create(c *fiber.Ctx) error {
	table := c.Params("table")
	tableSchema := h.schema.GetTable(table)
	if tableSchema == nil {
		return response.Error(c, fiber.StatusNotFound, "Table '"+table+"' not found")
	}

	// Try to parse as array first, then as single object
	var rows []map[string]interface{}

	// Try single object
	var single map[string]interface{}
	if err := c.BodyParser(&single); err == nil && len(single) > 0 {
		rows = []map[string]interface{}{single}
	} else {
		// Try array
		if err := c.BodyParser(&rows); err != nil {
			return response.Error(c, fiber.StatusBadRequest, "Invalid request body")
		}
	}

	if len(rows) == 0 {
		return response.Error(c, fiber.StatusBadRequest, "No data provided")
	}

	// Validate columns
	for _, row := range rows {
		for col := range row {
			if !h.schema.ValidateColumn(table, col) {
				return response.Error(c, fiber.StatusBadRequest, "Unknown column: "+col)
			}
		}
	}

	// Insert rows.
	if err := h.db.Table(table).Create(&rows).Error; err != nil {
		log.Error().Err(err).Str("table", table).Msg("Insert failed")
		return response.Error(c, fiber.StatusInternalServerError, "Insert failed: "+err.Error())
	}

	// Record changes for realtime subscribers (best-effort, non-fatal).
	pk := tableSchema.PrimaryKey
	for _, row := range rows {
		recordID := ""
		if pk != "" {
			if v, ok := row[pk]; ok {
				recordID = fmt.Sprint(v)
			}
		}
		h.recordChange(table, "INSERT", recordID, row)
	}

	return response.SuccessWithStatus(c, fiber.StatusCreated, rows)
}

// recordChange appends a row to realtime_changes so the realtime service can
// broadcast it to subscribed WebSocket clients. Failures are logged, not fatal —
// a realtime hiccup must never break the underlying CRUD write.
func (h *CRUDHandler) recordChange(table, operation, recordID string, payload interface{}) {
	data, err := json.Marshal(payload)
	if err != nil {
		log.Warn().Err(err).Str("table", table).Msg("realtime: failed to marshal change payload")
		return
	}
	change := db.RealtimeChange{
		Table:     table,
		Operation: operation,
		RecordID:  recordID,
		Payload:   string(data),
	}
	if err := h.db.Create(&change).Error; err != nil {
		log.Warn().Err(err).Str("table", table).Msg("realtime: failed to record change")
	}
}

// Update handles PATCH /rest/v1/:table/:id — update a single row.
func (h *CRUDHandler) Update(c *fiber.Ctx) error {
	table := c.Params("table")
	id := c.Params("id")

	tableSchema := h.schema.GetTable(table)
	if tableSchema == nil {
		return response.Error(c, fiber.StatusNotFound, "Table '"+table+"' not found")
	}

	pk := tableSchema.PrimaryKey
	if pk == "" {
		return response.Error(c, fiber.StatusBadRequest, "Table has no primary key")
	}

	var updates map[string]interface{}
	if err := c.BodyParser(&updates); err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Validate columns
	for col := range updates {
		if !h.schema.ValidateColumn(table, col) {
			return response.Error(c, fiber.StatusBadRequest, "Unknown column: "+col)
		}
	}

	// Remove primary key from updates if present
	delete(updates, pk)

	query := h.db.Table(table).Where(fmt.Sprintf(`"%s" = ?`, pk), id)

	// Apply RLS policy
	policyWhere, _ := c.Locals("policy_where").(string)
	if policyWhere != "" {
		query = query.Where(policyWhere)
	}

	result := query.Updates(updates)
	if result.Error != nil {
		log.Error().Err(result.Error).Str("table", table).Msg("Update failed")
		return response.Error(c, fiber.StatusInternalServerError, "Update failed")
	}

	if result.RowsAffected == 0 {
		return response.Error(c, fiber.StatusNotFound, "Record not found or access denied")
	}

	// Record change for realtime subscribers (best-effort).
	changed := map[string]interface{}{pk: id}
	for k, v := range updates {
		changed[k] = v
	}
	h.recordChange(table, "UPDATE", id, changed)

	return response.Success(c, fiber.Map{
		"message":       "Updated successfully",
		"rows_affected": result.RowsAffected,
	})
}

// Delete handles DELETE /rest/v1/:table/:id — delete a single row.
func (h *CRUDHandler) Delete(c *fiber.Ctx) error {
	table := c.Params("table")
	id := c.Params("id")

	tableSchema := h.schema.GetTable(table)
	if tableSchema == nil {
		return response.Error(c, fiber.StatusNotFound, "Table '"+table+"' not found")
	}

	pk := tableSchema.PrimaryKey
	if pk == "" {
		return response.Error(c, fiber.StatusBadRequest, "Table has no primary key")
	}

	query := h.db.Table(table).Where(fmt.Sprintf(`"%s" = ?`, pk), id)

	// Apply RLS policy
	policyWhere, _ := c.Locals("policy_where").(string)
	if policyWhere != "" {
		query = query.Where(policyWhere)
	}

	result := query.Delete(nil)
	if result.Error != nil {
		log.Error().Err(result.Error).Str("table", table).Msg("Delete failed")
		return response.Error(c, fiber.StatusInternalServerError, "Delete failed")
	}

	if result.RowsAffected == 0 {
		return response.Error(c, fiber.StatusNotFound, "Record not found or access denied")
	}

	// Record change for realtime subscribers (best-effort).
	h.recordChange(table, "DELETE", id, map[string]interface{}{pk: id})

	return response.Success(c, fiber.Map{
		"message":       "Deleted successfully",
		"rows_affected": result.RowsAffected,
	})
}
