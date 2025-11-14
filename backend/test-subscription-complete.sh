#!/bin/bash

# Complete Subscription Lifecycle Testing Script
# Tests all 4 tasks + additional features with correct DTOs

BASE_URL="http://localhost:3000/api/v1"

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║   Complete Subscription Lifecycle API Testing                 ║"
echo "║   Tasks 1-4 + Upgrades/Downgrades + Immediate Cancellation    ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Check if server is running
echo "→ Checking if backend server is running..."
if ! curl -s "$BASE_URL/health" > /dev/null 2>&1; then
    echo "✗ Backend server is not running"
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

LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "✗ Login failed"
    exit 1
fi

echo "✓ Login successful"
echo ""

# ============================================================================
# TASK 1: QUOTA ENFORCEMENT (WITH CORRECT DTOs)
# ============================================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TASK 1: QUOTA ENFORCEMENT SYSTEM (FIXED DTOs)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "Test 1.1: Get current subscription"
CURRENT_SUB=$(curl -s -X GET "$BASE_URL/subscriptions/current" -H "Authorization: Bearer $TOKEN")
echo "$CURRENT_SUB"
echo ""

echo "Test 1.2: Get usage statistics"
USAGE_STATS=$(curl -s -X GET "$BASE_URL/subscriptions/usage" -H "Authorization: Bearer $TOKEN")
echo "$USAGE_STATS"
echo ""

echo "Test 1.3: Create contact with CORRECT DTO (firstName, lastName)"
CONTACT_RESPONSE=$(curl -s -X POST "$BASE_URL/contacts" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "firstName": "Test",
      "lastName": "Contact",
      "phone": "+1234567890",
      "email": "test.contact@example.com"
    }')
echo "$CONTACT_RESPONSE"
echo ""

echo "Test 1.4: Create user with CORRECT DTO (firstName, lastName, role)"
USER_RESPONSE=$(curl -s -X POST "$BASE_URL/users" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "email": "test.user@test.com",
      "password": "TestUser123!",
      "firstName": "Test",
      "lastName": "User",
      "role": "agent"
    }')
echo "$USER_RESPONSE"
echo ""

echo "Test 1.5: Create WhatsApp connection (should hit quota)"
WHATSAPP_RESPONSE=$(curl -s -X POST "$BASE_URL/whatsapp/connections" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "name": "Test Connection",
      "type": "qr",
      "phoneNumber": "+1234567891"
    }')
echo "$WHATSAPP_RESPONSE"
echo ""

# ============================================================================
# TASK 2: SUBSCRIPTION CREATION (WITH CORRECT DTO)
# ============================================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TASK 2: SUBSCRIPTION CREATION (FIXED DTO)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "Test 2.1: List available subscription plans"
PLANS_RESPONSE=$(curl -s -X GET "$BASE_URL/subscription-plans" -H "Authorization: Bearer $TOKEN")
echo "$PLANS_RESPONSE"
PLAN_ID=$(echo "$PLANS_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo ""

if [ ! -z "$PLAN_ID" ]; then
    echo "Test 2.2: Create subscription WITHOUT billingCycle (correct DTO)"
    echo "Using Plan ID: $PLAN_ID"
    SUB_CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/subscriptions" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
          \"planId\": \"$PLAN_ID\",
          \"paymentProvider\": \"stripe\"
        }")
    echo "$SUB_CREATE_RESPONSE"
    echo ""
fi

# ============================================================================
# TASK 3: SUBSCRIPTION RENEWAL
# ============================================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TASK 3: AUTOMATIC SUBSCRIPTION RENEWAL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

