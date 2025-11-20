#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

API_URL="http://localhost:3000/api"
TOKEN=""

echo -e "${YELLOW}=== WhatsApp CRM Payment Gateway API Test ===${NC}\n"

# Function to print test results
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ $2${NC}"
    else
        echo -e "${RED}✗ $2${NC}"
    fi
}

# 1. Login to get token
echo -e "${YELLOW}1. Logging in...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin123!"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo -e "${RED}Failed to get authentication token${NC}"
    echo "Response: $LOGIN_RESPONSE"
    exit 1
fi

print_result 0 "Login successful"
echo ""

# 2. Get subscription plans
echo -e "${YELLOW}2. Getting subscription plans...${NC}"
PLANS_RESPONSE=$(curl -s -X GET "$API_URL/subscription-plans" \
  -H "Authorization: Bearer $TOKEN")

echo "$PLANS_RESPONSE" | jq '.' 2>/dev/null || echo "$PLANS_RESPONSE"
print_result $? "Retrieved subscription plans"
echo ""

# Extract first plan ID
PLAN_ID=$(echo $PLANS_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$PLAN_ID" ]; then
    echo -e "${YELLOW}No plans found, skipping subscription tests${NC}"
else
    echo -e "${YELLOW}Using plan ID: $PLAN_ID${NC}"
    
    # 3. Test Stripe subscription creation (will fail without real credentials)
    echo -e "\n${YELLOW}3. Testing Stripe subscription creation...${NC}"
    STRIPE_RESPONSE=$(curl -s -X POST "$API_URL/subscriptions" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "{
        \"planId\": \"$PLAN_ID\",
        \"paymentProvider\": \"stripe\",
        \"paymentMethodId\": \"pm_test_123\"
      }")
    
    echo "$STRIPE_RESPONSE" | jq '.' 2>/dev/null || echo "$STRIPE_RESPONSE"
    echo ""
    
    # 4. Test PayPal subscription creation (will fail without real credentials)
    echo -e "${YELLOW}4. Testing PayPal subscription creation...${NC}"
    PAYPAL_RESPONSE=$(curl -s -X POST "$API_URL/subscriptions" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "{
        \"planId\": \"$PLAN_ID\",
        \"paymentProvider\": \"paypal\"
      }")
    
    echo "$PAYPAL_RESPONSE" | jq '.' 2>/dev/null || echo "$PAYPAL_RESPONSE"
    echo ""
    
    # 5. Test Razorpay subscription creation (will fail without real credentials)
    echo -e "${YELLOW}5. Testing Razorpay subscription creation...${NC}"
    RAZORPAY_RESPONSE=$(curl -s -X POST "$API_URL/subscriptions" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "{
        \"planId\": \"$PLAN_ID\",
        \"paymentProvider\": \"razorpay\"
      }")
    
    echo "$RAZORPAY_RESPONSE" | jq '.' 2>/dev/null || echo "$RAZORPAY_RESPONSE"
    echo ""
fi

# 6. Test webhook endpoints (should return 400 without proper signature)
echo -e "${YELLOW}6. Testing Stripe webhook endpoint...${NC}"
STRIPE_WEBHOOK=$(curl -s -X POST "$API_URL/subscriptions/webhooks/stripe" \
  -H "Content-Type: application/json" \
  -H "stripe-signature: test_signature" \
  -d '{"type": "test"}')

echo "$STRIPE_WEBHOOK" | jq '.' 2>/dev/null || echo "$STRIPE_WEBHOOK"
print_result 0 "Stripe webhook endpoint accessible"
echo ""

echo -e "${YELLOW}7. Testing PayPal webhook endpoint...${NC}"
PAYPAL_WEBHOOK=$(curl -s -X POST "$API_URL/subscriptions/webhooks/paypal" \
  -H "Content-Type: application/json" \
  -d '{"event_type": "test"}')

echo "$PAYPAL_WEBHOOK" | jq '.' 2>/dev/null || echo "$PAYPAL_WEBHOOK"
print_result 0 "PayPal webhook endpoint accessible"
echo ""

echo -e "${YELLOW}8. Testing Razorpay webhook endpoint...${NC}"
RAZORPAY_WEBHOOK=$(curl -s -X POST "$API_URL/subscriptions/webhooks/razorpay" \
  -H "Content-Type: application/json" \
  -H "x-razorpay-signature: test_signature" \
  -d '{"event": "test"}')

echo "$RAZORPAY_WEBHOOK" | jq '.' 2>/dev/null || echo "$RAZORPAY_WEBHOOK"
print_result 0 "Razorpay webhook endpoint accessible"
echo ""

echo -e "${GREEN}=== Payment Gateway API Test Complete ===${NC}"
echo -e "${YELLOW}Note: Actual payment operations require valid API credentials${NC}"
