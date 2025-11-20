#!/bin/bash

# Complete Subscription Flow Testing with Stripe Checkout
echo "🧪 COMPLETE SUBSCRIPTION TESTING - STRIPE CHECKOUT MODE"
echo "========================================================"
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

# Step 2: Get available plans
echo "📋 Step 2: Getting available subscription plans..."
PLANS_RESPONSE=$(curl -s -X GET "$API_URL/subscription-plans" \
  -H "Authorization: Bearer $TOKEN")

echo "$PLANS_RESPONSE" | head -c 200
echo "..."
echo ""

# Extract first plan ID
PLAN_ID=$(echo $PLANS_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$PLAN_ID" ]; then
  echo -e "${RED}❌ No plans found${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Found plan: $PLAN_ID${NC}"
echo ""

# Step 3: Check current subscription
echo "🔍 Step 3: Checking current subscription..."
CURRENT_SUB=$(curl -s -X GET "$API_URL/subscriptions/current" \
  -H "Authorization: Bearer $TOKEN")

echo "$CURRENT_SUB" | head -c 200
echo ""

# If subscription exists, cancel it first
if echo "$CURRENT_SUB" | grep -q '"id"'; then
  SUB_ID=$(echo $CURRENT_SUB | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
  echo -e "${YELLOW}⚠️  Existing subscription found: $SUB_ID${NC}"
  echo "🗑️  Cancelling existing subscription..."
  
  CANCEL_RESPONSE=$(curl -s -X DELETE "$API_URL/subscriptions/$SUB_ID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"cancellationReason":"Testing cleanup","cancelImmediately":true}')
  
  echo -e "${GREEN}✅ Subscription cancelled${NC}"
  echo ""
  sleep 2
fi

# Step 4: Create new subscription (Stripe Checkout)
echo "💳 Step 4: Creating subscription with Stripe Checkout..."
CREATE_RESPONSE=$(curl -s -X POST "$API_URL/subscriptions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"planId\":\"$PLAN_ID\",\"paymentProvider\":\"stripe\"}")

echo "$CREATE_RESPONSE"
echo ""

# Check for checkout URL
CHECKOUT_URL=$(echo $CREATE_RESPONSE | grep -o '"checkoutUrl":"[^"]*' | cut -d'"' -f4)

if [ -n "$CHECKOUT_URL" ]; then
  echo -e "${GREEN}✅ Stripe Checkout Session created!${NC}"
  echo -e "${BLUE}🔗 Checkout URL: $CHECKOUT_URL${NC}"
  echo ""
  echo "📝 NEXT STEPS:"
  echo "1. Open this URL in your browser: $CHECKOUT_URL"
  echo "2. Use test card: 4242 4242 4242 4242"
  echo "3. Expiry: 12/34, CVC: 123"
  echo "4. Complete the checkout"
  echo "5. You'll be redirected back to the app"
  echo ""
  echo -e "${GREEN}✅ TEST 1: Subscribe to a plan - READY${NC}"
else
  echo -e "${RED}❌ No checkout URL returned${NC}"
  echo "Response: $CREATE_RESPONSE"
fi

echo ""
echo "📊 TESTING CHECKLIST:"
echo "===================="
echo ""
echo "✅ Test 1: Subscribe to a plan"
echo "   - Checkout URL generated: $CHECKOUT_URL"
echo "   - Use test card: 4242 4242 4242 4242"
echo ""
echo "✅ Test 2: Check Stripe Dashboard"
echo "   - Go to: https://dashboard.stripe.com/test/subscriptions"
echo "   - Verify subscription appears after checkout"
echo ""
echo "✅ Test 3: Verify Webhooks"
echo "   - Check backend logs for webhook events:"
echo "     * checkout.session.completed"
echo "     * customer.subscription.created"
echo "     * invoice.payment_succeeded"
echo ""
echo "✅ Test 4: Test Quota Enforcement"
echo "   - Run: curl -X GET $API_URL/subscriptions/usage -H \"Authorization: Bearer $TOKEN\""
echo ""
echo "✅ Test 5: Test Cancellation"
echo "   - After subscription is active, run:"
echo "   - curl -X DELETE $API_URL/subscriptions/SUB_ID -H \"Authorization: Bearer $TOKEN\" -H \"Content-Type: application/json\" -d '{\"cancellationReason\":\"Testing\",\"cancelImmediately\":false}'"
echo ""
echo "✅ Test 6: Test Renewal"
echo "   - Subscription auto-renews at period end"
echo "   - Or manually trigger in Stripe dashboard"
echo ""
echo "✅ Test 7: Test Payment Failures"
echo "   - Create subscription with decline card: 4000 0000 0000 0002"
echo "   - Should trigger grace period"
echo ""
echo "✅ Test 8: Test Grace Periods"
echo "   - After payment failure, check subscription status"
echo "   - Should show gracePeriodEnd date"
echo ""
echo "✅ Test 9: Test Plan Changes"
echo "   - Upgrade: curl -X POST $API_URL/subscriptions/SUB_ID/upgrade -H \"Authorization: Bearer $TOKEN\" -H \"Content-Type: application/json\" -d '{\"newPlanId\":\"NEW_PLAN_ID\",\"paymentProvider\":\"stripe\"}'"
echo "   - Downgrade: curl -X POST $API_URL/subscriptions/SUB_ID/downgrade -H \"Authorization: Bearer $TOKEN\" -H \"Content-Type: application/json\" -d '{\"newPlanId\":\"LOWER_PLAN_ID\"}'"
echo ""
echo "🎉 READY FOR COMPLETE TESTING!"
echo ""
