#!/bin/bash

# Razorpay Issue Diagnostic Script
# Quickly identifies where the Razorpay integration is failing

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

source .env 2>/dev/null || true

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Razorpay Integration Diagnostics     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Test 1: Check credentials exist
echo -e "${YELLOW}[1/5] Checking Razorpay Credentials...${NC}"
if [ -z "$RAZORPAY_KEY_ID" ]; then
  echo -e "${RED}  ✗ RAZORPAY_KEY_ID not set${NC}"
  CREDS_OK=false
else
  echo -e "${GREEN}  ✓ RAZORPAY_KEY_ID: ${RAZORPAY_KEY_ID:0:15}...${NC}"
  CREDS_OK=true
fi

if [ -z "$RAZORPAY_KEY_SECRET" ]; then
  echo -e "${RED}  ✗ RAZORPAY_KEY_SECRET not set${NC}"
  CREDS_OK=false
else
  echo -e "${GREEN}  ✓ RAZORPAY_KEY_SECRET: ${RAZORPAY_KEY_SECRET:0:10}...${NC}"
fi
echo ""

if [ "$CREDS_OK" = false ]; then
  echo -e "${RED}FAILED: Razorpay credentials missing${NC}"
  echo "Add to backend/.env:"
  echo "  RAZORPAY_KEY_ID=rzp_test_xxxxx"
  echo "  RAZORPAY_KEY_SECRET=xxxxx"
  exit 1
fi

# Test 2: Check credential type
echo -e "${YELLOW}[2/5] Checking Credential Type...${NC}"
if echo "$RAZORPAY_KEY_ID" | grep -q "test"; then
  echo -e "${GREEN}  ✓ Using TEST credentials (sandbox mode)${NC}"
  MODE="test"
else
  echo -e "${BLUE}  ℹ Using LIVE credentials (production mode)${NC}"
  MODE="live"
fi
echo ""

