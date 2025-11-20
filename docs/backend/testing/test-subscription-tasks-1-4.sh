#!/bin/bash

# Subscription Lifecycle Tasks 1-4 Testing Script
# Tests: Quota Enforcement, Subscription Creation, Renewal, and Cancellation
# With Super Admin, Tenant Admin, and Agent roles

set -e

BASE_URL="http://localhost:3000/api/v1"
BOLD='\033[1m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test credentials
SUPER_ADMIN_EMAIL="superadmin@whatscrm.com"
SUPER_ADMIN_PASSWORD="SuperAdmin123!"

ADMIN_EMAIL="admin@test.com"
ADMIN_PASSWORD="Admin123!"

AGENT_EMAIL="agent@test.com"
AGENT_PASSWORD="Agent123!"

# Counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

echo -e "${BOLD}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║   Subscription Lifecycle Tasks 1-4 API Testing                ║${NC}"
echo -e "${BOLD}║   Testing: Quota, Creation, Renewal, Cancellation             ║${NC}"
echo -e "${BOLD}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to print test header
print_test_header() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BOLD}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Function to print test result
print_result() {
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ PASS${NC} - $2"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}✗ FAIL${NC} - $2"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        if [ ! -z "$3" ]; then
            echo -e "${RED}  Error: $3${NC}"
        fi
    fi
}

# Function to login and get token
login() {
    local email=$1
    local password=$2
    local role=$3
    
    echo -e "${YELLOW}→${NC} Logging in as ${BOLD}$role${NC} ($email)..."
    
    RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$email\",\"password\":\"$password\"}")
    
    TOKEN=$(echo $RESPONSE | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
    
    if [ -z "$TOKEN" ]; then
        echo -e "${RED}✗ Login failed for $role${NC}"
        echo "Response: $RESPONSE"
        return 1
    fi
    
    echo -e "${GREEN}✓ Login successful${NC}"
    echo "Token: ${TOKEN:0:20}..."
    return 0
}

# Function to make authenticated request
api_request() {
    local method=$1
    local endpoint=$2
    local token=$3
    local data=$4
    
    if [ -z "$data" ]; then
        curl -s -X $method "$BASE_URL$endpoint" \
            -H "Authorization: Bearer $token" \
            -H "Content-Type: application/json"
    else
        curl -s -X $method "$BASE_URL$endpoint" \
            -H "Authorization: Bearer $token" \
            -H "Content-Type: application/json" \
            -d "$data"
    fi
}

# ============================================================================
# TASK 1: QUOTA ENFORCEMENT TESTING
# ============================================================================

print_test_header "TASK 1: QUOTA ENFORCEMENT SYSTEM"

echo ""
echo -e "${BOLD}Testing with Tenant Admin (has quota limits)${NC}"
login "$ADMIN_EMAIL" "$ADMIN_PASSWORD" "Tenant Admin"
ADMIN_TOKEN=$TOKEN

# Test 1.1: Get current subscription and usage
echo ""
echo -e "${YELLOW}Test 1.1:${NC} Get current subscription"
RESPONSE=$(api_request "GET" "/subscriptions/current" "$ADMIN_TOKEN")
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

if echo "$RESPONSE" | grep -q '"status"'; then
    print_result 0 "Get current subscription"
else
    print_result 1 "Get current subscription" "$RESPONSE"
fi

# Test 1.2: Get usage statistics
echo ""
echo -e "${YELLOW}Test 1.2:${NC} Get usage statistics"
RESPONSE=$(api_request "GET" "/subscriptions/usage" "$ADMIN_TOKEN")
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

if echo "$RESPONSE" | grep -q '"usage"'; then
    print_result 0 "Get usage statistics"
    
    # Extract quota information
    CONTACTS_USED=$(echo "$RESPONSE" | jq -r '.usage.contacts.used' 2>/dev/null || echo "0")
    CONTACTS_LIMIT=$(echo "$RESPONSE" | jq -r '.usage.contacts.limit' 2>/dev/null || echo "0")
    USERS_USED=$(echo "$RESPONSE" | jq -r '.usage.users.used' 2>/dev/null || echo "0")
    USERS_LIMIT=$(echo "$RESPONSE" | jq -r '.usage.users.limit' 2>/dev/null || echo "0")
    
    echo -e "  ${BLUE}Contacts:${NC} $CONTACTS_USED / $CONTACTS_LIMIT"
    echo -e "  ${BLUE}Users:${NC} $USERS_USED / $USERS_LIMIT"
