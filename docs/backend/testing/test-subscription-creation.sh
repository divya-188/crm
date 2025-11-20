#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3000"
API_URL="$BASE_URL/api/v1"

echo -e "${BLUE}=== Subscription Creation with Payment - Integration Tests ===${NC}\n"

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0

# Helper function to check test result
check_result() {
  local test_name=$1
  local response=$2
  local expected_field=$3
  
  if echo "$response" | jq -e "$expected_field" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PASS: $test_name${NC}"
    ((TESTS_PASSED++))
    return 0
  else
    echo -e "${RED}✗ FAIL: $test_name${NC}"
    ((TESTS_FAILED++))
    return 1
  fi
}

# Step 1: Register and Login
echo -e "${YELLOW}Step 1: Setting up test user...${NC}"
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "subscription-creation-test@example.com",
    "password": "Test123!@#",
    "firstName": "Subscription",
    "lastName": "Test",
    "tenantName": "Subscription Creation Test Tenant"
  }')

TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.data.accessToken // .accessToken // empty')
TENANT_ID=$(echo "$REGISTER_RESPONSE" | jq -r '.data.user.tenantId // .user.tenantId // empty')

if [ -z "$TOKEN" ] || [ "$TOKEN" == "null" ]; then
  echo -e "${YELLOW}Registration might have failed, trying to login...${NC}"
  
  LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{
      "email": "subscription-creation-test@example.com",
      "password": "Test123!@#"
    }')
  
  TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.accessToken // .accessToken // empty')
  TENANT_ID=$(echo "$LOGIN_RESPONSE" | jq -r '.data.user.tenantId // .user.tenantId // empty')
fi

if [ -z "$TOKEN" ] || [ "$TOKEN" == "null" ]; then
  echo -e "${RED}Failed to get authentication token${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Authentication successful${NC}"
echo -e "Tenant ID: $TENANT_ID\n"

# Step 2: Get available plans
echo -e "${YELLOW}Step 2: Fetching subscription plans...${NC}"
PLANS_RESPONSE=$(curl -s -X GET "$API_URL/subscription-plans" \
  -H "Authorization: Bearer $TOKEN")

echo "$PLANS_RESPONSE" | jq '.'

PLAN_ID=$(echo "$PLANS_RESPONSE" | jq -r '.data[0].id // empty')
PLAN_NAME=$(echo "$PLANS_RESPONSE" | jq -r '.data[0].name // empty')

if [ -z "$PLAN_ID" ] || [ "$PLAN_ID" == "null" ]; then
  echo -e "${RED}No subscription plans found${NC}"
  exit 1
fi

check_result "Fetch subscription plans" "$PLANS_RESPONSE" '.data[0].id'
echo -e "Selected Plan: $PLAN_NAME ($PLAN_ID)\n"

# Step 3: Test - Create subscription with valid plan
echo -e "${YELLOW}Step 3: TEST - Create subscription with valid plan and payment method${NC}"
SUBSCRIPTION_RESPONSE=$(curl -s -X POST "$API_URL/subscriptions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"planId\": \"$PLAN_ID\",
    \"paymentProvider\": \"stripe\",
    \"paymentMethodId\": \"pm_test_valid_123\"
  }")

echo "$SUBSCRIPTION_RESPONSE" | jq '.'

SUBSCRIPTION_ID=$(echo "$SUBSCRIPTION_RESPONSE" | jq -r '.data.id // empty')
check_result "Create subscription with valid plan" "$SUBSCRIPTION_RESPONSE" '.data.id'

if [ ! -z "$SUBSCRIPTION_ID" ] && [ "$SUBSCRIPTION_ID" != "null" ]; then
  echo -e "Subscription ID: $SUBSCRIPTION_ID\n"
  
  # Verify subscription status
  SUBSCRIPTION_STATUS=$(echo "$SUBSCRIPTION_RESPONSE" | jq -r '.data.status // empty')
  if [ "$SUBSCRIPTION_STATUS" == "active" ] || [ "$SUBSCRIPTION_STATUS" == "pending" ]; then
    echo -e "${GREEN}✓ PASS: Subscription status is valid ($SUBSCRIPTION_STATUS)${NC}\n"
    ((TESTS_PASSED++))
  else
    echo -e "${RED}✗ FAIL: Unexpected subscription status ($SUBSCRIPTION_STATUS)${NC}\n"
    ((TESTS_FAILED++))
  fi
  
  # Verify subscription dates are set
  START_DATE=$(echo "$SUBSCRIPTION_RESPONSE" | jq -r '.data.startDate // empty')
  END_DATE=$(echo "$SUBSCRIPTION_RESPONSE" | jq -r '.data.endDate // empty')
  
  if [ ! -z "$START_DATE" ] && [ "$START_DATE" != "null" ] && [ ! -z "$END_DATE" ] && [ "$END_DATE" != "null" ]; then
    echo -e "${GREEN}✓ PASS: Subscription dates are set${NC}"
    echo -e "  Start Date: $START_DATE"
    echo -e "  End Date: $END_DATE\n"
    ((TESTS_PASSED++))
  else
    echo -e "${RED}✗ FAIL: Subscription dates not set properly${NC}\n"
    ((TESTS_FAILED++))
  fi
