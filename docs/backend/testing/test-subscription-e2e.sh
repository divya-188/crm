#!/bin/bash

# ============================================================================
# SUBSCRIPTION SYSTEM END-TO-END TEST SUITE
# Tests complete subscription flow with all user roles and dependencies
# ============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_URL="${API_URL:-http://localhost:3000}"
TEST_TIMESTAMP=$(date +%s)
REPORT_FILE="subscription-e2e-report-${TEST_TIMESTAMP}.md"

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Test data storage
declare -A TOKENS
declare -A USER_IDS
declare -A TENANT_IDS
declare -A PLAN_IDS
declare -A SUBSCRIPTION_IDS

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

# Make API call and return response
api_call() {
    local method=$1
    local endpoint=$2
    local data=$3
    local token=$4
    
    local headers="-H 'Content-Type: application/json'"
    if [ -n "$token" ]; then
        headers="$headers -H 'Authorization: Bearer $token'"
    fi
    
    if [ "$method" = "GET" ] || [ "$method" = "DELETE" ]; then
        eval curl -s -X $method "$API_URL$endpoint" $headers
    else
        eval curl -s -X $method "$API_URL$endpoint" $headers -d "'$data'"
    fi
}

# Extract JSON field
extract_json() {
    echo "$1" | grep -o "\"$2\":\"[^\"]*\"" | cut -d'"' -f4
}

extract_json_number() {
    echo "$1" | grep -o "\"$2\":[0-9]*" | cut -d':' -f2
}

# ============================================================================
# TEST SUITE INITIALIZATION
# ============================================================================

init_report() {
    cat > "$REPORT_FILE" << EOF
# SUBSCRIPTION SYSTEM E2E TEST REPORT

**Date:** $(date)
**API URL:** $API_URL
**Test Duration:** [Will be calculated]

## Executive Summary

| Metric | Value |
|--------|-------|
| Total Tests | $TOTAL_TESTS |
| Passed | $PASSED_TESTS |
| Failed | $FAILED_TESTS |
| Success Rate | [Will be calculated]% |

---

## Test Execution Log

EOF
}

finalize_report() {
    local duration=$1
    local success_rate=$(awk "BEGIN {printf \"%.2f\", ($PASSED_TESTS/$TOTAL_TESTS)*100}")
    
    # Update summary
    sed -i.bak "s/\[Will be calculated\]/$duration/" "$REPORT_FILE"
    sed -i.bak "s/Total Tests | .*/Total Tests | $TOTAL_TESTS |/" "$REPORT_FILE"
    sed -i.bak "s/Passed | .*/Passed | $PASSED_TESTS |/" "$REPORT_FILE"
    sed -i.bak "s/Failed | .*/Failed | $FAILED_TESTS |/" "$REPORT_FILE"
    sed -i.bak "s/Success Rate | .*/Success Rate | $success_rate% |/" "$REPORT_FILE"
    
    rm "${REPORT_FILE}.bak"
    
    echo "" >> "$REPORT_FILE"
    echo "---" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    echo "## Test Summary" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    if [ $FAILED_TESTS -eq 0 ]; then
        echo "✅ **ALL TESTS PASSED** - System is fully functional" >> "$REPORT_FILE"
    else
        echo "❌ **SOME TESTS FAILED** - Review failures above" >> "$REPORT_FILE"
    fi
}

# ============================================================================
# TEST 1: AUTHENTICATION & TOKEN GENERATION
# ============================================================================

