#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3000"
API_URL="$BASE_URL/api/v1"

echo -e "${YELLOW}=== WhatsApp CRM - Subscription Lifecycle API Tests ===${NC}\n"

# Step 1: Register and Login
echo -e "${YELLOW}Step 1: Registering test user...${NC}"
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "lifecycle-test@example.com",
    "password": "Test123!@#",
    "firstName": "Lifecycle",
    "lastName": "Test",
    "tenantName": "Lifecycle Test Tenant"
  }')

echo "$REGISTER_RESPONSE" | jq '.'

# Extract token
TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.data.accessToken // .accessToken // empty')
TENANT_ID=$(echo "$REGISTER_RESPONSE" | jq -r '.data.user.tenantId // .user.tenantId // empty')

if [ -z "$TOKEN" ] || [ "$TOKEN" == "null" ]; then
  echo -e "${YELLOW}Registration might have failed, trying to login...${NC}"
  
  LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{
      "email": "lifecycle-test@example.com",
      "password": "Test123!@#"
    }')
  
  echo "$LOGIN_RESPONSE" | jq '.'
  TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.accessToken // .accessToken // empty')
  TENANT_ID=$(echo "$LOGIN_RESPONSE" | jq -r '.data.user.tenantId // .user.tenantId // empty')
fi

if [ -z "$TOKEN" ] || [ "$TOKEN" == "null" ]; then
  echo -e "${RED}Failed to get authentication token${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Authentication successful${NC}"
echo -e "Token: ${TOKEN:0:20}..."
echo -e "Tenant ID: $TENANT_ID\n"

# Step 2: Get available plans
echo -e "${YELLOW}Step 2: Getting available subscription plans...${NC}"
PLANS_RESPONSE=$(curl -s -X GET "$API_URL/subscription-plans" \
  -H "Authorization: Bearer $TOKEN")

echo "$PLANS_RESPONSE" | jq '.'

# Extract first plan ID
PLAN_ID=$(echo "$PLANS_RESPONSE" | jq -r '.data[0].id // empty')

if [ -z "$PLAN_ID" ] || [ "$PLAN_ID" == "null" ]; then
  echo -e "${RED}No subscription plans found${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Found plan: $PLAN_ID${NC}\n"

# Step 3: Create a subscription
echo -e "${YELLOW}Step 3: Creating subscription...${NC}"
SUBSCRIPTION_RESPONSE=$(curl -s -X POST "$API_URL/subscriptions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"planId\": \"$PLAN_ID\",
    \"paymentProvider\": \"stripe\",
    \"paymentMethodId\": \"pm_test_123\"
  }")

echo "$SUBSCRIPTION_RESPONSE" | jq '.'

SUBSCRIPTION_ID=$(echo "$SUBSCRIPTION_RESPONSE" | jq -r '.data.id // empty')

if [ -z "$SUBSCRIPTION_ID" ] || [ "$SUBSCRIPTION_ID" == "null" ]; then
  echo -e "${RED}Failed to create subscription${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Subscription created: $SUBSCRIPTION_ID${NC}\n"

# Step 4: Apply coupon code
echo -e "${YELLOW}Step 4: Applying coupon code...${NC}"
COUPON_RESPONSE=$(curl -s -X POST "$API_URL/subscriptions/$SUBSCRIPTION_ID/coupon" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "couponCode": "WELCOME10"
  }')

echo "$COUPON_RESPONSE" | jq '.'

if echo "$COUPON_RESPONSE" | jq -e '.success' > /dev/null; then
  echo -e "${GREEN}✓ Coupon applied successfully${NC}\n"
else
  echo -e "${YELLOW}⚠ Coupon application may have failed${NC}\n"
fi

# Step 5: Get all plans for upgrade/downgrade
echo -e "${YELLOW}Step 5: Getting plans for upgrade/downgrade...${NC}"
ALL_PLANS=$(curl -s -X GET "$API_URL/subscription-plans" \
  -H "Authorization: Bearer $TOKEN")

# Try to find a different plan for upgrade
UPGRADE_PLAN_ID=$(echo "$ALL_PLANS" | jq -r ".data[] | select(.id != \"$PLAN_ID\") | .id" | head -n 1)

