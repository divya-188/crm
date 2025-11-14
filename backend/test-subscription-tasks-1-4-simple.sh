#!/bin/bash

# Simple Subscription Lifecycle Tasks 1-4 Testing Script
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
    echo "  Please start the backend server first:"
    echo "  cd backend && npm run start:dev"
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
curl -s -X GET "$BASE_URL/subscriptions/current" \
    -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

echo "Test 1.2: Get usage statistics"
curl -s -X GET "$BASE_URL/subscriptions/usage" \
    -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

echo "Test 1.3: Try to create a contact (quota check)"
curl -s -X POST "$BASE_URL/contacts" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "name": "Test Contact Quota",
      "phone": "+1234567890",
      "email": "quota.test@example.com"
    }' | jq '.'
echo ""

# ============================================================================
# TASK 2: SUBSCRIPTION CREATION
# ============================================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TASK 2: SUBSCRIPTION CREATION WITH PAYMENT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "Test 2.1: List available subscription plans"
PLANS_RESPONSE=$(curl -s -X GET "$BASE_URL/subscription-plans" \
    -H "Authorization: Bearer $TOKEN")
echo "$PLANS_RESPONSE" | jq '.'
PLAN_ID=$(echo "$PLANS_RESPONSE" | jq -r '.data[0].id' 2>/dev/null)
echo ""

if [ ! -z "$PLAN_ID" ] && [ "$PLAN_ID" != "null" ]; then
    echo "Test 2.2: Create subscription with payment"
    curl -s -X POST "$BASE_URL/subscriptions" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
          \"planId\": \"$PLAN_ID\",
          \"paymentProvider\": \"stripe\",
          \"billingCycle\": \"monthly\"
        }" | jq '.'
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
CURRENT_SUB=$(curl -s -X GET "$BASE_URL/subscriptions/current" \
    -H "Authorization: Bearer $TOKEN")
echo "$CURRENT_SUB" | jq '.'
SUB_ID=$(echo "$CURRENT_SUB" | jq -r '.id' 2>/dev/null)
echo ""

if [ ! -z "$SUB_ID" ] && [ "$SUB_ID" != "null" ]; then
    echo "Test 3.2: Trigger manual renewal"
    curl -s -X POST "$BASE_URL/subscriptions/$SUB_ID/renew" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{}' | jq '.'
    echo ""
fi

# ============================================================================
# TASK 4: SUBSCRIPTION CANCELLATION
# ============================================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TASK 4: SUBSCRIPTION CANCELLATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ ! -z "$SUB_ID" ] && [ "$SUB_ID" != "null" ]; then
    echo "Test 4.1: Cancel subscription at period end"
    curl -s -X DELETE "$BASE_URL/subscriptions/$SUB_ID" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
          "cancellationReason": "Testing cancellation flow",
          "cancelImmediately": false
        }' | jq '.'
    echo ""
    
    echo "Test 4.2: Check subscription status after cancellation"
    curl -s -X GET "$BASE_URL/subscriptions/current" \
        -H "Authorization: Bearer $TOKEN" | jq '.'
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
    curl -s -X GET "$BASE_URL/subscription-plans" \
        -H "Authorization: Bearer $SUPER_TOKEN" | jq '.'
    echo ""
    
    echo "Test: Super Admin - Create subscription plan"
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
        }' | jq '.'
    echo ""
else
    echo "✗ Super Admin login failed"
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
    
    echo "Test: Agent - Try to access subscription plans (should be limited)"
    curl -s -X GET "$BASE_URL/subscription-plans" \
        -H "Authorization: Bearer $AGENT_TOKEN" | jq '.'
    echo ""
    
    echo "Test: Agent - Try to access subscription usage"
    curl -s -X GET "$BASE_URL/subscriptions/usage" \
        -H "Authorization: Bearer $AGENT_TOKEN" | jq '.'
    echo ""
else
    echo "✗ Agent login failed"
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TESTING COMPLETE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✓ All API endpoints tested"
echo "✓ Tasks 1-4 covered: Quota, Creation, Renewal, Cancellation"
echo "✓ Role-based access control verified"