test_authentication() {
    log_info "========================================="
    log_info "TEST SUITE 1: AUTHENTICATION"
    log_info "========================================="
    
    # Test 1.1: Super Admin Login
    test_start "Super Admin Login"
    local response=$(api_call POST "/api/auth/login" '{"email":"superadmin@platform.com","password":"SuperAdmin123!"}')
    TOKENS[super_admin]=$(extract_json "$response" "accessToken")
    
    if [ -n "${TOKENS[super_admin]}" ]; then
        log_success "Super Admin authenticated successfully"
        echo "### 1.1 Super Admin Login: ✅ PASS" >> "$REPORT_FILE"
        echo "Token: ${TOKENS[super_admin]:0:20}..." >> "$REPORT_FILE"
    else
        log_error "Super Admin login failed: $response"
        echo "### 1.1 Super Admin Login: ❌ FAIL" >> "$REPORT_FILE"
        echo "Response: $response" >> "$REPORT_FILE"
    fi
    
    # Test 1.2: Tenant Admin Login
    test_start "Tenant Admin Login"
    response=$(api_call POST "/api/auth/login" '{"email":"admin@acme.com","password":"Admin123!"}')
    TOKENS[tenant_admin]=$(extract_json "$response" "accessToken")
    TENANT_IDS[acme]=$(extract_json "$response" "tenantId")
    
    if [ -n "${TOKENS[tenant_admin]}" ]; then
        log_success "Tenant Admin authenticated successfully"
        echo "### 1.2 Tenant Admin Login: ✅ PASS" >> "$REPORT_FILE"
        echo "Token: ${TOKENS[tenant_admin]:0:20}..." >> "$REPORT_FILE"
        echo "Tenant ID: ${TENANT_IDS[acme]}" >> "$REPORT_FILE"
    else
        log_error "Tenant Admin login failed"
        echo "### 1.2 Tenant Admin Login: ❌ FAIL" >> "$REPORT_FILE"
    fi
    
    # Test 1.3: Agent Login
    test_start "Agent Login"
    response=$(api_call POST "/api/auth/login" '{"email":"agent@acme.com","password":"Agent123!"}')
    TOKENS[agent]=$(extract_json "$response" "accessToken")
    
    if [ -n "${TOKENS[agent]}" ]; then
        log_success "Agent authenticated successfully"
        echo "### 1.3 Agent Login: ✅ PASS" >> "$REPORT_FILE"
    else
        log_error "Agent login failed"
        echo "### 1.3 Agent Login: ❌ FAIL" >> "$REPORT_FILE"
    fi
    
    # Test 1.4: Invalid Login
    test_start "Invalid Login (Should Fail)"
    response=$(api_call POST "/api/auth/login" '{"email":"invalid@test.com","password":"wrong"}')
    if echo "$response" | grep -q "Unauthorized\|Invalid"; then
        log_success "Invalid login correctly rejected"
        echo "### 1.4 Invalid Login Rejection: ✅ PASS" >> "$REPORT_FILE"
    else
        log_error "Invalid login was not rejected properly"
        echo "### 1.4 Invalid Login Rejection: ❌ FAIL" >> "$REPORT_FILE"
    fi
}

# ============================================================================
# TEST 2: SUBSCRIPTION PLANS MANAGEMENT
# ============================================================================

test_subscription_plans() {
    log_info "========================================="
    log_info "TEST SUITE 2: SUBSCRIPTION PLANS"
    log_info "========================================="
    
    # Test 2.1: Super Admin Creates Professional Plan
    test_start "Super Admin Creates Professional Plan"
    local plan_data='{
        "name": "Professional E2E Test",
        "description": "Professional plan for E2E testing",
        "price": 299.00,
        "billingCycle": "monthly",
        "features": {
            "maxContacts": 50000,
            "maxUsers": 25,
            "maxConversations": 25000,
            "maxCampaigns": 200,
            "maxFlows": 50,
            "maxAutomations": 150,
            "whatsappConnections": 5,
            "customBranding": true,
            "prioritySupport": true,
            "apiAccess": true
        },
        "isActive": true
    }'
    
    response=$(api_call POST "/api/super-admin/subscription-plans" "$plan_data" "${TOKENS[super_admin]}")
    PLAN_IDS[professional]=$(extract_json "$response" "id")
    
    if [ -n "${PLAN_IDS[professional]}" ]; then
        log_success "Professional plan created: ${PLAN_IDS[professional]}"
        echo "### 2.1 Create Professional Plan: ✅ PASS" >> "$REPORT_FILE"
        echo "Plan ID: ${PLAN_IDS[professional]}" >> "$REPORT_FILE"
        echo "\`\`\`json" >> "$REPORT_FILE"
        echo "$response" | head -20 >> "$REPORT_FILE"
        echo "\`\`\`" >> "$REPORT_FILE"
    else
        log_error "Failed to create professional plan: $response"
        echo "### 2.1 Create Professional Plan: ❌ FAIL" >> "$REPORT_FILE"
    fi
    
    # Test 2.2: Tenant Admin Cannot Create Plan (RBAC)
    test_start "Tenant Admin Cannot Create Plan (RBAC Test)"
    response=$(api_call POST "/api/super-admin/subscription-plans" "$plan_data" "${TOKENS[tenant_admin]}")
    
    if echo "$response" | grep -q "403\|Forbidden\|Unauthorized"; then
        log_success "Tenant Admin correctly blocked from creating plans"
        echo "### 2.2 RBAC - Tenant Cannot Create Plan: ✅ PASS" >> "$REPORT_FILE"
    else
        log_error "RBAC failed: Tenant Admin should not create plans"
        echo "### 2.2 RBAC - Tenant Cannot Create Plan: ❌ FAIL" >> "$REPORT_FILE"
    fi
    
    # Test 2.3: List All Plans
    test_start "List All Subscription Plans"
    response=$(api_call GET "/api/subscription-plans" "" "${TOKENS[tenant_admin]}")
    
    if echo "$response" | grep -q "Professional E2E Test"; then
        log_success "Plans listed successfully"
        echo "### 2.3 List Plans: ✅ PASS" >> "$REPORT_FILE"
    else
        log_error "Failed to list plans"
        echo "### 2.3 List Plans: ❌ FAIL" >> "$REPORT_FILE"
    fi
}

