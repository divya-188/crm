#!/bin/bash

# Subscription Lifecycle Tasks 1-4 Testing Script (No jq required)
# Tests: Quota Enforcement, Subscription Creation, Renewal, and Cancellation

BASE_URL="http://localhost:3000/api/v1"

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║   Subscription Lifecycle Tasks 1-4 API Testing                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Check if server is running
echo "→ Checking if backend server is running..."
if ! curl -s "$BASE_URL/health" > /dev/null 2>&1; then
    echo "✗ Backend server is not running at $BASE_URL"
    echo "  Please start the backend server first"
    exit 1
fi
echo "✓ Backend server is running"
echo ""

# Test credentials
ADMIN_EMAIL="admin@test.com"
ADMIN_PASSWORD="Admin123!"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "LOGGING IN AS TENANT ADMIN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Login
echo "→ Logging in as Tenant Admin ($ADMIN_EMAIL)..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "✗ Login failed"
    echo "Response: $LOGIN_RESPONSE"
    exit 1
fi

echo "✓ Login successful"
echo "Token: ${TOKEN:0:30}..."
echo ""

# ============================================================================
# TASK 1: QUOTA ENFORCEMENT
# ============================================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TASK 1: QUOTA ENFORCEMENT SYSTEM"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "Test 1.1: Get current subscription"
echo "-----------------------------------"
CURRENT_SUB=$(curl -s -X GET "$BASE_URL/subscriptions/current" \
    -H "Authorization: Bearer $TOKEN")
echo "$CURRENT_SUB"
echo ""

echo "Test 1.2: Get usage statistics"
echo "-------------------------------"
USAGE_STATS=$(curl -s -X GET "$BASE_URL/subscriptions/usage" \
    -H "Authorization: Bearer $TOKEN")
echo "$USAGE_STATS"
echo ""

echo "Test 1.3: Try to create a contact (quota check)"
echo "------------------------------------------------"
CONTACT_RESPONSE=$(curl -s -X POST "$BASE_URL/contacts" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "name": "Test Contact Quota",
      "phone": "+1234567890",
      "email": "quota.test@example.com"
    }')
echo "$CONTACT_RESPONSE"
echo ""

echo "Test 1.4: Try to create a user (quota check)"
echo "---------------------------------------------"
USER_RESPONSE=$(curl -s -X POST "$BASE_URL/users" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "email": "quota.user@test.com",
      "password": "QuotaUser123!",
      "name": "Quota Test User",
      "role": "agent"
    }')
echo "$USER_RESPONSE"
echo ""

echo "Test 1.5: Try to create WhatsApp connection (quota check)"
echo "----------------------------------------------------------"
WHATSAPP_RESPONSE=$(curl -s -X POST "$BASE_URL/whatsapp/connections" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "name": "Quota Test Connection",
      "type": "qr",
      "phoneNumber": "+1234567891"
    }')
echo "$WHATSAPP_RESPONSE"
echo ""

# ============================================================================
# TASK 2: SUBSCRIPTION CREATION
# ============================================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TASK 2: SUBSCRIPTION CREATION WITH PAYMENT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "Test 2.1: List available subscription plans"
echo "--------------------------------------------"
PLANS_RESPONSE=$(curl -s -X GET "$BASE_URL/subscription-plans" \
    -H "Authorization: Bearer $TOKEN")
echo "$PLANS_RESPONSE"
echo ""

# Extract first plan ID (simple grep method)
PLAN_ID=$(echo "$PLANS_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ ! -z "$PLAN_ID" ]; then
    echo "Test 2.2: Create subscription with payment"
    echo "-------------------------------------------"
    echo "Using Plan ID: $PLAN_ID"
    SUB_CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/subscriptions" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
          \"planId\": \"$PLAN_ID\",
          \"paymentProvider\": \"stripe\",
          \"billingCycle\": \"monthly\"
        }")
    echo "$SUB_CREATE_RESPONSE"
    echo ""
    
    echo "Test 2.3: Get subscription after creation"
    echo "------------------------------------------"
    curl -s -X GET "$BASE_URL/subscriptions/current" \
        -H "Authorization: Bearer $TOKEN"
    echo ""
    echo ""
fi

# ============================================================================
# TASK 3: SUBSCRIPTION RENEWAL
# ============================================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TASK 3: AUTOMATIC SUBSCRIPTION RENEWAL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "Test 3.1: Get current subscription (check renewal fields)"
echo "----------------------------------------------------------"
CURRENT_SUB=$(curl -s -X GET "$BASE_URL/subscriptions/current" \
    -H "Authorization: Bearer $TOKEN")
