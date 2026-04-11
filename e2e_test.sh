#!/bin/bash
# ─────────────────────────────────────────────────────────
# GoBase End-to-End Test Script
# Tests: Health, Auth (Signup/Login/Me/Refresh/Logout), REST
# ─────────────────────────────────────────────────────────

set -e

GATEWAY="http://localhost:8000"
AUTH="http://localhost:8001"
REST="http://localhost:8002"

PASS=0
FAIL=0
TOTAL=0
TEST_EMAIL="e2etest_$(date +%s)@test.com"
TEST_PASSWORD="TestPass123!"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

assert() {
    TOTAL=$((TOTAL + 1))
    local test_name="$1"
    local expected="$2"
    local actual="$3"

    if echo "$actual" | grep -q "$expected"; then
        PASS=$((PASS + 1))
        echo -e "  ${GREEN}✅ PASS${NC}: $test_name"
    else
        FAIL=$((FAIL + 1))
        echo -e "  ${RED}❌ FAIL${NC}: $test_name"
        echo -e "    Expected to contain: ${YELLOW}$expected${NC}"
        echo -e "    Actual: ${YELLOW}$(echo $actual | head -c 200)${NC}"
    fi
}

assert_status() {
    TOTAL=$((TOTAL + 1))
    local test_name="$1"
    local expected_code="$2"
    local actual_code="$3"

    if [ "$actual_code" -eq "$expected_code" ]; then
        PASS=$((PASS + 1))
        echo -e "  ${GREEN}✅ PASS${NC}: $test_name (HTTP $actual_code)"
    else
        FAIL=$((FAIL + 1))
        echo -e "  ${RED}❌ FAIL${NC}: $test_name (expected HTTP $expected_code, got HTTP $actual_code)"
    fi
}

echo -e "\n${CYAN}═══════════════════════════════════════════════════${NC}"
echo -e "${CYAN}     GoBase E2E Test Suite                      ${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════${NC}\n"

# ─────────────────────────────────────────────────────
# 1. HEALTH CHECKS
# ─────────────────────────────────────────────────────
echo -e "${YELLOW}▸ 1. Health Checks${NC}"

# Gateway health
RESP=$(curl -s -w "\n%{http_code}" "$GATEWAY/health")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
assert_status "Gateway /health status" 200 "$HTTP_CODE"
assert "Gateway /health body" '"status":"healthy"' "$BODY"

# Auth service health (direct)
RESP=$(curl -s -w "\n%{http_code}" "$AUTH/health")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
assert_status "Auth /health status" 200 "$HTTP_CODE"
assert "Auth /health body" '"service":"auth"' "$BODY"

# REST service health (direct)
RESP=$(curl -s -w "\n%{http_code}" "$REST/health")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
assert_status "REST /health status" 200 "$HTTP_CODE"
assert "REST /health body" '"service":"rest"' "$BODY"

# ─────────────────────────────────────────────────────
# 2. AUTH — SIGNUP
# ─────────────────────────────────────────────────────
echo -e "\n${YELLOW}▸ 2. Auth — Signup${NC}"