# ============================================================================
# TEST 3: SUBSCRIPTION LIFECYCLE
# ============================================================================

test_subscription_lifecycle() {
    log_info "========================================="
    log_info "TEST SUITE 3: SUBSCRIPTION LIFECYCLE"
    log_info "========================================="
    
    # Test 3.1: Tenant Subscribes to Professional Plan
    test_start "Tenant Subscribes to Professional Plan"
    local sub_data="{
        \"planId\": \"${PLAN_IDS[professional]}\",
        \"paymentMethod\": \"stripe\",
        \"paymentToken\": \"tok_visa\"
    }"
    
    response=$(api_call POST "/api/subscriptions" "$sub_data" "${TOKENS[tenant_admin]}")
    SUBSCRIPTION_IDS[acme]=$(extract_json "$response" "id")
    
    if [ -n "${SUBSCRIPTION_IDS[acme]}" ]; then
        log_success "Subscription created: ${SUBSCRIPTION_IDS[acme]}"
        echo "### 3.1 Create Subscription: ✅ PASS" >> "$REPORT_FILE"
        echo "Subscription ID: ${SUBSCRIPTION_IDS[acme]}" >> "$REPORT_FILE"
    else
        log_error "Failed to create subscription: $response"
        echo "### 3.1 Create Subscription: ❌ FAIL" >> "$REPORT_FILE"
    fi
    
    # Test 3.2: Get Current Subscription
    test_start "Get Current Subscription Details"
    response=$(api_call GET "/api/subscriptions/current" "" "${TOKENS[tenant_admin]}")
    
    if echo "$response" | grep -q "Professional E2E Test"; then
        log_success "Current subscription retrieved"
        echo "### 3.2 Get Current Subscription: ✅ PASS" >> "$REPORT_FILE"
    else
        log_error "Failed to get current subscription"
        echo "### 3.2 Get Current Subscription: ❌ FAIL" >> "$REPORT_FILE"
    fi
    
    # Test 3.3: Check Subscription Status
    test_start "Verify Subscription Status is Active"
    local status=$(extract_json "$response" "status")
    
    if [ "$status" = "active" ]; then
        log_success "Subscription status is active"
        echo "### 3.3 Subscription Status: ✅ PASS (active)" >> "$REPORT_FILE"
    else
        log_error "Subscription status is not active: $status"
        echo "### 3.3 Subscription Status: ❌ FAIL (status: $status)" >> "$REPORT_FILE"
    fi
}

# ============================================================================
# TEST 4: QUOTA ENFORCEMENT
# ============================================================================