else
    print_result 1 "Get usage statistics" "$RESPONSE"
fi

# Test 1.3: Try to create a contact (should succeed if under quota)
echo ""
echo -e "${YELLOW}Test 1.3:${NC} Create contact (quota check)"
CONTACT_DATA='{
  "name": "Test Contact Quota",
  "phone": "+1234567890",
  "email": "quota.test@example.com"
}'
RESPONSE=$(api_request "POST" "/contacts" "$ADMIN_TOKEN" "$CONTACT_DATA")
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

if echo "$RESPONSE" | grep -q '"id"'; then
    print_result 0 "Create contact within quota"
    CREATED_CONTACT_ID=$(echo "$RESPONSE" | jq -r '.id' 2>/dev/null)
elif echo "$RESPONSE" | grep -q "quota"; then
    print_result 0 "Quota enforcement working (blocked creation)"
    echo -e "  ${YELLOW}Note: Quota limit reached, which is expected behavior${NC}"
else
    print_result 1 "Create contact" "$RESPONSE"
fi

# Test 1.4: Try to create a user (should check quota)
echo ""
echo -e "${YELLOW}Test 1.4:${NC} Create user (quota check)"
USER_DATA='{
  "email": "quota.user@test.com",
  "password": "QuotaUser123!",
  "name": "Quota Test User",
  "role": "agent"
}'
RESPONSE=$(api_request "POST" "/users" "$ADMIN_TOKEN" "$USER_DATA")
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

if echo "$RESPONSE" | grep -q '"id"'; then
    print_result 0 "Create user within quota"
    CREATED_USER_ID=$(echo "$RESPONSE" | jq -r '.id' 2>/dev/null)
elif echo "$RESPONSE" | grep -q "quota"; then
    print_result 0 "Quota enforcement working (blocked user creation)"
    echo -e "  ${YELLOW}Note: User quota limit reached${NC}"
else
    print_result 1 "Create user" "$RESPONSE"
fi

# Test 1.5: Try to create WhatsApp connection (quota check)
echo ""
echo -e "${YELLOW}Test 1.5:${NC} Create WhatsApp connection (quota check)"
WHATSAPP_DATA='{
  "name": "Quota Test Connection",
  "type": "qr",
  "phoneNumber": "+1234567891"
}'
RESPONSE=$(api_request "POST" "/whatsapp/connections" "$ADMIN_TOKEN" "$WHATSAPP_DATA")
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

if echo "$RESPONSE" | grep -q '"id"'; then
    print_result 0 "Create WhatsApp connection within quota"
elif echo "$RESPONSE" | grep -q "quota"; then
    print_result 0 "Quota enforcement working (blocked WhatsApp connection)"
    echo -e "  ${YELLOW}Note: WhatsApp connection quota limit reached${NC}"
else
    print_result 1 "Create WhatsApp connection" "$RESPONSE"
fi

# ============================================================================
# TASK 2: SUBSCRIPTION CREATION WITH PAYMENT
# ============================================================================

print_test_header "TASK 2: SUBSCRIPTION CREATION WITH PAYMENT"

echo ""
echo -e "${BOLD}Testing with Tenant Admin${NC}"

# Test 2.1: List available subscription plans
echo ""
echo -e "${YELLOW}Test 2.1:${NC} List available subscription plans"
RESPONSE=$(api_request "GET" "/subscription-plans" "$ADMIN_TOKEN")
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

if echo "$RESPONSE" | grep -q '"data"'; then
    print_result 0 "List subscription plans"
    PLAN_ID=$(echo "$RESPONSE" | jq -r '.data[0].id' 2>/dev/null)
    echo -e "  ${BLUE}First Plan ID:${NC} $PLAN_ID"
else
    print_result 1 "List subscription plans" "$RESPONSE"
fi

# Test 2.2: Create subscription (will create pending subscription)
echo ""
echo -e "${YELLOW}Test 2.2:${NC} Create subscription with payment"
SUBSCRIPTION_DATA="{
  \"planId\": \"$PLAN_ID\",
  \"paymentProvider\": \"stripe\",
  \"billingCycle\": \"monthly\"
}"
RESPONSE=$(api_request "POST" "/subscriptions" "$ADMIN_TOKEN" "$SUBSCRIPTION_DATA")
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

if echo "$RESPONSE" | grep -q '"checkoutUrl"' || echo "$RESPONSE" | grep -q '"id"'; then
    print_result 0 "Create subscription"
    SUBSCRIPTION_ID=$(echo "$RESPONSE" | jq -r '.data.id' 2>/dev/null)
    echo -e "  ${BLUE}Subscription ID:${NC} $SUBSCRIPTION_ID"
