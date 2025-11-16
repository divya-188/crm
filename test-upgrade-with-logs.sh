#!/bin/bash

echo "🧪 Testing Subscription Upgrade with Comprehensive Logging"
echo "=========================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# API base URL
API_URL="http://localhost:3000/api/v1"

echo -e "${BLUE}Step 1: Login as admin${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin@123"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ Login failed${NC}"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✅ Logged in successfully${NC}"
echo ""

echo -e "${BLUE}Step 2: Get current subscription${NC}"
SUBSCRIPTION_RESPONSE=$(curl -s -X GET "$API_URL/subscriptions/my-subscription" \
  -H "Authorization: Bearer $TOKEN")

SUBSCRIPTION_ID=$(echo $SUBSCRIPTION_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
CURRENT_PLAN=$(echo $SUBSCRIPTION_RESPONSE | grep -o '"name":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$SUBSCRIPTION_ID" ]; then
  echo -e "${RED}❌ No subscription found${NC}"
  echo "Response: $SUBSCRIPTION_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✅ Current subscription found${NC}"
echo "   Subscription ID: $SUBSCRIPTION_ID"
echo "   Current Plan: $CURRENT_PLAN"
echo ""

echo -e "${BLUE}Step 3: Get available plans${NC}"
PLANS_RESPONSE=$(curl -s -X GET "$API_URL/subscription-plans" \
  -H "Authorization: Bearer $TOKEN")

echo "Available plans:"
echo "$PLANS_RESPONSE" | grep -o '"name":"[^"]*' | cut -d'"' -f4 | while read plan; do
  echo "   - $plan"
done
echo ""

# Get Professional plan ID
PROFESSIONAL_PLAN_ID=$(echo $PLANS_RESPONSE | grep -o '"id":"[^"]*","name":"Professional"' | cut -d'"' -f4)

if [ -z "$PROFESSIONAL_PLAN_ID" ]; then
  echo -e "${RED}❌ Professional plan not found${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Professional plan ID: $PROFESSIONAL_PLAN_ID${NC}"
echo ""

echo -e "${YELLOW}=========================================================="
echo "🚀 INITIATING UPGRADE - WATCH BACKEND LOGS NOW!"
echo "==========================================================${NC}"
echo ""
echo -e "${BLUE}Step 4: Upgrade to Professional plan${NC}"

UPGRADE_RESPONSE=$(curl -s -X PATCH "$API_URL/subscriptions/$SUBSCRIPTION_ID/upgrade" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"newPlanId\": \"$PROFESSIONAL_PLAN_ID\",
    \"paymentProvider\": \"razorpay\"
  }")

echo ""
echo -e "${GREEN}✅ Upgrade request sent${NC}"
echo ""
echo "Response:"
echo "$UPGRADE_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$UPGRADE_RESPONSE"
echo ""

# Extract checkout URL
CHECKOUT_URL=$(echo $UPGRADE_RESPONSE | grep -o '"checkoutUrl":"[^"]*' | cut -d'"' -f4)

if [ ! -z "$CHECKOUT_URL" ]; then
  echo -e "${GREEN}✅ Payment link created${NC}"
  echo "   Checkout URL: $CHECKOUT_URL"
  echo ""
  echo -e "${YELLOW}=========================================================="
  echo "📋 NEXT STEPS:"
  echo "==========================================================${NC}"
  echo "1. Open the checkout URL in your browser"
  echo "2. Complete the Razorpay payment"
  echo "3. Watch the backend terminal for activation logs"
  echo "4. Check the invoice amount in the logs"
  echo ""
  echo -e "${BLUE}Expected logs to see:${NC}"
  echo "   🔄 [UPGRADE-LIFECYCLE] UPGRADE INITIATED"
  echo "   💰 CALCULATED PRORATED AMOUNT: \$50.00"
  echo "   📦 [UPGRADE-PAYMENT] Payment metadata"
  echo "   💾 [UPGRADE-METADATA] Saving subscription metadata"
  echo "   🎯 [UNIFIED-ACTIVATE] ACTIVATING SUBSCRIPTION"
  echo "   📄 [INVOICE-CREATE] CREATING INVOICE"
  echo "   🔍 [INVOICE-AMOUNT] Checking for prorated amount..."
  echo "   ✅ [INVOICE-AMOUNT] Using PRORATED amount: \$50"
  echo "   💰 [INVOICE-FINAL] Final invoice amount: \$50"
  echo ""
  echo -e "${YELLOW}If you see '⚠️ [INVOICE-AMOUNT] Using FULL PLAN price: \$149'${NC}"
  echo -e "${YELLOW}then we've found the problem!${NC}"
else
  echo -e "${RED}❌ No checkout URL in response${NC}"
  echo "This might indicate an error in the upgrade process"
fi

echo ""
echo -e "${BLUE}=========================================================="
echo "📊 CHECK YOUR BACKEND TERMINAL NOW!"
echo "==========================================================${NC}"
