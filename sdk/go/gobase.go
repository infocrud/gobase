// Package gobase provides a Go client for the GoBase BaaS platform.
//
// Usage:
//
//	gb := gobase.NewClient("http://localhost:8000")
//	res, err := gb.Auth.SignIn(ctx, "user@example.com", "password")
//	rows, err := gb.From("posts").Select("id,title").Eq("published", "1").Get(ctx)
package gobase

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"net/textproto"
	"net/url"
	"strings"
	"time"
)

// Client is the top-level GoBase client.
type Client struct {
	baseURL    string
	httpClient *http.Client
	token      string

	Auth      *AuthClient
	Storage   *StorageClient
	Functions *FunctionsClient
}

// NewClient creates a new GoBase client pointing at baseURL (e.g. "http://localhost:8000").
func NewClient(baseURL string) *Client {
	baseURL = strings.TrimRight(baseURL, "/")
	hc := &http.Client{Timeout: 30 * time.Second}
	c := &Client{baseURL: baseURL, httpClient: hc}
	c.Auth = &AuthClient{c: c}
	c.Storage = &StorageClient{c: c}
	c.Functions = &FunctionsClient{c: c}
	return c
}

// SetToken manually sets the bearer token (useful after sign-in).
func (c *Client) SetToken(token string) { c.token = token }

// From returns a QueryBuilder for the given table.
func (c *Client) From(table string) *QueryBuilder {
	return &QueryBuilder{c: c, table: table, selects: "*"}
}

// ── HTTP helpers ──────────────────────────────────────────────────────────────

func (c *Client) do(ctx context.Context, method, path string, body interface{}) (*http.Response, error) {
	var bodyReader io.Reader
	if body != nil {
		b, err := json.Marshal(body)
		if err != nil {
			return nil, err
		}
		bodyReader = bytes.NewReader(b)
	}
	req, err := http.NewRequestWithContext(ctx, method, c.baseURL+path, bodyReader)
	if err != nil {
		return nil, err
	}
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	if c.token != "" {
		req.Header.Set("Authorization", "Bearer "+c.token)
	}
	return c.httpClient.Do(req)
}

func decodeJSON(resp *http.Response, out interface{}) error {
	defer resp.Body.Close()
	if resp.StatusCode >= 400 {
		var e map[string]interface{}
		_ = json.NewDecoder(resp.Body).Decode(&e)
		msg, _ := e["message"].(string)
		if msg == "" {
			msg = e["error"].(string)
		}
		return fmt.Errorf("gobase: %s (%d)", msg, resp.StatusCode)
	}
	return json.NewDecoder(resp.Body).Decode(out)
}

// ── Auth ──────────────────────────────────────────────────────────────────────

// AuthClient wraps GoBase auth endpoints.
type AuthClient struct{ c *Client }

// TokenPair holds access + refresh tokens.
type TokenPair struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
}

// User represents an authenticated user.
type User struct {
	ID            uint   `json:"id"`
	Email         string `json:"email"`
	Role          string `json:"role"`
	EmailVerified bool   `json:"email_verified"`
}

// AuthResult is returned by SignIn and SignUp.
type AuthResult struct {
	User   User      `json:"user"`
	Tokens TokenPair `json:"tokens"`
}

// SignUp creates a new user account.
func (a *AuthClient) SignUp(ctx context.Context, email, password string) (*AuthResult, error) {
	resp, err := a.c.do(ctx, "POST", "/auth/signup", map[string]string{"email": email, "password": password})
	if err != nil {
		return nil, err
	}
	var out struct {
		Data AuthResult `json:"data"`
	}
	if err := decodeJSON(resp, &out); err != nil {
		return nil, err
	}
	a.c.token = out.Data.Tokens.AccessToken
	return &out.Data, nil
}

// SignIn authenticates with email + password and stores the access token on the client.
func (a *AuthClient) SignIn(ctx context.Context, email, password string) (*AuthResult, error) {
	resp, err := a.c.do(ctx, "POST", "/auth/login", map[string]string{"email": email, "password": password})
	if err != nil {
		return nil, err
	}
	var out struct {
		Data AuthResult `json:"data"`
	}
	if err := decodeJSON(resp, &out); err != nil {
		return nil, err
	}
	a.c.token = out.Data.Tokens.AccessToken
	return &out.Data, nil
}