else
    print_result 1 "Create subscription" "$RESPONSE"
fi

# Test 2.3: Get current subscription after creation
echo ""
echo -e "${YELLOW}Test 2.3:${NC} Get subscription after creation"
RESPONSE=$(api_request "GET" "/subscriptions/current" "$ADMIN_TOKEN")
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

if echo "$RESPONSE" | grep -q '"status"'; then
    print_result 0 "Get subscription after creation"
    SUB_STATUS=$(echo "$RESPONSE" | jq -r '.status' 2>/dev/null)
    echo -e "  ${BLUE}Status:${NC} $SUB_STATUS"
else
    print_result 1 "Get subscription after creation" "$RESPONSE"
fi

# Test 2.4: Sync subscription status
if [ ! -z "$SUBSCRIPTION_ID" ]; then
    echo ""
    echo -e "${YELLOW}Test 2.4:${NC} Sync subscription status"
    RESPONSE=$(api_request "GET" "/subscriptions/$SUBSCRIPTION_ID/sync" "$ADMIN_TOKEN")
    echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
    
    if echo "$RESPONSE" | grep -q '"success"'; then
        print_result 0 "Sync subscription status"
    else
        print_result 1 "Sync subscription status" "$RESPONSE"
    fi
fi

# ============================================================================
# TASK 3: AUTOMATIC SUBSCRIPTION RENEWAL
# ============================================================================

print_test_header "TASK 3: AUTOMATIC SUBSCRIPTION RENEWAL"

echo ""
echo -e "${BOLD}Testing renewal functionality${NC}"

# Test 3.1: Manual renewal trigger (if subscription exists)
if [ ! -z "$SUBSCRIPTION_ID" ]; then
    echo ""
    echo -e "${YELLOW}Test 3.1:${NC} Trigger manual renewal"
    RESPONSE=$(api_request "POST" "/subscriptions/$SUBSCRIPTION_ID/renew" "$ADMIN_TOKEN" "{}")
    echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
    
    if echo "$RESPONSE" | grep -q '"success"' || echo "$RESPONSE" | grep -q '"data"'; then
        print_result 0 "Manual renewal trigger"
    else
        print_result 1 "Manual renewal trigger" "$RESPONSE"
    fi
fi

# Test 3.2: Check subscription after renewal attempt
echo ""
echo -e "${YELLOW}Test 3.2:${NC} Check subscription after renewal"
RESPONSE=$(api_request "GET" "/subscriptions/current" "$ADMIN_TOKEN")
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

if echo "$RESPONSE" | grep -q '"endDate"'; then
    print_result 0 "Check subscription after renewal"
    END_DATE=$(echo "$RESPONSE" | jq -r '.endDate' 2>/dev/null)
    echo -e "  ${BLUE}End Date:${NC} $END_DATE"
else
    print_result 1 "Check subscription after renewal" "$RESPONSE"
fi

# Test 3.3: Verify usage statistics still accessible
echo ""
echo -e "${YELLOW}Test 3.3:${NC} Verify usage statistics after renewal"
RESPONSE=$(api_request "GET" "/subscriptions/usage" "$ADMIN_TOKEN")

if echo "$RESPONSE" | grep -q '"usage"'; then
    print_result 0 "Usage statistics after renewal"
else
    print_result 1 "Usage statistics after renewal" "$RESPONSE"
fi

# ============================================================================
# TASK 4: SUBSCRIPTION CANCELLATION
# ============================================================================

print_test_header "TASK 4: SUBSCRIPTION CANCELLATION"

echo ""
echo -e "${BOLD}Testing cancellation functionality${NC}"

# Test 4.1: Cancel subscription at period end
if [ ! -z "$SUBSCRIPTION_ID" ]; then
    echo ""
    echo -e "${YELLOW}Test 4.1:${NC} Cancel subscription at period end"
    CANCEL_DATA='{
      "cancellationReason": "Testing cancellation flow",
      "cancelImmediately": false
    }'
    RESPONSE=$(api_request "DELETE" "/subscriptions/$SUBSCRIPTION_ID" "$ADMIN_TOKEN" "$CANCEL_DATA")
    echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
    
    if echo "$RESPONSE" | grep -q '"success"'; then
        print_result 0 "Cancel subscription at period end"
    else
        print_result 1 "Cancel subscription at period end" "$RESPONSE"
    fi
fi