# Test 3: Test API authentication
echo -e "${YELLOW}[3/5] Testing Razorpay API Authentication...${NC}"
AUTH_RESPONSE=$(curl -s -w "\n%{http_code}" -u "$RAZORPAY_KEY_ID:$RAZORPAY_KEY_SECRET" \
  https://api.razorpay.com/v1/plans?count=1)

HTTP_CODE=$(echo "$AUTH_RESPONSE" | tail -1)
BODY=$(echo "$AUTH_RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}  ✓ Authentication SUCCESS (HTTP $HTTP_CODE)${NC}"
  AUTH_OK=true
else
  echo -e "${RED}  ✗ Authentication FAILED (HTTP $HTTP_CODE)${NC}"
  
  if echo "$BODY" | grep -q "error"; then
    ERROR_DESC=$(echo "$BODY" | grep -o '"description":"[^"]*"' | cut -d'"' -f4)
    echo -e "${RED}  Error: $ERROR_DESC${NC}"
  fi
  
  echo ""
  echo -e "${YELLOW}Diagnosis:${NC}"
  if [ "$HTTP_CODE" = "401" ]; then
    echo "  • Invalid API credentials"
    echo "  • Key ID and Secret don't match"
    echo "  • Credentials may be expired"
  elif [ "$HTTP_CODE" = "403" ]; then
    echo "  • Account not activated"
    echo "  • API access restricted"
  fi
  
  echo ""
  echo -e "${YELLOW}Solution:${NC}"
  echo "  1. Login to https://dashboard.razorpay.com/"
  echo "  2. Switch to Test Mode (toggle in top-right)"
  echo "  3. Go to Settings → API Keys"
  echo "  4. Generate new Test Keys"
  echo "  5. Update backend/.env with new credentials"
  
  AUTH_OK=false
fi
echo ""

if [ "$AUTH_OK" = false ]; then
  exit 1
fi

# Test 4: Test plan creation
echo -e "${YELLOW}[4/5] Testing Plan Creation...${NC}"
PLAN_RESPONSE=$(curl -s -w "\n%{http_code}" -u "$RAZORPAY_KEY_ID:$RAZORPAY_KEY_SECRET" \
  -X POST https://api.razorpay.com/v1/plans \
  -H "Content-Type: application/json" \
  -d '{
    "period": "monthly",
    "interval": 1,
    "item": {
      "name": "Test Plan",
      "amount": 99900,
      "currency": "INR"
    }
  }')

HTTP_CODE=$(echo "$PLAN_RESPONSE" | tail -1)
BODY=$(echo "$PLAN_RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
  PLAN_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  echo -e "${GREEN}  ✓ Plan creation SUCCESS${NC}"
  echo -e "${GREEN}  Plan ID: $PLAN_ID${NC}"
  PLAN_OK=true
else
  echo -e "${RED}  ✗ Plan creation FAILED (HTTP $HTTP_CODE)${NC}"
  echo "  Response: $(echo $BODY | head -c 100)"
  PLAN_OK=false
fi
echo ""

# Test 5: Test subscription creation
if [ "$PLAN_OK" = true ]; then
  echo -e "${YELLOW}[5/5] Testing Subscription Creation...${NC}"
  SUB_RESPONSE=$(curl -s -w "\n%{http_code}" -u "$RAZORPAY_KEY_ID:$RAZORPAY_KEY_SECRET" \
    -X POST https://api.razorpay.com/v1/subscriptions \
    -H "Content-Type: application/json" \
    -d "{
      \"plan_id\": \"$PLAN_ID\",
      \"customer_notify\": 1,
      \"total_count\": 12,
      \"quantity\": 1
    }")

  HTTP_CODE=$(echo "$SUB_RESPONSE" | tail -1)
  BODY=$(echo "$SUB_RESPONSE" | head -n -1)

  if [ "$HTTP_CODE" = "200" ]; then
    SUB_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    SHORT_URL=$(echo "$BODY" | grep -o '"short_url":"[^"]*"' | cut -d'"' -f4)
    
    echo -e "${GREEN}  ✓ Subscription creation SUCCESS${NC}"
    echo -e "${GREEN}  Subscription ID: $SUB_ID${NC}"
    echo -e "${GREEN}  Checkout URL: $SHORT_URL${NC}"
    SUB_OK=true
  else
    echo -e "${RED}  ✗ Subscription creation FAILED (HTTP $HTTP_CODE)${NC}"
    
    if echo "$BODY" | grep -q "hosted page"; then
      echo -e "${RED}  Error: Hosted page not available${NC}"
      echo ""
      echo -e "${YELLOW}This error means:${NC}"
      echo "  • Your Razorpay account doesn't have hosted pages enabled"
      echo "  • This feature may require account verification"
      echo "  • Test mode accounts may have limitations"
      echo ""
      echo -e "${YELLOW}Solutions:${NC}"
      echo "  1. Contact Razorpay support to enable hosted pages"
      echo "  2. Complete KYC verification if required"
      echo "  3. Use Stripe instead (already configured and working)"
      echo ""
      echo "To switch to Stripe:"
      echo "  Update backend/.env: PAYMENT_PREFRENCE=stripe"
    else
      echo "  Response: $(echo $BODY | head -c 150)"
    fi
    
    SUB_OK=false
  fi
else
  echo -e "${YELLOW}[5/5] Skipping subscription test (plan creation failed)${NC}"
  SUB_OK=false
fi
echo ""

# Final Summary
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Diagnostic Summary                    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

if [ "$AUTH_OK" = true ] && [ "$PLAN_OK" = true ] && [ "$SUB_OK" = true ]; then
  echo -e "${GREEN}✅ ALL TESTS PASSED${NC}"
  echo ""
  echo "Your Razorpay integration is working correctly!"
  echo ""
  echo "Test checkout URL: $SHORT_URL"
  echo ""
  echo "Next steps:"
  echo "  1. Update backend/.env: PAYMENT_PREFRENCE=razorpay"
  echo "  2. Restart your backend server"
  echo "  3. Try subscribing from the frontend"
else
  echo -e "${RED}❌ TESTS FAILED${NC}"
  echo ""
  echo "Issues found:"
  [ "$AUTH_OK" = false ] && echo "  • API Authentication failed"
  [ "$PLAN_OK" = false ] && echo "  • Plan creation failed"
  [ "$SUB_OK" = false ] && echo "  • Subscription creation failed"
  echo ""
  echo "Recommendation:"
  echo "  Use Stripe instead (already working)"
  echo "  Update backend/.env: PAYMENT_PREFRENCE=stripe"
fi
echo ""