// SignOut revokes the current session.
func (a *AuthClient) SignOut(ctx context.Context) error {
	resp, err := a.c.do(ctx, "POST", "/auth/logout", nil)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	a.c.token = ""
	return nil
}

// Me returns the currently authenticated user.
func (a *AuthClient) Me(ctx context.Context) (*User, error) {
	resp, err := a.c.do(ctx, "GET", "/auth/me", nil)
	if err != nil {
		return nil, err
	}
	var out struct {
		Data User `json:"data"`
	}
	if err := decodeJSON(resp, &out); err != nil {
		return nil, err
	}
	return &out.Data, nil
}

// Refresh exchanges a refresh token for a new token pair.
func (a *AuthClient) Refresh(ctx context.Context, refreshToken string) (*TokenPair, error) {
	resp, err := a.c.do(ctx, "POST", "/auth/refresh", map[string]string{"refresh_token": refreshToken})
	if err != nil {
		return nil, err
	}
	var out struct {
		Data TokenPair `json:"data"`
	}
	if err := decodeJSON(resp, &out); err != nil {
		return nil, err
	}
	a.c.token = out.Data.AccessToken
	return &out.Data, nil
}

// ── REST Query Builder ────────────────────────────────────────────────────────

// QueryBuilder builds REST API queries fluently.
type QueryBuilder struct {
	c       *Client
	table   string
	selects string
	filters []string
	order   string
	limit   int
	offset  int
}

// Select sets the columns to return (comma-separated, default "*").
func (q *QueryBuilder) Select(cols string) *QueryBuilder { q.selects = cols; return q }

// Eq adds an equality filter: column=eq.value
func (q *QueryBuilder) Eq(col, val string) *QueryBuilder {
	q.filters = append(q.filters, col+"=eq."+val)
	return q
}

// Neq adds a not-equal filter.
func (q *QueryBuilder) Neq(col, val string) *QueryBuilder {
	q.filters = append(q.filters, col+"=neq."+val)
	return q
}

// Lt adds a less-than filter.
func (q *QueryBuilder) Lt(col, val string) *QueryBuilder {
	q.filters = append(q.filters, col+"=lt."+val)
	return q
}

// Lte adds a less-than-or-equal filter.
func (q *QueryBuilder) Lte(col, val string) *QueryBuilder {
	q.filters = append(q.filters, col+"=lte."+val)
	return q
}

// Gt adds a greater-than filter.
func (q *QueryBuilder) Gt(col, val string) *QueryBuilder {
	q.filters = append(q.filters, col+"=gt."+val)
	return q
}

// Gte adds a greater-than-or-equal filter.
func (q *QueryBuilder) Gte(col, val string) *QueryBuilder {
	q.filters = append(q.filters, col+"=gte."+val)
	return q
}

// Like adds a LIKE pattern filter.
func (q *QueryBuilder) Like(col, pattern string) *QueryBuilder {
	q.filters = append(q.filters, col+"=like."+pattern)
	return q
}

// ILike adds a case-insensitive LIKE filter.
func (q *QueryBuilder) ILike(col, pattern string) *QueryBuilder {
	q.filters = append(q.filters, col+"=ilike."+pattern)
	return q
}

// In adds an IN filter: column=in.(v1,v2,v3)
func (q *QueryBuilder) In(col string, vals []string) *QueryBuilder {
	q.filters = append(q.filters, col+"=in.("+strings.Join(vals, ",")+")")
	return q
}

// Order sets the ORDER BY clause (e.g. "created_at.desc").
func (q *QueryBuilder) Order(expr string) *QueryBuilder { q.order = expr; return q }

// Limit sets max rows returned.
func (q *QueryBuilder) Limit(n int) *QueryBuilder { q.limit = n; return q }

// Offset sets the row offset for pagination.
func (q *QueryBuilder) Offset(n int) *QueryBuilder { q.offset = n; return q }

// RowsResult holds query results.
type RowsResult struct {
	Rows  []map[string]interface{} `json:"rows"`
	Count int                      `json:"count"`
	Total int                      `json:"total"`
}