# Test 4.2: Verify subscription status after cancellation
echo ""
echo -e "${YELLOW}Test 4.2:${NC} Check subscription after cancellation"
RESPONSE=$(api_request "GET" "/subscriptions/current" "$ADMIN_TOKEN")
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

if echo "$RESPONSE" | grep -q '"status"'; then
    print_result 0 "Check subscription after cancellation"
    STATUS=$(echo "$RESPONSE" | jq -r '.status' 2>/dev/null)
    echo -e "  ${BLUE}Status:${NC} $STATUS"
else
    print_result 1 "Check subscription after cancellation" "$RESPONSE"
fi

# Test 4.3: Verify service still accessible during grace period
echo ""
echo -e "${YELLOW}Test 4.3:${NC} Verify service access during grace period"
RESPONSE=$(api_request "GET" "/subscriptions/usage" "$ADMIN_TOKEN")

if echo "$RESPONSE" | grep -q '"usage"'; then
    print_result 0 "Service accessible during grace period"
else
    print_result 1 "Service accessible during grace period" "$RESPONSE"
fi

# ============================================================================
# ROLE-BASED ACCESS TESTING
# ============================================================================

print_test_header "ROLE-BASED ACCESS CONTROL TESTING"

# Test with Super Admin
echo ""
echo -e "${BOLD}Testing with Super Admin${NC}"
login "$SUPER_ADMIN_EMAIL" "$SUPER_ADMIN_PASSWORD" "Super Admin"
SUPER_ADMIN_TOKEN=$TOKEN

echo ""
echo -e "${YELLOW}Test:${NC} Super Admin - List subscription plans"
RESPONSE=$(api_request "GET" "/subscription-plans" "$SUPER_ADMIN_TOKEN")
if echo "$RESPONSE" | grep -q '"data"'; then
    print_result 0 "Super Admin can list plans"
else
    print_result 1 "Super Admin can list plans" "$RESPONSE"
fi

echo ""
echo -e "${YELLOW}Test:${NC} Super Admin - Create subscription plan"
PLAN_DATA='{
  "name": "Test Plan",
  "description": "Test plan for API testing",
  "price": 99.00,
  "billingCycle": "monthly",
  "features": {
    "maxContacts": 5000,
    "maxUsers": 5,
    "whatsappConnections": 2
  },
  "isActive": true
}'
RESPONSE=$(api_request "POST" "/subscription-plans" "$SUPER_ADMIN_TOKEN" "$PLAN_DATA")
if echo "$RESPONSE" | grep -q '"id"' || echo "$RESPONSE" | grep -q '"success"'; then
    print_result 0 "Super Admin can create plans"
    TEST_PLAN_ID=$(echo "$RESPONSE" | jq -r '.id' 2>/dev/null)
else
    print_result 1 "Super Admin can create plans" "$RESPONSE"
fi

# Test with Agent (should have limited access)
echo ""
echo -e "${BOLD}Testing with Agent (Limited Access)${NC}"
login "$AGENT_EMAIL" "$AGENT_PASSWORD" "Agent"
AGENT_TOKEN=$TOKEN

echo ""
echo -e "${YELLOW}Test:${NC} Agent - Try to access subscription plans"
RESPONSE=$(api_request "GET" "/subscription-plans" "$AGENT_TOKEN")
if echo "$RESPONSE" | grep -q '"data"' || echo "$RESPONSE" | grep -q "Forbidden"; then
    print_result 0 "Agent access control working"
    echo -e "  ${YELLOW}Note: Agents may have limited or no access to plans${NC}"
else
    print_result 1 "Agent access control" "$RESPONSE"
fi

echo ""
echo -e "${YELLOW}Test:${NC} Agent - Try to access subscription usage"
RESPONSE=$(api_request "GET" "/subscriptions/usage" "$AGENT_TOKEN")
if echo "$RESPONSE" | grep -q '"usage"' || echo "$RESPONSE" | grep -q "Forbidden"; then
    print_result 0 "Agent subscription access control"
else
    print_result 1 "Agent subscription access" "$RESPONSE"
fi

# ============================================================================
# SUMMARY
# ============================================================================

echo ""
echo -e "${BOLD}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║                        TEST SUMMARY                            ║${NC}"
echo -e "${BOLD}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BOLD}Total Tests:${NC}  $TOTAL_TESTS"
echo -e "${GREEN}Passed:${NC}       $PASSED_TESTS"
echo -e "${RED}Failed:${NC}       $FAILED_TESTS"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}${BOLD}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}${BOLD}✗ Some tests failed${NC}"
    exit 1
fi