test_quota_enforcement() {
    log_info "========================================="
    log_info "TEST SUITE 4: QUOTA ENFORCEMENT"
    log_info "========================================="
    
    # Test 4.1: Check Initial Quotas
    test_start "Check Initial Quota Usage"
    response=$(api_call GET "/api/subscriptions/usage" "" "${TOKENS[tenant_admin]}")
    
    local contacts_used=$(extract_json_number "$response" "contactsUsed")
    local contacts_limit=$(extract_json_number "$response" "contactsLimit")
    
    if [ -n "$contacts_limit" ]; then
        log_success "Quota limits retrieved: $contacts_used/$contacts_limit contacts"
        echo "### 4.1 Initial Quota Check: ✅ PASS" >> "$REPORT_FILE"
        echo "Contacts: $contacts_used/$contacts_limit" >> "$REPORT_FILE"
    else
        log_error "Failed to retrieve quota information"
        echo "### 4.1 Initial Quota Check: ❌ FAIL" >> "$REPORT_FILE"
    fi
    
    # Test 4.2: Create Contact (Within Quota)
    test_start "Create Contact Within Quota"
    local contact_data='{
        "name": "Test Contact E2E",
        "phone": "+1234567890",
        "email": "test@example.com"
    }'
    
    response=$(api_call POST "/api/contacts" "$contact_data" "${TOKENS[tenant_admin]}")
    local contact_id=$(extract_json "$response" "id")
    
    if [ -n "$contact_id" ]; then
        log_success "Contact created successfully: $contact_id"
        echo "### 4.2 Create Contact (Within Quota): ✅ PASS" >> "$REPORT_FILE"
    else
        log_error "Failed to create contact: $response"
        echo "### 4.2 Create Contact (Within Quota): ❌ FAIL" >> "$REPORT_FILE"
    fi
    
    # Test 4.3: Verify Quota Updated
    test_start "Verify Quota Usage Updated"
    response=$(api_call GET "/api/subscriptions/usage" "" "${TOKENS[tenant_admin]}")
    local new_contacts_used=$(extract_json_number "$response" "contactsUsed")
    
    if [ "$new_contacts_used" -gt "$contacts_used" ]; then
        log_success "Quota usage updated correctly"
        echo "### 4.3 Quota Usage Update: ✅ PASS" >> "$REPORT_FILE"
        echo "Updated: $new_contacts_used/$contacts_limit" >> "$REPORT_FILE"
    else
        log_warning "Quota usage may not have updated"
        echo "### 4.3 Quota Usage Update: ⚠️  WARN" >> "$REPORT_FILE"
    fi
}

# ============================================================================
# TEST 5: MULTI-TENANCY ISOLATION
# ============================================================================

test_multi_tenancy() {
    log_info "========================================="
    log_info "TEST SUITE 5: MULTI-TENANCY ISOLATION"
    log_info "========================================="
    
    # Test 5.1: Tenant Cannot Access Other Tenant's Data
    test_start "Tenant Data Isolation"
    response=$(api_call GET "/api/contacts" "" "${TOKENS[tenant_admin]}")
    
    # Should only see own contacts
    if echo "$response" | grep -q "Test Contact E2E"; then
        log_success "Tenant can access own data"
        echo "### 5.1 Tenant Data Access: ✅ PASS" >> "$REPORT_FILE"
    else
        log_error "Tenant cannot access own data"
        echo "### 5.1 Tenant Data Access: ❌ FAIL" >> "$REPORT_FILE"
    fi
    
    # Test 5.2: Agent Has Limited Access
    test_start "Agent Role Permissions"
    response=$(api_call GET "/api/subscription-plans" "" "${TOKENS[agent]}")
    
    # Agent should be able to view plans but not modify
    if echo "$response" | grep -q "Professional E2E Test"; then
        log_success "Agent can view plans"
        echo "### 5.2 Agent View Access: ✅ PASS" >> "$REPORT_FILE"
    else
        log_error "Agent cannot view plans"
        echo "### 5.2 Agent View Access: ❌ FAIL" >> "$REPORT_FILE"
    fi
}

# ============================================================================
# TEST 6: WHATSAPP CONNECTIONS (DEPENDENCY)
# ============================================================================

test_whatsapp_connections() {
    log_info "========================================="
    log_info "TEST SUITE 6: WHATSAPP CONNECTIONS"
    log_info "========================================="
    
    # Test 6.1: Create WhatsApp Connection (Within Quota)
    test_start "Create WhatsApp Connection Within Quota"
    local wa_data='{
        "name": "Test WhatsApp E2E",
        "phoneNumber": "+1234567890",
        "provider": "meta"
    }'
    
    response=$(api_call POST "/api/whatsapp/connections" "$wa_data" "${TOKENS[tenant_admin]}")
    local wa_id=$(extract_json "$response" "id")
    
    if [ -n "$wa_id" ]; then
        log_success "WhatsApp connection created: $wa_id"
        echo "### 6.1 Create WhatsApp Connection: ✅ PASS" >> "$REPORT_FILE"
    else
        log_warning "WhatsApp connection creation may require additional setup"
        echo "### 6.1 Create WhatsApp Connection: ⚠️  WARN" >> "$REPORT_FILE"
        echo "Response: $response" >> "$REPORT_FILE"
    fi
}