// Get executes a SELECT query and returns rows.
func (q *QueryBuilder) Get(ctx context.Context) (*RowsResult, error) {
	u, _ := url.Parse(q.c.baseURL + "/rest/v1/" + q.table)
	params := url.Values{}
	params.Set("select", q.selects)
	for _, f := range q.filters {
		parts := strings.SplitN(f, "=", 2)
		params.Add(parts[0], parts[1])
	}
	if q.order != "" {
		params.Set("order", q.order)
	}
	if q.limit > 0 {
		params.Set("limit", fmt.Sprint(q.limit))
	}
	if q.offset > 0 {
		params.Set("offset", fmt.Sprint(q.offset))
	}
	u.RawQuery = params.Encode()

	req, err := http.NewRequestWithContext(ctx, "GET", u.String(), nil)
	if err != nil {
		return nil, err
	}
	if q.c.token != "" {
		req.Header.Set("Authorization", "Bearer "+q.c.token)
	}
	resp, err := q.c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	var out struct {
		Data RowsResult `json:"data"`
	}
	if err := decodeJSON(resp, &out); err != nil {
		return nil, err
	}
	return &out.Data, nil
}

// RowResult holds a single-row result.
type RowResult struct {
	Row map[string]interface{} `json:"row"`
}

// GetByID fetches a single row by primary key.
func (q *QueryBuilder) GetByID(ctx context.Context, id interface{}) (*RowResult, error) {
	resp, err := q.c.do(ctx, "GET", fmt.Sprintf("/rest/v1/%s/%v", q.table, id), nil)
	if err != nil {
		return nil, err
	}
	var out struct {
		Data RowResult `json:"data"`
	}
	if err := decodeJSON(resp, &out); err != nil {
		return nil, err
	}
	return &out.Data, nil
}

// Insert creates a new row and returns it.
func (q *QueryBuilder) Insert(ctx context.Context, data map[string]interface{}) (*RowResult, error) {
	resp, err := q.c.do(ctx, "POST", "/rest/v1/"+q.table, data)
	if err != nil {
		return nil, err
	}
	var out struct {
		Data RowResult `json:"data"`
	}
	if err := decodeJSON(resp, &out); err != nil {
		return nil, err
	}
	return &out.Data, nil
}

// Update modifies an existing row by ID.
func (q *QueryBuilder) Update(ctx context.Context, id interface{}, data map[string]interface{}) (*RowResult, error) {
	resp, err := q.c.do(ctx, "PATCH", fmt.Sprintf("/rest/v1/%s/%v", q.table, id), data)
	if err != nil {
		return nil, err
	}
	var out struct {
		Data RowResult `json:"data"`
	}
	if err := decodeJSON(resp, &out); err != nil {
		return nil, err
	}
	return &out.Data, nil
}

// Delete removes a row by ID.
func (q *QueryBuilder) Delete(ctx context.Context, id interface{}) error {
	resp, err := q.c.do(ctx, "DELETE", fmt.Sprintf("/rest/v1/%s/%v", q.table, id), nil)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 400 {
		return fmt.Errorf("gobase: delete failed (%d)", resp.StatusCode)
	}
	return nil
}

// ── Storage ───────────────────────────────────────────────────────────────────

// StorageClient wraps GoBase storage endpoints.
type StorageClient struct{ c *Client }

// Bucket returns a BucketClient scoped to the given bucket name.
func (s *StorageClient) From(bucket string) *BucketClient {
	return &BucketClient{c: s.c, bucket: bucket}
}

// ListBuckets returns all storage buckets.
func (s *StorageClient) ListBuckets(ctx context.Context) ([]map[string]interface{}, error) {
	resp, err := s.c.do(ctx, "GET", "/storage/v1/bucket", nil)
	if err != nil {
		return nil, err
	}
	var out struct {
		Data struct {
			Buckets []map[string]interface{} `json:"buckets"`
		} `json:"data"`
	}
	if err := decodeJSON(resp, &out); err != nil {
		return nil, err
	}
	return out.Data.Buckets, nil
}

// CreateBucket creates a new storage bucket.
func (s *StorageClient) CreateBucket(ctx context.Context, name string, public bool) error {
	resp, err := s.c.do(ctx, "POST", "/storage/v1/bucket", map[string]interface{}{"name": name, "public": public})
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 400 {
		return fmt.Errorf("gobase: create bucket failed (%d)", resp.StatusCode)
	}
	return nil
}