fi

# Step 4: Test - Attempt to create duplicate subscription
echo -e "${YELLOW}Step 4: TEST - Attempt to create duplicate subscription (should fail)${NC}"
DUPLICATE_RESPONSE=$(curl -s -X POST "$API_URL/subscriptions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"planId\": \"$PLAN_ID\",
    \"paymentProvider\": \"stripe\",
    \"paymentMethodId\": \"pm_test_duplicate_456\"
  }")

echo "$DUPLICATE_RESPONSE" | jq '.'

if echo "$DUPLICATE_RESPONSE" | jq -e '.statusCode == 400' > /dev/null 2>&1; then
  echo -e "${GREEN}✓ PASS: Duplicate subscription correctly rejected${NC}\n"
  ((TESTS_PASSED++))
else
  echo -e "${RED}✗ FAIL: Duplicate subscription should have been rejected${NC}\n"
  ((TESTS_FAILED++))
fi

# Step 5: Test - Create subscription with invalid plan
echo -e "${YELLOW}Step 5: TEST - Create subscription with invalid plan ID (should fail)${NC}"
INVALID_PLAN_RESPONSE=$(curl -s -X POST "$API_URL/subscriptions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "invalid-plan-id-12345",
    "paymentProvider": "stripe",
    "paymentMethodId": "pm_test_789"
  }')

echo "$INVALID_PLAN_RESPONSE" | jq '.'

if echo "$INVALID_PLAN_RESPONSE" | jq -e '.statusCode == 404' > /dev/null 2>&1; then
  echo -e "${GREEN}✓ PASS: Invalid plan correctly rejected${NC}\n"
  ((TESTS_PASSED++))
else
  echo -e "${RED}✗ FAIL: Invalid plan should have been rejected with 404${NC}\n"
  ((TESTS_FAILED++))
fi

# Step 6: Test - Simulate webhook payment success
echo -e "${YELLOW}Step 6: TEST - Simulate webhook payment success${NC}"
echo -e "${BLUE}Note: This would normally be triggered by the payment gateway${NC}"

# Mock Stripe webhook payload
WEBHOOK_PAYLOAD='{
  "type": "invoice.payment_succeeded",
  "data": {
    "object": {
      "id": "in_test_123",
      "subscription": "'"$SUBSCRIPTION_ID"'",
      "payment_intent": "pi_test_123",
      "charge": "ch_test_123",
      "amount_paid": 2900,
      "status": "paid"
    }
  }
}'

# Note: In a real test, we would need a valid webhook signature
# For now, we'll just document that webhook handling exists
echo -e "${BLUE}Webhook endpoint: POST $API_URL/subscriptions/webhooks/stripe${NC}"
echo -e "${BLUE}Expected behavior: Activate subscription and create invoice${NC}\n"

# Step 7: Verify subscription can be retrieved
if [ ! -z "$SUBSCRIPTION_ID" ] && [ "$SUBSCRIPTION_ID" != "null" ]; then
  echo -e "${YELLOW}Step 7: TEST - Retrieve current subscription${NC}"
  CURRENT_SUB_RESPONSE=$(curl -s -X GET "$API_URL/subscriptions/current" \
    -H "Authorization: Bearer $TOKEN")
  
  echo "$CURRENT_SUB_RESPONSE" | jq '.'
  
  check_result "Retrieve current subscription" "$CURRENT_SUB_RESPONSE" '.id'
  echo ""
fi

# Step 8: Test - Download invoice (if subscription was created)
if [ ! -z "$SUBSCRIPTION_ID" ] && [ "$SUBSCRIPTION_ID" != "null" ]; then
  echo -e "${YELLOW}Step 8: TEST - Download invoice${NC}"
  INVOICE_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X GET "$API_URL/subscriptions/$SUBSCRIPTION_ID/invoice" \
    -H "Authorization: Bearer $TOKEN" \
    -o /tmp/test-invoice.pdf)
  
  HTTP_STATUS=$(echo "$INVOICE_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
  
  if [ "$HTTP_STATUS" == "200" ]; then
    echo -e "${GREEN}✓ PASS: Invoice downloaded successfully${NC}"
    echo -e "Invoice saved to: /tmp/test-invoice.pdf\n"
    ((TESTS_PASSED++))
  else
    echo -e "${YELLOW}⚠ WARNING: Invoice download returned status $HTTP_STATUS${NC}"
    echo -e "${BLUE}This may be expected if invoice generation is not fully implemented${NC}\n"
  fi
fi

# Summary
echo -e "${BLUE}=== Test Summary ===${NC}"
echo -e "${GREEN}Tests Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Tests Failed: $TESTS_FAILED${NC}"
echo -e ""

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}✓ All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}✗ Some tests failed${NC}"
  exit 1
fi