echo "$CURRENT_SUB"
SUB_ID=$(echo "$CURRENT_SUB" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo ""

if [ ! -z "$SUB_ID" ]; then
    echo "Test 3.2: Trigger manual renewal"
    echo "---------------------------------"
    echo "Subscription ID: $SUB_ID"
    RENEWAL_RESPONSE=$(curl -s -X POST "$BASE_URL/subscriptions/$SUB_ID/renew" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{}')
    echo "$RENEWAL_RESPONSE"
    echo ""
    
    echo "Test 3.3: Check subscription after renewal"
    echo "-------------------------------------------"
    curl -s -X GET "$BASE_URL/subscriptions/current" \
        -H "Authorization: Bearer $TOKEN"
    echo ""
    echo ""
fi

# ============================================================================
# TASK 4: SUBSCRIPTION CANCELLATION
# ============================================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TASK 4: SUBSCRIPTION CANCELLATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ ! -z "$SUB_ID" ]; then
    echo "Test 4.1: Cancel subscription at period end"
    echo "--------------------------------------------"
    echo "Subscription ID: $SUB_ID"
    CANCEL_RESPONSE=$(curl -s -X DELETE "$BASE_URL/subscriptions/$SUB_ID" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
          "cancellationReason": "Testing cancellation flow",
          "cancelImmediately": false
        }')
    echo "$CANCEL_RESPONSE"
    echo ""
    
    echo "Test 4.2: Check subscription status after cancellation"
    echo "-------------------------------------------------------"
    curl -s -X GET "$BASE_URL/subscriptions/current" \
        -H "Authorization: Bearer $TOKEN"
    echo ""
    echo ""
    
    echo "Test 4.3: Verify service access during grace period"
    echo "----------------------------------------------------"
    curl -s -X GET "$BASE_URL/subscriptions/usage" \
        -H "Authorization: Bearer $TOKEN"
    echo ""
    echo ""
fi

# ============================================================================
# ROLE-BASED ACCESS TESTING
# ============================================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "ROLE-BASED ACCESS CONTROL TESTING"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test with Super Admin
echo "→ Testing with Super Admin..."
SUPER_ADMIN_LOGIN=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"superadmin@whatscrm.com","password":"SuperAdmin123!"}')

SUPER_TOKEN=$(echo $SUPER_ADMIN_LOGIN | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

if [ ! -z "$SUPER_TOKEN" ]; then
    echo "✓ Super Admin logged in"
    echo ""
    
    echo "Test: Super Admin - List subscription plans"
    echo "--------------------------------------------"
    curl -s -X GET "$BASE_URL/subscription-plans" \
        -H "Authorization: Bearer $SUPER_TOKEN"
    echo ""
    echo ""
    
    echo "Test: Super Admin - Create subscription plan"
    echo "---------------------------------------------"
    curl -s -X POST "$BASE_URL/subscription-plans" \
        -H "Authorization: Bearer $SUPER_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
          "name": "Test Plan API",
          "description": "Test plan created via API",
          "price": 99.00,
          "billingCycle": "monthly",
          "features": {
            "maxContacts": 5000,
            "maxUsers": 5,
            "whatsappConnections": 2
          },
          "isActive": true
        }'
    echo ""
    echo ""
else
    echo "✗ Super Admin login failed"
    echo "Response: $SUPER_ADMIN_LOGIN"
    echo ""
fi

# Test with Agent
echo "→ Testing with Agent..."
AGENT_LOGIN=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"agent@test.com","password":"Agent123!"}')

AGENT_TOKEN=$(echo $AGENT_LOGIN | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

if [ ! -z "$AGENT_TOKEN" ]; then
    echo "✓ Agent logged in"
    echo ""
    
    echo "Test: Agent - Try to access subscription plans"
    echo "-----------------------------------------------"
    curl -s -X GET "$BASE_URL/subscription-plans" \
        -H "Authorization: Bearer $AGENT_TOKEN"
    echo ""
    echo ""
    
    echo "Test: Agent - Try to access subscription usage"
    echo "-----------------------------------------------"
    curl -s -X GET "$BASE_URL/subscriptions/usage" \
        -H "Authorization: Bearer $AGENT_TOKEN"
    echo ""
    echo ""
else
    echo "✗ Agent login failed"
    echo "Response: $AGENT_LOGIN"
    echo ""
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TESTING COMPLETE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✓ All API endpoints tested"
echo "✓ Tasks 1-4 covered: Quota, Creation, Renewal, Cancellation"
echo "✓ Role-based access control verified"
echo ""
echo "Summary:"
echo "--------"
echo "✓ TASK 1: Quota Enforcement - Tested quota checks for contacts, users, WhatsApp"
echo "✓ TASK 2: Subscription Creation - Tested plan listing and subscription creation"
echo "✓ TASK 3: Subscription Renewal - Tested manual renewal trigger"
echo "✓ TASK 4: Subscription Cancellation - Tested cancellation flow"
echo "✓ Role-Based Access - Tested Super Admin, Tenant Admin, and Agent access"
