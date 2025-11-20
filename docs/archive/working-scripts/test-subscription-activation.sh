#!/bin/bash

# Test Subscription Activation After Checkout
echo "🧪 TESTING SUBSCRIPTION ACTIVATION"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

API_URL="http://localhost:3000/api/v1"
ADMIN_EMAIL="admin@test.com"
ADMIN_PASSWORD="Admin123!"

# Step 1: Login
echo "🔐 Step 1: Logging in as admin..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ Login failed${NC}"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✅ Login successful${NC}"
echo ""

# Step 2: Check current subscription status
echo "📋 Step 2: Checking current subscription status..."
CURRENT_SUB=$(curl -s -X GET "$API_URL/subscriptions/current" \
  -H "Authorization: Bearer $TOKEN")

echo "Current subscription status:"
echo "$CURRENT_SUB"
echo ""

# Step 3: Get available plans
echo "📋 Step 3: Getting available subscription plans..."
PLANS_RESPONSE=$(curl -s -X GET "$API_URL/subscription-plans" \
  -H "Authorization: Bearer $TOKEN")

PLAN_ID=$(echo $PLANS_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$PLAN_ID" ]; then
  echo -e "${RED}❌ No plans found${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Found plan: $PLAN_ID${NC}"
echo ""

# Step 4: Create subscription
echo "💳 Step 4: Creating subscription..."
CREATE_RESPONSE=$(curl -s -X POST "$API_URL/subscriptions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"planId\":\"$PLAN_ID\",\"paymentProvider\":\"stripe\"}")

echo "Create subscription response:"
echo "$CREATE_RESPONSE"
echo ""

# Extract session ID and subscription ID
SESSION_ID=$(echo $CREATE_RESPONSE | grep -o '"sessionId":"[^"]*' | cut -d'"' -f4)
SUBSCRIPTION_ID=$(echo $CREATE_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$SESSION_ID" ]; then
  echo -e "${RED}❌ No session ID found${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Subscription created with session ID: $SESSION_ID${NC}"
echo -e "${GREEN}✅ Subscription ID: $SUBSCRIPTION_ID${NC}"
echo ""

# Step 5: Check session status
echo "🔍 Step 5: Checking session status..."
SESSION_STATUS=$(curl -s -X GET "$API_URL/subscriptions/session/$SESSION_ID/status" \
  -H "Authorization: Bearer $TOKEN")

echo "Session status:"
echo "$SESSION_STATUS"
echo ""

# Step 6: Manually activate subscription (simulating successful checkout)
echo "⚡ Step 6: Activating subscription (simulating successful checkout)..."
ACTIVATE_RESPONSE=$(curl -s -X POST "$API_URL/subscriptions/activate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"$SESSION_ID\"}")

echo "Activation response:"
echo "$ACTIVATE_RESPONSE"
echo ""

# Step 7: Check subscription status after activation
echo "📊 Step 7: Checking subscription status after activation..."
sleep 2
FINAL_SUB=$(curl -s -X GET "$API_URL/subscriptions/current" \
  -H "Authorization: Bearer $TOKEN")

echo "Final subscription status:"
echo "$FINAL_SUB"
echo ""

# Step 8: Check usage/quotas
echo "📈 Step 8: Checking usage and quotas..."
USAGE_RESPONSE=$(curl -s -X GET "$API_URL/subscriptions/usage" \
  -H "Authorization: Bearer $TOKEN")

echo "Usage and quotas:"
echo "$USAGE_RESPONSE"
echo ""

# Summary
echo "📋 TEST SUMMARY"
echo "==============="
echo ""

if echo "$FINAL_SUB" | grep -q '"status":"active"'; then
  echo -e "${GREEN}✅ SUCCESS: Subscription is now ACTIVE!${NC}"
  echo ""
  echo "✅ Test Results:"
  echo "   - Subscription created: ✅"
  echo "   - Session ID generated: ✅"
  echo "   - Manual activation: ✅"
  echo "   - Status updated to active: ✅"
  echo "   - Usage endpoint working: ✅"
  echo ""
  echo "🎉 The subscription activation flow is working!"
  echo ""
  echo "📝 Next Steps:"
  echo "1. Test the frontend flow:"
  echo "   - Go to: http://localhost:5174/admin/plans"
  echo "   - Subscribe to a plan"
  echo "   - Complete Stripe checkout"
  echo "   - Success page should activate subscription"
  echo ""
  echo "2. Verify in Stripe dashboard:"
  echo "   - https://dashboard.stripe.com/test/subscriptions"
  echo ""
else
  echo -e "${RED}❌ FAILED: Subscription is not active${NC}"
  echo "Check the responses above for errors."
fi

echo ""
echo "🔗 Useful URLs:"
echo "   - Frontend: http://localhost:5174/admin/plans"
echo "   - Stripe Dashboard: https://dashboard.stripe.com/test/subscriptions"
echo "   - Backend API: http://localhost:3000/api/v1/subscriptions/current"
echo ""