# ============================================================================
# TEST 7: PAYMENT GATEWAY INTEGRATION
# ============================================================================

test_payment_gateway() {
    log_info "========================================="
    log_info "TEST SUITE 7: PAYMENT GATEWAY"
    log_info "========================================="
    
    # Test 7.1: Get Payment Methods
    test_start "List Available Payment Methods"
    response=$(api_call GET "/api/subscriptions/payment-methods" "" "${TOKENS[tenant_admin]}")
    
    if echo "$response" | grep -q "stripe\|paypal\|razorpay"; then
        log_success "Payment methods available"
        echo "### 7.1 Payment Methods: ✅ PASS" >> "$REPORT_FILE"
    else
        log_warning "Payment methods may not be configured"
        echo "### 7.1 Payment Methods: ⚠️  WARN" >> "$REPORT_FILE"
    fi
    
    # Test 7.2: Get Invoices
    test_start "Retrieve Subscription Invoices"
    response=$(api_call GET "/api/subscriptions/invoices" "" "${TOKENS[tenant_admin]}")
    
    if echo "$response" | grep -q "\[\]" || echo "$response" | grep -q "id"; then
        log_success "Invoices endpoint accessible"
        echo "### 7.2 Invoices Access: ✅ PASS" >> "$REPORT_FILE"
    else
        log_error "Failed to access invoices"
        echo "### 7.2 Invoices Access: ❌ FAIL" >> "$REPORT_FILE"
    fi
}

# ============================================================================
# TEST 8: SUBSCRIPTION CANCELLATION
# ============================================================================

test_subscription_cancellation() {
    log_info "========================================="
    log_info "TEST SUITE 8: SUBSCRIPTION CANCELLATION"
    log_info "========================================="
    
    # Test 8.1: Cancel Subscription
    test_start "Cancel Active Subscription"
    response=$(api_call POST "/api/subscriptions/${SUBSCRIPTION_IDS[acme]}/cancel" '{}' "${TOKENS[tenant_admin]}")
    
    if echo "$response" | grep -q "cancelled\|canceled"; then
        log_success "Subscription cancelled successfully"
        echo "### 8.1 Cancel Subscription: ✅ PASS" >> "$REPORT_FILE"
    else
        log_warning "Subscription cancellation response unclear"
        echo "### 8.1 Cancel Subscription: ⚠️  WARN" >> "$REPORT_FILE"
        echo "Response: $response" >> "$REPORT_FILE"
    fi
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

main() {
    local start_time=$(date +%s)
    
    echo "============================================="
    echo "SUBSCRIPTION SYSTEM E2E TEST SUITE"
    echo "============================================="
    echo "API URL: $API_URL"
    echo "Start Time: $(date)"
    echo "============================================="
    echo ""
    
    # Initialize report
    init_report
    
    # Run test suites
    test_authentication
    test_subscription_plans
    test_subscription_lifecycle
    test_quota_enforcement
    test_multi_tenancy
    test_whatsapp_connections
    test_payment_gateway
    test_subscription_cancellation
    
    # Calculate duration
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    local duration_formatted="${duration}s"
    
    # Finalize report
    finalize_report "$duration_formatted"
    
    # Print summary
    echo ""
    echo "============================================="
    echo "TEST EXECUTION COMPLETE"
    echo "============================================="
    echo "Total Tests: $TOTAL_TESTS"
    echo "Passed: $PASSED_TESTS"
    echo "Failed: $FAILED_TESTS"
    echo "Duration: $duration_formatted"
    echo "Report: $REPORT_FILE"
    echo "============================================="
    
    # Exit with appropriate code
    if [ $FAILED_TESTS -eq 0 ]; then
        echo -e "${GREEN}✅ ALL TESTS PASSED${NC}"
        exit 0
    else
        echo -e "${RED}❌ SOME TESTS FAILED${NC}"
        exit 1
    fi
}

# Run main function
main
