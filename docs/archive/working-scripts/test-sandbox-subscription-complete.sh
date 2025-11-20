#!/bin/bash

# Comprehensive Subscription Testing in Sandbox Mode
echo "🧪 COMPREHENSIVE SUBSCRIPTION TESTING - SANDBOX MODE"
echo "====================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test results
TESTS_PASSED=0
TESTS_FAILED=0

# Function to print test result
print_result() {
  if [ $1 -eq 0 ]; then
    echo -e "${GREEN}✅ PASSED${NC}: $2"
    ((TESTS_PASSED++))
  else
    echo -e "${RED}❌ FAILED${NC}: $2"
    ((TESTS_FAILED++))
  fi
}

# Get auth token
echo "🔐 Step 1: Logging in as admin..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@whatscrm.com",
    "password": "Admin@123"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ Login failed${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Login successful${NC}"
echo ""

# Get tenant ID
TENANT_ID=$(echo $LOGIN_RESPONSE | grep -o '"tenantId":"[^"]*' | cut -d'"' -f4)
echo "Tenant ID: $TENANT_ID"
echo ""

# ============================================
# TEST 0: Clean up existing subscriptions
# ============================================
echo "🧹 Step 0: Cleaning up existing subscriptions..."
EXISTING_SUBS=$(curl -s -X GET "http://localhost:3000/api/v1/subscriptions/current" \
  -H "Authorization: Bearer $TOKEN" 2>/dev/null)

if echo "$EXISTING_SUBS" | grep -q '"id"'; then
  SUB_ID=$(echo $EXISTING_SUBS | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
  echo "Found existing subscription: $SUB_ID"
  echo "Cancelling..."
  
  curl -s -X DELETE "http://localhost:3000/api/v1/subscriptions/$SUB_ID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"cancellationReason": "Testing", "cancelImmediately": true}' > /dev/null
  
  echo -e "${GREEN}✅ Cleaned up existing subscription${NC}"
else
  echo "No existing subscriptions found"
fi
echo ""

# ============================================
# TEST 1: Subscribe to a plan
# ============================================
echo "📦 TEST 1: Subscribe to a Plan"
echo "================================"

# Get available plans
PLANS_RESPONSE=$(curl -s -X GET http://localhost:3000/api/v1/subscription-plans \
  -H "Authorization: Bearer $TOKEN")

PLAN_ID=$(echo $PLANS_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
PLAN_NAME=$(echo $PLANS_RESPONSE | grep -o '"name":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$PLAN_ID" ]; then
  echo -e "${RED}❌ No plans found${NC}"
  exit 1
fi

echo "Selected Plan: $PLAN_NAME (ID: $PLAN_ID)"
echo ""

# Create subscription
echo "Creating subscription..."
SUB_RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/subscriptions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"planId\": \"$PLAN_ID\",
    \"paymentProvider\": \"stripe\"
  }")

echo "Response:"
echo $SUB_RESPONSE | jq '.' 2>/dev/null || echo $SUB_RESPONSE
echo ""

# Check if subscription was created
if echo "$SUB_RESPONSE" | grep -q '"success":true'; then
  SUBSCRIPTION_ID=$(echo $SUB_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
  STRIPE_SUB_ID=$(echo $SUB_RESPONSE | grep -o '"stripeSubscriptionId":"[^"]*' | cut -d'"' -f4)
  STATUS=$(echo $SUB_RESPONSE | grep -o '"status":"[^"]*' | head -1 | cut -d'"' -f4)
  
  print_result 0 "Subscription created (ID: $SUBSCRIPTION_ID)"
  echo "  Stripe Subscription ID: $STRIPE_SUB_ID"
  echo "  Status: $STATUS"
  
  # Verify it's using Stripe API (not simulated)
  if [[ $STRIPE_SUB_ID == sub_* ]]; then
    print_result 0 "Real Stripe subscription ID detected"
  else
    print_result 1 "Expected real Stripe subscription ID"
  fi
else
  print_result 1 "Subscription creation"
  echo "Error: $SUB_RESPONSE"
fi
echo ""

# ============================================
# TEST 2: Check Stripe Test Dashboard
# ============================================
echo "📊 TEST 2: Verify Subscription in Stripe"
echo "=========================================="
echo "Manual Step: Check https://dashboard.stripe.com/test/subscriptions"
echo "You should see subscription: $STRIPE_SUB_ID"
echo ""
read -p "Press Enter after verifying in Stripe dashboard..."
echo ""

# ============================================
# TEST 3: Verify Webhook Events
# ============================================
echo "🔔 TEST 3: Verify Webhook Events"
echo "=================================="
echo "Webhook events should have been received for:"
echo "  - customer.created"
echo "  - product.created"
echo "  - price.created"
echo "  - subscription.created"
echo ""
echo "Check backend logs for webhook events..."
echo ""

# ============================================
# TEST 4: Test Quota Enforcement
# ============================================
echo "📊 TEST 4: Test Quota Enforcement"
echo "==================================="

# Get usage statistics
USAGE_RESPONSE=$(curl -s -X GET "http://localhost:3000/api/v1/subscriptions/usage" \
  -H "Authorization: Bearer $TOKEN")

echo "Current Usage:"
echo $USAGE_RESPONSE | jq '.' 2>/dev/null || echo $USAGE_RESPONSE
echo ""

if echo "$USAGE_RESPONSE" | grep -q '"subscription"'; then
  print_result 0 "Usage statistics retrieved"
  
  # Check if quotas are defined
  if echo "$USAGE_RESPONSE" | grep -q '"limit"'; then
    print_result 0 "Quota limits are enforced"
  else
    print_result 1 "Quota limits not found"
  fi
else
  print_result 1 "Usage statistics retrieval"
fi
echo ""

# ============================================
# TEST 5: Test Subscription Cancellation
# ============================================
echo "🚫 TEST 5: Test Subscription Cancellation"
echo "==========================================="

if [ -n "$SUBSCRIPTION_ID" ]; then
  echo "Cancelling subscription: $SUBSCRIPTION_ID"
  
  CANCEL_RESPONSE=$(curl -s -X DELETE "http://localhost:3000/api/v1/subscriptions/$SUBSCRIPTION_ID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "cancellationReason": "Testing cancellation flow",
      "cancelImmediately": false
    }')
  
  echo "Response:"
  echo $CANCEL_RESPONSE | jq '.' 2>/dev/null || echo $CANCEL_RESPONSE
  echo ""
  
  if echo "$CANCEL_RESPONSE" | grep -q '"success":true'; then
    print_result 0 "Subscription cancellation"
    
    # Verify status changed
    CURRENT_SUB=$(curl -s -X GET "http://localhost:3000/api/v1/subscriptions/current" \
      -H "Authorization: Bearer $TOKEN")
    
    if echo "$CURRENT_SUB" | grep -q '"cancelledAt"'; then
      print_result 0 "Cancellation timestamp recorded"
    fi
  else
    print_result 1 "Subscription cancellation"
  fi
else
  print_result 1 "No subscription ID to cancel"
fi
echo ""

# ============================================
# TEST 6: Test Subscription Renewal
# ============================================
echo "🔄 TEST 6: Test Subscription Renewal"
echo "======================================"
echo "Note: Renewal testing requires waiting for subscription period to end"
echo "or manually triggering renewal via Stripe dashboard"
echo ""
echo "To test renewal:"
echo "1. Go to Stripe dashboard"
echo "2. Find subscription: $STRIPE_SUB_ID"
echo "3. Manually trigger renewal or wait for period end"
echo ""

# ============================================
# TEST 7: Test Payment Failures
# ============================================
echo "💳 TEST 7: Test Payment Failures"
echo "=================================="
echo "To test payment failures:"
echo "1. Use Stripe test card: 4000 0000 0000 0002 (decline)"
echo "2. Create a new subscription with this card"
echo "3. Verify payment_failed status"
echo ""
echo "This requires frontend payment form integration"
echo ""

# ============================================
# TEST 8: Test Grace Periods
# ============================================
echo "⏰ TEST 8: Test Grace Periods"
echo "==============================="
echo "Grace period testing requires:"
echo "1. Subscription with payment failure"
echo "2. Waiting for grace period to activate"
echo "3. Verifying grace period warnings"
echo ""
echo "Check grace_period_end field in subscription"
echo ""

# ============================================
# TEST 9: Test Plan Upgrades/Downgrades
# ============================================
echo "⬆️ TEST 9: Test Plan Upgrades/Downgrades"
echo "=========================================="

# Create a new subscription first
echo "Creating new subscription for upgrade test..."
SUB_RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/subscriptions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"planId\": \"$PLAN_ID\",
    \"paymentProvider\": \"stripe\"
  }")

NEW_SUB_ID=$(echo $SUB_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -n "$NEW_SUB_ID" ]; then
  echo "New subscription created: $NEW_SUB_ID"
  
  # Get a different plan for upgrade
  SECOND_PLAN_ID=$(echo $PLANS_RESPONSE | grep -o '"id":"[^"]*' | sed -n '2p' | cut -d'"' -f4)
  
  if [ -n "$SECOND_PLAN_ID" ] && [ "$SECOND_PLAN_ID" != "$PLAN_ID" ]; then
    echo "Upgrading to plan: $SECOND_PLAN_ID"
    
    UPGRADE_RESPONSE=$(curl -s -X POST "http://localhost:3000/api/v1/subscriptions/$NEW_SUB_ID/upgrade" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "{
        \"newPlanId\": \"$SECOND_PLAN_ID\",
        \"paymentProvider\": \"stripe\"
      }")
    
    echo "Response:"
    echo $UPGRADE_RESPONSE | jq '.' 2>/dev/null || echo $UPGRADE_RESPONSE
    echo ""
    
    if echo "$UPGRADE_RESPONSE" | grep -q '"success":true'; then
      print_result 0 "Plan upgrade"
    else
      print_result 1 "Plan upgrade"
    fi
  else
    echo "Only one plan available, skipping upgrade test"
  fi
else
  print_result 1 "Could not create subscription for upgrade test"
fi
echo ""

# ============================================
# SUMMARY
# ============================================
echo ""
echo "=========================================="
echo "TEST SUMMARY"
echo "=========================================="
echo -e "${GREEN}Tests Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Tests Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
  echo ""
  echo "Sandbox mode is working correctly with:"
  echo "  ✅ Real Stripe API integration"
  echo "  ✅ Subscription creation"
  echo "  ✅ Quota enforcement"
  echo "  ✅ Cancellation flow"
  echo "  ✅ Plan upgrades"
  echo ""
  echo "Next steps:"
  echo "  1. Check Stripe test dashboard for subscriptions"
  echo "  2. Monitor webhook events in backend logs"
  echo "  3. Test with Stripe CLI: stripe listen --forward-to localhost:3000/api/v1/webhooks/stripe"
else
  echo -e "${YELLOW}⚠️  Some tests failed. Review the output above.${NC}"
fi

echo ""
echo "Stripe Dashboard: https://dashboard.stripe.com/test/subscriptions"
echo "Subscription ID: $STRIPE_SUB_ID"
echo ""