// BucketClient is scoped to a single bucket.
type BucketClient struct {
	c      *Client
	bucket string
}

// Upload uploads a file to path in the bucket.
func (b *BucketClient) Upload(ctx context.Context, path, contentType string, data io.Reader) error {
	var buf bytes.Buffer
	w := multipart.NewWriter(&buf)
	h := make(textproto.MIMEHeader)
	h.Set("Content-Disposition", fmt.Sprintf(`form-data; name="file"; filename="%s"`, path))
	h.Set("Content-Type", contentType)
	fw, err := w.CreatePart(h)
	if err != nil {
		return err
	}
	if _, err := io.Copy(fw, data); err != nil {
		return err
	}
	w.Close()

	req, err := http.NewRequestWithContext(ctx, "POST",
		fmt.Sprintf("%s/storage/v1/object/%s/%s", b.c.baseURL, b.bucket, path),
		&buf)
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", w.FormDataContentType())
	if b.c.token != "" {
		req.Header.Set("Authorization", "Bearer "+b.c.token)
	}
	resp, err := b.c.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 400 {
		return fmt.Errorf("gobase: upload failed (%d)", resp.StatusCode)
	}
	return nil
}

// List returns objects in the bucket, optionally filtered by prefix.
func (b *BucketClient) List(ctx context.Context, prefix string) ([]map[string]interface{}, error) {
	path := fmt.Sprintf("/storage/v1/object/%s", b.bucket)
	if prefix != "" {
		path += "?prefix=" + url.QueryEscape(prefix)
	}
	resp, err := b.c.do(ctx, "GET", path, nil)
	if err != nil {
		return nil, err
	}
	var out struct {
		Data struct {
			Objects []map[string]interface{} `json:"objects"`
		} `json:"data"`
	}
	if err := decodeJSON(resp, &out); err != nil {
		return nil, err
	}
	return out.Data.Objects, nil
}

// CreateSignedURL generates a time-limited download URL for path.
func (b *BucketClient) CreateSignedURL(ctx context.Context, path string, expiresIn int) (string, error) {
	resp, err := b.c.do(ctx, "POST",
		fmt.Sprintf("/storage/v1/object/sign/%s/%s", b.bucket, path),
		map[string]int{"expires_in": expiresIn})
	if err != nil {
		return "", err
	}
	var out struct {
		Data struct {
			SignedURL string `json:"signed_url"`
		} `json:"data"`
	}
	if err := decodeJSON(resp, &out); err != nil {
		return "", err
	}
	return out.Data.SignedURL, nil
}

// Remove deletes an object from the bucket.
func (b *BucketClient) Remove(ctx context.Context, path string) error {
	resp, err := b.c.do(ctx, "DELETE",
		fmt.Sprintf("/storage/v1/object/%s/%s", b.bucket, path), nil)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 400 {
		return fmt.Errorf("gobase: remove failed (%d)", resp.StatusCode)
	}
	return nil
}

// ── Edge Functions ────────────────────────────────────────────────────────────

// FunctionsClient wraps GoBase edge function endpoints.
type FunctionsClient struct{ c *Client }

// Invoke calls an edge function by name with an optional JSON payload.
func (f *FunctionsClient) Invoke(ctx context.Context, name string, payload interface{}) (map[string]interface{}, error) {
	resp, err := f.c.do(ctx, "POST", "/functions/v1/"+name, payload)
	if err != nil {
		return nil, err
	}
	var out map[string]interface{}
	if err := decodeJSON(resp, &out); err != nil {
		return nil, err
	}
	return out, nil
}

// Deploy uploads source code for an edge function.
func (f *FunctionsClient) Deploy(ctx context.Context, name, sourceCode string) error {
	req, err := http.NewRequestWithContext(ctx, "POST",
		fmt.Sprintf("%s/functions/v1/deploy?name=%s", f.c.baseURL, url.QueryEscape(name)),
		strings.NewReader(sourceCode))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "text/plain")
	if f.c.token != "" {
		req.Header.Set("Authorization", "Bearer "+f.c.token)
	}
	resp, err := f.c.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 400 {
		return fmt.Errorf("gobase: deploy failed (%d)", resp.StatusCode)
	}
	return nil
}