# Signup with valid credentials
RESP=$(curl -s -w "\n%{http_code}" -X POST "$AUTH/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
assert_status "Signup — 201 Created" 201 "$HTTP_CODE"
assert "Signup — returns access_token" 'access_token' "$BODY"
assert "Signup — returns refresh_token" 'refresh_token' "$BODY"
assert "Signup — returns user email" "$TEST_EMAIL" "$BODY"

# Extract tokens
ACCESS_TOKEN=$(echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['data']['tokens']['access_token'])" 2>/dev/null || echo "")
REFRESH_TOKEN=$(echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['data']['tokens']['refresh_token'])" 2>/dev/null || echo "")

# Signup with duplicate email
RESP=$(curl -s -w "\n%{http_code}" -X POST "$AUTH/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
assert_status "Signup — duplicate email 409" 409 "$HTTP_CODE"
assert "Signup — duplicate error message" 'already exists' "$BODY"

# Signup with short password
RESP=$(curl -s -w "\n%{http_code}" -X POST "$AUTH/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{"email":"bad@test.com","password":"short"}')
HTTP_CODE=$(echo "$RESP" | tail -1)
assert_status "Signup — short password 400" 400 "$HTTP_CODE"

# Signup with missing email
RESP=$(curl -s -w "\n%{http_code}" -X POST "$AUTH/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{"email":"","password":"TestPass123!"}')
HTTP_CODE=$(echo "$RESP" | tail -1)
assert_status "Signup — missing email 400" 400 "$HTTP_CODE"

# ─────────────────────────────────────────────────────
# 3. AUTH — LOGIN
# ─────────────────────────────────────────────────────
echo -e "\n${YELLOW}▸ 3. Auth — Login${NC}"

# Login with valid credentials
RESP=$(curl -s -w "\n%{http_code}" -X POST "$AUTH/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
assert_status "Login — 200 OK" 200 "$HTTP_CODE"
assert "Login — returns access_token" 'access_token' "$BODY"
assert "Login — returns refresh_token" 'refresh_token' "$BODY"

# Update tokens from login
ACCESS_TOKEN=$(echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['data']['tokens']['access_token'])" 2>/dev/null || echo "")
REFRESH_TOKEN=$(echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['data']['tokens']['refresh_token'])" 2>/dev/null || echo "")

# Login with wrong password
RESP=$(curl -s -w "\n%{http_code}" -X POST "$AUTH/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"WrongPass123!\"}")
HTTP_CODE=$(echo "$RESP" | tail -1)
assert_status "Login — wrong password 401" 401 "$HTTP_CODE"

# Login with non-existent user
RESP=$(curl -s -w "\n%{http_code}" -X POST "$AUTH/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"noone@noexist.com","password":"TestPass123!"}')
HTTP_CODE=$(echo "$RESP" | tail -1)
assert_status "Login — non-existent user 401" 401 "$HTTP_CODE"

# Login with missing fields
RESP=$(curl -s -w "\n%{http_code}" -X POST "$AUTH/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"","password":""}')
HTTP_CODE=$(echo "$RESP" | tail -1)
assert_status "Login — missing fields 400" 400 "$HTTP_CODE"

# ─────────────────────────────────────────────────────
# 4. AUTH — ME (Protected Route)
# ─────────────────────────────────────────────────────
echo -e "\n${YELLOW}▸ 4. Auth — Me (Protected Route)${NC}"

# Get user info with valid token
if [ -n "$ACCESS_TOKEN" ]; then
    RESP=$(curl -s -w "\n%{http_code}" -X GET "$AUTH/auth/me" \
      -H "Authorization: Bearer $ACCESS_TOKEN")
    HTTP_CODE=$(echo "$RESP" | tail -1)
    BODY=$(echo "$RESP" | sed '$d')
    assert_status "GET /auth/me — 200 OK" 200 "$HTTP_CODE"
    assert "GET /auth/me — returns email" "$TEST_EMAIL" "$BODY"
else
    echo -e "  ${RED}⚠ SKIP${NC}: No access token available"
fi

# Get user info without token
RESP=$(curl -s -w "\n%{http_code}" -X GET "$AUTH/auth/me")
HTTP_CODE=$(echo "$RESP" | tail -1)
assert_status "GET /auth/me — no token 401" 401 "$HTTP_CODE"

# Get user info with invalid token
RESP=$(curl -s -w "\n%{http_code}" -X GET "$AUTH/auth/me" \
  -H "Authorization: Bearer invalid-token-here")
HTTP_CODE=$(echo "$RESP" | tail -1)
assert_status "GET /auth/me — invalid token 401" 401 "$HTTP_CODE"

# ─────────────────────────────────────────────────────
# 5. AUTH — REFRESH TOKEN
# ─────────────────────────────────────────────────────
echo -e "\n${YELLOW}▸ 5. Auth — Refresh Token${NC}"

if [ -n "$REFRESH_TOKEN" ]; then
    RESP=$(curl -s -w "\n%{http_code}" -X POST "$AUTH/auth/refresh" \
      -H "Content-Type: application/json" \
      -d "{\"refresh_token\":\"$REFRESH_TOKEN\"}")
    HTTP_CODE=$(echo "$RESP" | tail -1)
    BODY=$(echo "$RESP" | sed '$d')
    assert_status "Refresh — 200 OK" 200 "$HTTP_CODE"
    assert "Refresh — returns new access_token" 'access_token' "$BODY"
    assert "Refresh — returns new refresh_token" 'refresh_token' "$BODY"

    # Update tokens
    NEW_ACCESS=$(echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['data']['tokens']['access_token'])" 2>/dev/null || echo "")
    NEW_REFRESH=$(echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['data']['tokens']['refresh_token'])" 2>/dev/null || echo "")

    if [ -n "$NEW_ACCESS" ]; then
        ACCESS_TOKEN="$NEW_ACCESS"
    fi

    # Reuse old refresh token (should fail — token rotation)
    RESP=$(curl -s -w "\n%{http_code}" -X POST "$AUTH/auth/refresh" \
      -H "Content-Type: application/json" \
      -d "{\"refresh_token\":\"$REFRESH_TOKEN\"}")
    HTTP_CODE=$(echo "$RESP" | tail -1)
    assert_status "Refresh — reuse old token 401" 401 "$HTTP_CODE"
else
    echo -e "  ${RED}⚠ SKIP${NC}: No refresh token available"
fi

# Refresh with invalid token
RESP=$(curl -s -w "\n%{http_code}" -X POST "$AUTH/auth/refresh" \
  -H "Content-Type: application/json" \
  -d '{"refresh_token":"totally-invalid-token"}')
HTTP_CODE=$(echo "$RESP" | tail -1)
assert_status "Refresh — invalid token 401" 401 "$HTTP_CODE"

# Refresh with empty token
RESP=$(curl -s -w "\n%{http_code}" -X POST "$AUTH/auth/refresh" \
  -H "Content-Type: application/json" \
  -d '{"refresh_token":""}')
HTTP_CODE=$(echo "$RESP" | tail -1)
assert_status "Refresh — empty token 400" 400 "$HTTP_CODE"

# ─────────────────────────────────────────────────────
# 6. AUTH — FORGOT/RESET PASSWORD
# ─────────────────────────────────────────────────────
echo -e "\n${YELLOW}▸ 6. Auth — Forgot/Reset Password${NC}"

# Forgot password with valid email (should always return 200 for security)
RESP=$(curl -s -w "\n%{http_code}" -X POST "$AUTH/auth/forgot-password" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\"}")
HTTP_CODE=$(echo "$RESP" | tail -1)
assert_status "Forgot password — valid email 200" 200 "$HTTP_CODE"

# Forgot password with non-existent email (should still return 200)
RESP=$(curl -s -w "\n%{http_code}" -X POST "$AUTH/auth/forgot-password" \
  -H "Content-Type: application/json" \
  -d '{"email":"nonexistent@test.com"}')
HTTP_CODE=$(echo "$RESP" | tail -1)
assert_status "Forgot password — unknown email 200 (no leak)" 200 "$HTTP_CODE"

# Reset password with invalid token
RESP=$(curl -s -w "\n%{http_code}" -X POST "$AUTH/auth/reset-password" \
  -H "Content-Type: application/json" \
  -d '{"token":"invalid-token","password":"NewPass123!"}')
HTTP_CODE=$(echo "$RESP" | tail -1)
assert_status "Reset password — invalid token 400" 400 "$HTTP_CODE"

# ─────────────────────────────────────────────────────
# 7. GATEWAY PROXYING
# ─────────────────────────────────────────────────────
echo -e "\n${YELLOW}▸ 7. Gateway — Proxy to Auth${NC}"

# Login through gateway
RESP=$(curl -s -w "\n%{http_code}" -X POST "$GATEWAY/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
assert_status "Gateway → Auth login 200" 200 "$HTTP_CODE"
assert "Gateway → Auth returns token" 'access_token' "$BODY"

# Update token from gateway login
GW_ACCESS=$(echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['data']['tokens']['access_token'])" 2>/dev/null || echo "")
if [ -n "$GW_ACCESS" ]; then
    ACCESS_TOKEN="$GW_ACCESS"
fi

# Me through gateway
RESP=$(curl -s -w "\n%{http_code}" -X GET "$GATEWAY/auth/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
assert_status "Gateway → Auth /me 200" 200 "$HTTP_CODE"
assert "Gateway → Auth /me returns email" "$TEST_EMAIL" "$BODY"

# ─────────────────────────────────────────────────────
# 8. REST — SCHEMA
# ─────────────────────────────────────────────────────
echo -e "\n${YELLOW}▸ 8. REST — Schema Endpoint${NC}"

# List tables (public endpoint)
RESP=$(curl -s -w "\n%{http_code}" "$REST/rest/v1/_schema")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
assert_status "GET /_schema — 200 OK" 200 "$HTTP_CODE"
assert "GET /_schema — returns success" '"success":true' "$BODY"

# ─────────────────────────────────────────────────────
# 9. REST — CRUD (requires JWT + policy)
# ─────────────────────────────────────────────────────
echo -e "\n${YELLOW}▸ 9. REST — CRUD (Protected)${NC}"

# Access without JWT should be 401
RESP=$(curl -s -w "\n%{http_code}" "$REST/rest/v1/realtime_changes/")
HTTP_CODE=$(echo "$RESP" | tail -1)
assert_status "GET /rest/v1/table without JWT — 401" 401 "$HTTP_CODE"

# Access with JWT but no policy should be 403
RESP=$(curl -s -w "\n%{http_code}" "$REST/rest/v1/realtime_changes/" \
  -H "Authorization: Bearer $ACCESS_TOKEN")
HTTP_CODE=$(echo "$RESP" | tail -1)
assert_status "GET /rest/v1/table with JWT, no policy — 403" 403 "$HTTP_CODE"

# ─────────────────────────────────────────────────────
# 10. AUTH — LOGOUT
# ─────────────────────────────────────────────────────
echo -e "\n${YELLOW}▸ 10. Auth — Logout${NC}"

if [ -n "$ACCESS_TOKEN" ]; then
    RESP=$(curl -s -w "\n%{http_code}" -X POST "$AUTH/auth/logout" \
      -H "Authorization: Bearer $ACCESS_TOKEN")
    HTTP_CODE=$(echo "$RESP" | tail -1)
    BODY=$(echo "$RESP" | sed '$d')
    assert_status "Logout — 200 OK" 200 "$HTTP_CODE"
    assert "Logout — success message" 'Successfully logged out' "$BODY"
else
    echo -e "  ${RED}⚠ SKIP${NC}: No access token available"
fi

# ─────────────────────────────────────────────────────
# 11. EDGE CASES
# ─────────────────────────────────────────────────────
echo -e "\n${YELLOW}▸ 11. Edge Cases${NC}"

# Invalid JSON body
RESP=$(curl -s -w "\n%{http_code}" -X POST "$AUTH/auth/signup" \
  -H "Content-Type: application/json" \
  -d 'this-is-not-json')
HTTP_CODE=$(echo "$RESP" | tail -1)
assert_status "Signup — invalid JSON 400" 400 "$HTTP_CODE"

# Wrong HTTP method
RESP=$(curl -s -w "\n%{http_code}" -X GET "$AUTH/auth/signup")
HTTP_CODE=$(echo "$RESP" | tail -1)
assert_status "GET /auth/signup — 401 (Fiber route fallthrough)" 401 "$HTTP_CODE"

# Non-existent route
RESP=$(curl -s -w "\n%{http_code}" "$GATEWAY/nonexistent")
HTTP_CODE=$(echo "$RESP" | tail -1)
assert_status "GET /nonexistent — 404" 404 "$HTTP_CODE"

# ─────────────────────────────────────────────────────
# RESULTS SUMMARY
# ─────────────────────────────────────────────────────
echo -e "\n${CYAN}═══════════════════════════════════════════════════${NC}"
echo -e "${CYAN}     Test Results                                  ${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════${NC}"
echo -e "  Total:  ${TOTAL}"
echo -e "  ${GREEN}Passed: ${PASS}${NC}"
echo -e "  ${RED}Failed: ${FAIL}${NC}"
echo ""

if [ "$FAIL" -eq 0 ]; then
    echo -e "  ${GREEN}🎉 All tests passed!${NC}\n"
    exit 0
else
    echo -e "  ${RED}⚠ Some tests failed.${NC}\n"
    exit 1
fi