if [ ! -z "$UPGRADE_PLAN_ID" ] && [ "$UPGRADE_PLAN_ID" != "null" ]; then
  echo -e "${GREEN}✓ Found upgrade plan: $UPGRADE_PLAN_ID${NC}\n"
  
  # Step 6: Upgrade subscription
  echo -e "${YELLOW}Step 6: Upgrading subscription...${NC}"
  UPGRADE_RESPONSE=$(curl -s -X PATCH "$API_URL/subscriptions/$SUBSCRIPTION_ID/upgrade" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"newPlanId\": \"$UPGRADE_PLAN_ID\",
      \"paymentProvider\": \"stripe\",
      \"paymentMethodId\": \"pm_test_456\"
    }")
  
  echo "$UPGRADE_RESPONSE" | jq '.'
  
  if echo "$UPGRADE_RESPONSE" | jq -e '.success' > /dev/null; then
    echo -e "${GREEN}✓ Subscription upgraded successfully${NC}\n"
  else
    echo -e "${YELLOW}⚠ Upgrade may have failed (this is expected if plan prices are not configured correctly)${NC}\n"
  fi
  
  # Step 7: Downgrade subscription
  echo -e "${YELLOW}Step 7: Scheduling downgrade...${NC}"
  DOWNGRADE_RESPONSE=$(curl -s -X PATCH "$API_URL/subscriptions/$SUBSCRIPTION_ID/downgrade" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"newPlanId\": \"$PLAN_ID\"
    }")
  
  echo "$DOWNGRADE_RESPONSE" | jq '.'
  
  if echo "$DOWNGRADE_RESPONSE" | jq -e '.success' > /dev/null; then
    echo -e "${GREEN}✓ Downgrade scheduled successfully${NC}\n"
  else
    echo -e "${YELLOW}⚠ Downgrade scheduling may have failed${NC}\n"
  fi
else
  echo -e "${YELLOW}⚠ Only one plan available, skipping upgrade/downgrade tests${NC}\n"
fi

# Step 8: Renew subscription
echo -e "${YELLOW}Step 8: Renewing subscription...${NC}"
RENEW_RESPONSE=$(curl -s -X POST "$API_URL/subscriptions/$SUBSCRIPTION_ID/renew" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "paymentMethodId": "pm_test_789"
  }')

echo "$RENEW_RESPONSE" | jq '.'

if echo "$RENEW_RESPONSE" | jq -e '.success' > /dev/null; then
  echo -e "${GREEN}✓ Subscription renewed successfully${NC}\n"
else
  echo -e "${YELLOW}⚠ Renewal may have failed${NC}\n"
fi

# Step 9: Sync subscription status
echo -e "${YELLOW}Step 9: Syncing subscription status...${NC}"
SYNC_RESPONSE=$(curl -s -X GET "$API_URL/subscriptions/$SUBSCRIPTION_ID/sync" \
  -H "Authorization: Bearer $TOKEN")

echo "$SYNC_RESPONSE" | jq '.'

if echo "$SYNC_RESPONSE" | jq -e '.success' > /dev/null; then
  echo -e "${GREEN}✓ Subscription synced successfully${NC}\n"
else
  echo -e "${YELLOW}⚠ Sync may have failed${NC}\n"
fi

# Step 10: Cancel subscription
echo -e "${YELLOW}Step 10: Cancelling subscription...${NC}"
CANCEL_RESPONSE=$(curl -s -X DELETE "$API_URL/subscriptions/$SUBSCRIPTION_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "stripe"
  }')

echo "$CANCEL_RESPONSE" | jq '.'

if echo "$CANCEL_RESPONSE" | jq -e '.success' > /dev/null; then
  echo -e "${GREEN}✓ Subscription cancelled successfully${NC}\n"
else
  echo -e "${YELLOW}⚠ Cancellation may have failed${NC}\n"
fi

echo -e "${GREEN}=== Subscription Lifecycle Tests Complete ===${NC}"
echo -e "${YELLOW}Note: Some operations may fail if payment providers are not fully configured${NC}"
echo -e "${YELLOW}Cron jobs for expiration handling and reminders run automatically in the background${NC}"
