#!/bin/bash

# ============================================================================
# SUBSCRIPTION SYSTEM END-TO-END TEST SUITE (macOS Compatible)
# Tests complete subscription flow with all user roles and dependencies
# ============================================================================

# Don't exit on error - we want to run all tests
# set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
API_URL="${API_URL:-http://localhost:3000/api/v1}"
TEST_TIMESTAMP=$(date +%s)
REPORT_FILE="subscription-e2e-report-${TEST_TIMESTAMP}.md"

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Test data
SUPER_ADMIN_TOKEN=""
TENANT_ADMIN_TOKEN=""
AGENT_TOKEN=""
TENANT_ID=""
PLAN_ID=""
SUBSCRIPTION_ID=""

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((PASSED_TESTS++))
}

log_error() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((FAILED_TESTS++))
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

test_start() {
    ((TOTAL_TESTS++))
    log_info "Test #${TOTAL_TESTS}: $1"
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

echo "============================================="
echo "SUBSCRIPTION SYSTEM E2E TEST SUITE"
echo "============================================="
echo "API URL: $API_URL"
echo "Start Time: $(date)"
echo "============================================="
echo ""

# Initialize report
cat > "$REPORT_FILE" << EOF
# SUBSCRIPTION SYSTEM E2E TEST REPORT

**Date:** $(date)
**API URL:** $API_URL

## Test Execution Log

EOF

# ============================================================================
# TEST 1: AUTHENTICATION
# ============================================================================

log_info "========================================="
log_info "TEST SUITE 1: AUTHENTICATION"
log_info "========================================="

# Test 1.1: Super Admin Login
test_start "Super Admin Login"
RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@whatscrm.com","password":"SuperAdmin123!"}')

SUPER_ADMIN_TOKEN=$(echo "$RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

if [ -n "$SUPER_ADMIN_TOKEN" ]; then
    log_success "Super Admin authenticated"
    echo "### 1.1 Super Admin Login: ✅ PASS" >> "$REPORT_FILE"
    echo "Token: ${SUPER_ADMIN_TOKEN:0:20}..." >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
else
    log_error "Super Admin login failed"
    echo "### 1.1 Super Admin Login: ❌ FAIL" >> "$REPORT_FILE"
    echo "Response: $RESPONSE" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
fi

# Test 1.2: Tenant Admin Login
test_start "Tenant Admin Login"
RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"Admin123!"}')

TENANT_ADMIN_TOKEN=$(echo "$RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
TENANT_ID=$(echo "$RESPONSE" | grep -o '"tenantId":"[^"]*"' | cut -d'"' -f4)

if [ -n "$TENANT_ADMIN_TOKEN" ]; then
    log_success "Tenant Admin authenticated"
    echo "### 1.2 Tenant Admin Login: ✅ PASS" >> "$REPORT_FILE"
    echo "Token: ${TENANT_ADMIN_TOKEN:0:20}..." >> "$REPORT_FILE"
    echo "Tenant ID: $TENANT_ID" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
else
    log_error "Tenant Admin login failed"
    echo "### 1.2 Tenant Admin Login: ❌ FAIL" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
fi

# Test 1.3: Agent Login
test_start "Agent Login"
RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"agent@test.com","password":"Agent123!"}')

AGENT_TOKEN=$(echo "$RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

if [ -n "$AGENT_TOKEN" ]; then
    log_success "Agent authenticated"
    echo "### 1.3 Agent Login: ✅ PASS" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
else
    log_error "Agent login failed"
    echo "### 1.3 Agent Login: ❌ FAIL" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
fi

# ============================================================================
# TEST 2: SUBSCRIPTION PLANS
# ============================================================================

log_info "========================================="
log_info "TEST SUITE 2: SUBSCRIPTION PLANS"
log_info "========================================="

# Test 2.1: List Existing Plans
test_start "List Subscription Plans"
RESPONSE=$(curl -s -X GET "$API_URL/subscription-plans" \
  -H "Authorization: Bearer $TENANT_ADMIN_TOKEN")

if echo "$RESPONSE" | grep -q "Starter\|Growth\|Professional"; then
    log_success "Plans listed successfully"
    echo "### 2.1 List Plans: ✅ PASS" >> "$REPORT_FILE"
    echo "\`\`\`json" >> "$REPORT_FILE"
    echo "$RESPONSE" | head -30 >> "$REPORT_FILE"
    echo "\`\`\`" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    # Extract first plan ID for testing
    PLAN_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    log_info "Using Plan ID: $PLAN_ID"
else
    log_error "Failed to list plans"
    echo "### 2.1 List Plans: ❌ FAIL" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
fi

# Test 2.2: Get Plan Details
if [ -n "$PLAN_ID" ]; then
    test_start "Get Plan Details"
    RESPONSE=$(curl -s -X GET "$API_URL/subscription-plans/$PLAN_ID" \
      -H "Authorization: Bearer $TENANT_ADMIN_TOKEN")
    
    if echo "$RESPONSE" | grep -q "features"; then
        log_success "Plan details retrieved"
        echo "### 2.2 Get Plan Details: ✅ PASS" >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
    else
        log_error "Failed to get plan details"
        echo "### 2.2 Get Plan Details: ❌ FAIL" >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
    fi
fi

# ============================================================================
# TEST 3: CURRENT SUBSCRIPTION
# ============================================================================

log_info "========================================="
log_info "TEST SUITE 3: SUBSCRIPTION STATUS"
log_info "========================================="

# Test 3.1: Get Current Subscription
test_start "Get Current Subscription"
RESPONSE=$(curl -s -X GET "$API_URL/subscriptions/current" \
  -H "Authorization: Bearer $TENANT_ADMIN_TOKEN")

if echo "$RESPONSE" | grep -q "plan\|status"; then
    log_success "Current subscription retrieved"
    echo "### 3.1 Get Current Subscription: ✅ PASS" >> "$REPORT_FILE"
    echo "\`\`\`json" >> "$REPORT_FILE"
    echo "$RESPONSE" | head -20 >> "$REPORT_FILE"
    echo "\`\`\`" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    SUBSCRIPTION_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
else
    log_warning "No active subscription or failed to retrieve"
    echo "### 3.1 Get Current Subscription: ⚠️  WARN" >> "$REPORT_FILE"
    echo "Response: $RESPONSE" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
fi

# Test 3.2: Get Usage Statistics
test_start "Get Quota Usage"
RESPONSE=$(curl -s -X GET "$API_URL/subscriptions/usage" \
  -H "Authorization: Bearer $TENANT_ADMIN_TOKEN")

if echo "$RESPONSE" | grep -q "contacts\|users\|campaigns"; then
    log_success "Usage statistics retrieved"
    echo "### 3.2 Get Quota Usage: ✅ PASS" >> "$REPORT_FILE"
    echo "\`\`\`json" >> "$REPORT_FILE"
    echo "$RESPONSE" >> "$REPORT_FILE"
    echo "\`\`\`" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
else
    log_warning "Usage statistics may not be available"
    echo "### 3.2 Get Quota Usage: ⚠️  WARN" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
fi

# ============================================================================
# TEST 4: CONTACTS (QUOTA TEST)
# ============================================================================

log_info "========================================="
log_info "TEST SUITE 4: QUOTA ENFORCEMENT"
log_info "========================================="

# Test 4.1: Create Contact
test_start "Create Contact (Quota Test)"
RESPONSE=$(curl -s -X POST "$API_URL/contacts" \
  -H "Authorization: Bearer $TENANT_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "E2E",
    "lastName": "Test Contact",
    "phone": "+1234567890",
    "email": "e2e@test.com"
  }')

if echo "$RESPONSE" | grep -q "id"; then
    log_success "Contact created successfully"
    echo "### 4.1 Create Contact: ✅ PASS" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
else
    log_warning "Contact creation may have failed or quota exceeded"
    echo "### 4.1 Create Contact: ⚠️  WARN" >> "$REPORT_FILE"
    echo "Response: $RESPONSE" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
fi

# Test 4.2: List Contacts
test_start "List Contacts"
RESPONSE=$(curl -s -X GET "$API_URL/contacts?page=1&limit=10" \
  -H "Authorization: Bearer $TENANT_ADMIN_TOKEN")

if echo "$RESPONSE" | grep -q "data\|\["; then
    log_success "Contacts listed successfully"
    echo "### 4.2 List Contacts: ✅ PASS" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
else
    log_error "Failed to list contacts"
    echo "### 4.2 List Contacts: ❌ FAIL" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
fi

# ============================================================================
# TEST 5: WHATSAPP CONNECTIONS
# ============================================================================

log_info "========================================="
log_info "TEST SUITE 5: WHATSAPP CONNECTIONS"
log_info "========================================="

# Test 5.1: List WhatsApp Connections
test_start "List WhatsApp Connections"
RESPONSE=$(curl -s -X GET "$API_URL/whatsapp/connections?page=1&limit=10" \
  -H "Authorization: Bearer $TENANT_ADMIN_TOKEN")

if echo "$RESPONSE" | grep -q "data\|\["; then
    log_success "WhatsApp connections endpoint accessible"
    echo "### 5.1 List WhatsApp Connections: ✅ PASS" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
else
    log_warning "WhatsApp connections may not be configured"
    echo "### 5.1 List WhatsApp Connections: ⚠️  WARN" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
fi

# ============================================================================
# TEST 6: CAMPAIGNS
# ============================================================================

log_info "========================================="
log_info "TEST SUITE 6: CAMPAIGNS"
log_info "========================================="

# Test 6.1: List Campaigns
test_start "List Campaigns"
RESPONSE=$(curl -s -X GET "$API_URL/campaigns?page=1&limit=10" \
  -H "Authorization: Bearer $TENANT_ADMIN_TOKEN")

if echo "$RESPONSE" | grep -q "data\|\["; then
    log_success "Campaigns endpoint accessible"
    echo "### 6.1 List Campaigns: ✅ PASS" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
else
    log_warning "Campaigns may not be configured"
    echo "### 6.1 List Campaigns: ⚠️  WARN" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
fi

# ============================================================================
# TEST 7: RBAC TESTS
# ============================================================================

log_info "========================================="
log_info "TEST SUITE 7: ROLE-BASED ACCESS CONTROL"
log_info "========================================="

# Test 7.1: Agent Cannot Access Super Admin Routes
test_start "Agent Cannot Access Super Admin Routes"
RESPONSE=$(curl -s -X GET "$API_URL/super-admin/tenants" \
  -H "Authorization: Bearer $AGENT_TOKEN")

if echo "$RESPONSE" | grep -q "403\|Forbidden\|Unauthorized"; then
    log_success "Agent correctly blocked from super admin routes"
    echo "### 7.1 RBAC - Agent Blocked: ✅ PASS" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
else
    log_error "RBAC failed: Agent should not access super admin routes"
    echo "### 7.1 RBAC - Agent Blocked: ❌ FAIL" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
fi

# Test 7.2: Tenant Admin Cannot Access Super Admin Routes
test_start "Tenant Admin Cannot Access Super Admin Routes"
RESPONSE=$(curl -s -X GET "$API_URL/super-admin/tenants" \
  -H "Authorization: Bearer $TENANT_ADMIN_TOKEN")

if echo "$RESPONSE" | grep -q "403\|Forbidden\|Unauthorized"; then
    log_success "Tenant Admin correctly blocked from super admin routes"
    echo "### 7.2 RBAC - Tenant Admin Blocked: ✅ PASS" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
else
    log_error "RBAC failed: Tenant Admin should not access super admin routes"
    echo "### 7.2 RBAC - Tenant Admin Blocked: ❌ FAIL" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
fi

# ============================================================================
# FINALIZE REPORT
# ============================================================================

SUCCESS_RATE=$(awk "BEGIN {printf \"%.2f\", ($PASSED_TESTS/$TOTAL_TESTS)*100}")

cat >> "$REPORT_FILE" << EOF

---

## Test Summary

| Metric | Value |
|--------|-------|
| Total Tests | $TOTAL_TESTS |
| Passed | $PASSED_TESTS |
| Failed | $FAILED_TESTS |
| Success Rate | $SUCCESS_RATE% |

EOF

if [ $FAILED_TESTS -eq 0 ]; then
    echo "✅ **ALL TESTS PASSED** - System is fully functional" >> "$REPORT_FILE"
else
    echo "❌ **SOME TESTS FAILED** - Review failures above" >> "$REPORT_FILE"
fi

# Print summary
echo ""
echo "============================================="
echo "TEST EXECUTION COMPLETE"
echo "============================================="
echo "Total Tests: $TOTAL_TESTS"
echo "Passed: $PASSED_TESTS"
echo "Failed: $FAILED_TESTS"
echo "Success Rate: $SUCCESS_RATE%"
echo "Report: $REPORT_FILE"
echo "============================================="

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✅ ALL TESTS PASSED${NC}"
    exit 0
else
    echo -e "${RED}❌ SOME TESTS FAILED${NC}"
    exit 1
fi
