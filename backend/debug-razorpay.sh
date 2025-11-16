#!/bin/bash
set -e

BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

API_URL="http://localhost:3000/api/v1"
EMAIL="admin@test.com"
PASS="Admin123!"

echo -e "${BLUE}=== Razorpay Subscription Debugger ===${NC}"

source .env 2>/dev/null || true

if [ -z "$RAZORPAY_KEY_ID" ] || [ -z "$RAZORPAY_KEY_SECRET" ]; then
  echo -e "${RED}❌ Missing Razorpay env variables${NC}"
  exit 1
fi

echo -e "${YELLOW}STEP 1: Testing Razorpay Auth${NC}"
AUTH=$(curl -s -u "$RAZORPAY_KEY_ID:$RAZORPAY_KEY_SECRET" https://api.razorpay.com/v1/plans?count=1)
if echo "$AUTH" | grep -q "error"; then
  echo -e "${RED}❌ Invalid Razorpay API Keys${NC}"
  exit 1
fi
echo -e "${GREEN}✔ Razorpay keys OK${NC}"

echo -e "${YELLOW}STEP 2: Logging in backend${NC}"
LOGIN=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}")

TOKEN=$(echo $LOGIN | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ Login failed${NC}"
  echo "$LOGIN"
  exit 1
fi
echo -e "${GREEN}✔ Login OK${NC}"

echo -e "${YELLOW}STEP 3: Fetching plan${NC}"
PLANS=$(curl -s -X GET "$API_URL/subscription-plans" -H "Authorization: Bearer $TOKEN")
PLAN_ID=$(echo $PLANS | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
PLAN_PRICE=$(echo $PLANS | grep -o '"price":"[^"]*"' | head -1 | cut -d'"' -f4)

echo "Using Plan: $PLAN_ID (₹$PLAN_PRICE)"

echo -e "${YELLOW}STEP 4: Creating subscription (backend → Razorpay)${NC}"

RESP=$(curl -s -X POST "$API_URL/subscriptions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"planId\":\"$PLAN_ID\",\"paymentProvider\":\"razorpay\"}")

echo -e "${BLUE}=== Raw backend response ===${NC}"
echo "$RESP"
echo ""

CHECKOUT_URL=$(echo $RESP | grep -o '"checkoutUrl":"[^"]*"' | cut -d'"' -f4)

if [ -z "$CHECKOUT_URL" ]; then
  echo -e "${RED}❌ No checkout URL returned!${NC}"
  echo ""

  echo -e "${YELLOW}STEP 5: Extracting backend → Razorpay payload${NC}"
  LOG_FILE="backend/logs/razorpay-debug.log"

  if [ -f "$LOG_FILE" ]; then
    echo -e "${GREEN}✔ Found Razorpay debug log${NC}"
    echo -e "${BLUE}=== Razorpay Payload Sent ===${NC}"
    tail -20 "$LOG_FILE"
  else
    echo -e "${RED}⚠ No debug log. Add this in your RazorpayPaymentService:createSubscription:${NC}"
    echo ""
    echo "console.log('RAZORPAY_PAYLOAD', JSON.stringify(payload, null, 2));"
    echo ""
  fi

  exit 1
fi

echo -e "${GREEN}🎉 SUCCESS — Checkout URL generated${NC}"
echo "→ $CHECKOUT_URL"
