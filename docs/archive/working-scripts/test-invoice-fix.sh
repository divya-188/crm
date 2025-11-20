#!/bin/bash

echo "🧪 Testing Invoice Amount Fix"
echo "=============================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

API_URL="http://localhost:3000/api/v1"

echo -e "${BLUE}Step 1: Login${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "Admin123!"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ Login failed${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Logged in${NC}"
echo ""

echo -e "${BLUE}Step 2: Get current subscription${NC}"
SUBSCRIPTION_RESPONSE=$(curl -s -X GET "$API_URL/subscriptions/my-subscription" \
  -H "Authorization: Bearer $TOKEN")

SUBSCRIPTION_ID=$(echo $SUBSCRIPTION_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
CURRENT_PLAN=$(echo $SUBSCRIPTION_RESPONSE | grep -o '"name":"[^"]*' | head -1 | cut -d'"' -f4)

echo "Subscription ID: $SUBSCRIPTION_ID"
echo "Current Plan: $CURRENT_PLAN"
echo ""

echo -e "${BLUE}Step 3: Get Professional plan ID${NC}"
PLANS_RESPONSE=$(curl -s -X GET "$API_URL/subscription-plans" \
  -H "Authorization: Bearer $TOKEN")

PROFESSIONAL_PLAN_ID=$(echo $PLANS_RESPONSE | grep -o '"id":"[^"]*","name":"Professional"' | cut -d'"' -f4)

if [ -z "$PROFESSIONAL_PLAN_ID" ]; then
  echo -e "${RED}❌ Professional plan not found${NC}"
  exit 1
fi

echo "Professional Plan ID: $PROFESSIONAL_PLAN_ID"
echo ""

echo -e "${YELLOW}=============================="
echo "🚀 INITIATING UPGRADE"
echo "==============================${NC}"
echo ""
echo -e "${BLUE}Watch your backend terminal for logs!${NC}"
echo ""

UPGRADE_RESPONSE=$(curl -s -X PATCH "$API_URL/subscriptions/$SUBSCRIPTION_ID/upgrade" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"newPlanId\": \"$PROFESSIONAL_PLAN_ID\",
    \"paymentProvider\": \"razorpay\"
  }")

echo "Upgrade Response:"
echo "$UPGRADE_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$UPGRADE_RESPONSE"
echo ""

CHECKOUT_URL=$(echo $UPGRADE_RESPONSE | grep -o '"checkoutUrl":"[^"]*' | cut -d'"' -f4)
PRORATED_AMOUNT=$(echo $UPGRADE_RESPONSE | grep -o '"proratedAmount":[0-9]*' | cut -d':' -f2)

if [ ! -z "$CHECKOUT_URL" ]; then
  echo -e "${GREEN}✅ Payment link created${NC}"
  echo "Checkout URL: $CHECKOUT_URL"
  echo "Prorated Amount: \$$PRORATED_AMOUNT"
  echo ""
  echo -e "${YELLOW}=============================="
  echo "📋 NEXT STEPS:"
  echo "==============================${NC}"
  echo "1. Open the checkout URL in your browser"
  echo "2. Complete the Razorpay payment"
  echo "3. Watch the backend terminal for these logs:"
  echo ""
  echo -e "${BLUE}Expected logs:${NC}"
  echo "   📄 [INVOICE-CREATE] Creating invoice"
  echo "   📦 [INVOICE-CREATE] Subscription metadata: {...proratedAmount: $PRORATED_AMOUNT...}"
  echo "   ✅ [INVOICE-CREATE] Using PRORATED amount: \$$PRORATED_AMOUNT"
  echo "   💰 [INVOICE-CREATE] Final invoice amount: \$$PRORATED_AMOUNT"
  echo "   ✅ [INVOICE-SAVED] Invoice amount: \$$PRORATED_AMOUNT"
  echo ""
  echo -e "${GREEN}If you see these logs, the fix is working!${NC}"
  echo ""
  echo -e "${YELLOW}4. After payment, check the invoice:${NC}"
  echo "   - Go to 'Invoices' page in the UI"
  echo "   - Latest invoice should show \$$PRORATED_AMOUNT (not \$299)"
  echo ""
  echo -e "${BLUE}5. Verify in database:${NC}"
  echo "   psql -d whatscrm -c \"SELECT invoice_number, amount, total FROM invoices ORDER BY created_at DESC LIMIT 1;\""
  echo ""
else
  echo -e "${RED}❌ No checkout URL in response${NC}"
fi