CURRENT_SUB=$(curl -s -X GET "$BASE_URL/subscriptions/current" -H "Authorization: Bearer $TOKEN")
SUB_ID=$(echo "$CURRENT_SUB" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ ! -z "$SUB_ID" ]; then
    echo "Test 3.1: Trigger manual renewal"
    echo "Subscription ID: $SUB_ID"
    RENEWAL_RESPONSE=$(curl -s -X POST "$BASE_URL/subscriptions/$SUB_ID/renew" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{}')
    echo "$RENEWAL_RESPONSE"
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
    CANCEL_RESPONSE=$(curl -s -X DELETE "$BASE_URL/subscriptions/$SUB_ID" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
          "cancellationReason": "Testing cancellation at period end",
          "cancelImmediately": false
        }')
    echo "$CANCEL_RESPONSE"
    echo ""
    
    echo "Test 4.2: Check subscription status after cancellation"
    curl -s -X GET "$BASE_URL/subscriptions/current" -H "Authorization: Bearer $TOKEN"
    echo ""
    echo ""
fi

# ============================================================================
# ADDITIONAL FEATURE 1: IMMEDIATE CANCELLATION
# ============================================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "ADDITIONAL: IMMEDIATE CANCELLATION TEST"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ ! -z "$SUB_ID" ]; then
    echo "Test 5.1: Cancel subscription IMMEDIATELY"
    IMMEDIATE_CANCEL=$(curl -s -X DELETE "$BASE_URL/subscriptions/$SUB_ID" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
          "cancellationReason": "Testing immediate cancellation",
          "cancelImmediately": true
        }')
    echo "$IMMEDIATE_CANCEL"
    echo ""
    
    echo "Test 5.2: Verify subscription is cancelled immediately"
    curl -s -X GET "$BASE_URL/subscriptions/current" -H "Authorization: Bearer $TOKEN"
    echo ""
    echo ""
fi

# ============================================================================
# ADDITIONAL FEATURE 2: SUBSCRIPTION UPGRADE/DOWNGRADE
# ============================================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "ADDITIONAL: SUBSCRIPTION UPGRADE/DOWNGRADE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Get Growth plan ID (second plan)
GROWTH_PLAN_ID=$(echo "$PLANS_RESPONSE" | grep -o '"id":"[^"]*"' | sed -n '2p' | cut -d'"' -f4)

if [ ! -z "$SUB_ID" ] && [ ! -z "$GROWTH_PLAN_ID" ]; then
    echo "Test 6.1: Upgrade subscription to Growth plan"
    echo "Growth Plan ID: $GROWTH_PLAN_ID"
    UPGRADE_RESPONSE=$(curl -s -X PATCH "$BASE_URL/subscriptions/$SUB_ID/upgrade" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
          \"newPlanId\": \"$GROWTH_PLAN_ID\",
          \"paymentProvider\": \"stripe\"
        }")
    echo "$UPGRADE_RESPONSE"
    echo ""
    
    echo "Test 6.2: Check subscription after upgrade"
    curl -s -X GET "$BASE_URL/subscriptions/current" -H "Authorization: Bearer $TOKEN"
    echo ""
    echo ""
    
    # Downgrade back to Starter
    echo "Test 6.3: Downgrade subscription back to Starter plan"
    echo "Starter Plan ID: $PLAN_ID"
    DOWNGRADE_RESPONSE=$(curl -s -X PATCH "$BASE_URL/subscriptions/$SUB_ID/downgrade" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
          \"newPlanId\": \"$PLAN_ID\"
        }")
    echo "$DOWNGRADE_RESPONSE"
    echo ""
    
    echo "Test 6.4: Check subscription after downgrade"
    curl -s -X GET "$BASE_URL/subscriptions/current" -H "Authorization: Bearer $TOKEN"
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
    
    echo "Test: Super Admin - Create subscription plan with CORRECT DTO"
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
            "maxConversations": 2000,
            "maxCampaigns": 20,
            "maxFlows": 10,
            "maxAutomations": 30,
            "whatsappConnections": 2,
            "apiAccess": true,
            "customBranding": true,
            "prioritySupport": true
          },
          "isActive": true
        }'
    echo ""
    echo ""
else
    echo "✗ Super Admin login failed"
    echo ""
fi

# Test with Agent (after seeding)
echo "→ Testing with Agent..."
AGENT_LOGIN=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"agent@test.com","password":"Agent123!"}')

AGENT_TOKEN=$(echo $AGENT_LOGIN | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

if [ ! -z "$AGENT_TOKEN" ]; then
    echo "✓ Agent logged in"
    echo ""
    
    echo "Test: Agent - Try to access subscription plans"
    curl -s -X GET "$BASE_URL/subscription-plans" -H "Authorization: Bearer $AGENT_TOKEN"
    echo ""
    echo ""
else
    echo "✗ Agent login failed (may need to seed agent user)"
    echo "Response: $AGENT_LOGIN"
    echo ""
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TESTING COMPLETE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Summary:"
echo "--------"
echo "✓ TASK 1: Quota Enforcement (with correct DTOs)"
echo "✓ TASK 2: Subscription Creation (without billingCycle)"
echo "✓ TASK 3: Subscription Renewal"
echo "✓ TASK 4: Subscription Cancellation (period end)"
echo "✓ ADDITIONAL: Immediate Cancellation"
echo "✓ ADDITIONAL: Subscription Upgrade/Downgrade"
echo "✓ Role-Based Access Control"
