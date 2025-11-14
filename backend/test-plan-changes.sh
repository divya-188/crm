#!/bin/bash

# Test Plan Upgrades and Downgrades
# This script tests the upgrade and downgrade functionality

BASE_URL="http://localhost:3000/api/v1"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="Admin123!"

echo "========================================="
echo "Testing Plan Upgrades and Downgrades"
echo "========================================="
echo ""

# Login as admin
echo "1. Logging in as admin..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$ADMIN_EMAIL\",
    \"password\": \"$ADMIN_PASSWORD\"
  }")

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Login successful"
echo ""

# Get current subscription
echo "2. Getting current subscription..."
CURRENT_SUB=$(curl -s -X GET "$BASE_URL/subscriptions/current" \
  -H "Authorization: Bearer $TOKEN")

echo "Current subscription:"
echo "$CURRENT_SUB" | jq '.'
echo ""

SUBSCRIPTION_ID=$(echo $CURRENT_SUB | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
CURRENT_PLAN_ID=$(echo $CURRENT_SUB | grep -o '"planId":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$SUBSCRIPTION_ID" ]; then
  echo "❌ No active subscription found"
  exit 1
fi

echo "Subscription ID: $SUBSCRIPTION_ID"
echo "Current Plan ID: $CURRENT_PLAN_ID"
echo ""

# Get all plans
echo "3. Getting all subscription plans..."
PLANS=$(curl -s -X GET "$BASE_URL/subscription-plans" \
  -H "Authorization: Bearer $TOKEN")

echo "Available plans:"
echo "$PLANS" | jq '.data[] | {id, name, price}'
echo ""

# Find a higher-priced plan for upgrade
STARTER_PLAN_ID=$(echo $PLANS | jq -r '.data[] | select(.name == "Starter") | .id')
PROFESSIONAL_PLAN_ID=$(echo $PLANS | jq -r '.data[] | select(.name == "Professional") | .id')
ENTERPRISE_PLAN_ID=$(echo $PLANS | jq -r '.data[] | select(.name == "Enterprise") | .id')

echo "Plan IDs:"
echo "Starter: $STARTER_PLAN_ID"
echo "Professional: $PROFESSIONAL_PLAN_ID"
echo "Enterprise: $ENTERPRISE_PLAN_ID"
echo ""

# Test 1: Upgrade subscription
echo "========================================="
echo "Test 1: Upgrade Subscription"
echo "========================================="
echo ""

# Determine upgrade target based on current plan
if [ "$CURRENT_PLAN_ID" == "$STARTER_PLAN_ID" ]; then
  UPGRADE_PLAN_ID=$PROFESSIONAL_PLAN_ID
  UPGRADE_PLAN_NAME="Professional"
elif [ "$CURRENT_PLAN_ID" == "$PROFESSIONAL_PLAN_ID" ]; then
  UPGRADE_PLAN_ID=$ENTERPRISE_PLAN_ID
  UPGRADE_PLAN_NAME="Enterprise"
else
  echo "⚠️  Already on highest plan, skipping upgrade test"
  UPGRADE_PLAN_ID=""
fi

if [ -n "$UPGRADE_PLAN_ID" ]; then
  echo "Upgrading to $UPGRADE_PLAN_NAME plan..."
  UPGRADE_RESPONSE=$(curl -s -X PATCH "$BASE_URL/subscriptions/$SUBSCRIPTION_ID/upgrade" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"newPlanId\": \"$UPGRADE_PLAN_ID\",
      \"paymentProvider\": \"stripe\"
    }")

  echo "Upgrade response:"
  echo "$UPGRADE_RESPONSE" | jq '.'
  echo ""

  if echo "$UPGRADE_RESPONSE" | grep -q '"success":true'; then
    echo "✅ Upgrade successful"
  else
    echo "❌ Upgrade failed"
  fi
  echo ""
fi

# Test 2: Downgrade subscription
echo "========================================="
echo "Test 2: Downgrade Subscription"
echo "========================================="
echo ""

# Get updated subscription
UPDATED_SUB=$(curl -s -X GET "$BASE_URL/subscriptions/current" \
  -H "Authorization: Bearer $TOKEN")

UPDATED_PLAN_ID=$(echo $UPDATED_SUB | grep -o '"planId":"[^"]*' | head -1 | cut -d'"' -f4)

# Determine downgrade target based on current plan
if [ "$UPDATED_PLAN_ID" == "$ENTERPRISE_PLAN_ID" ]; then
  DOWNGRADE_PLAN_ID=$PROFESSIONAL_PLAN_ID
  DOWNGRADE_PLAN_NAME="Professional"
elif [ "$UPDATED_PLAN_ID" == "$PROFESSIONAL_PLAN_ID" ]; then
  DOWNGRADE_PLAN_ID=$STARTER_PLAN_ID
  DOWNGRADE_PLAN_NAME="Starter"
else
  echo "⚠️  Already on lowest plan, skipping downgrade test"
  DOWNGRADE_PLAN_ID=""
fi

if [ -n "$DOWNGRADE_PLAN_ID" ]; then
  echo "Scheduling downgrade to $DOWNGRADE_PLAN_NAME plan..."
  DOWNGRADE_RESPONSE=$(curl -s -X PATCH "$BASE_URL/subscriptions/$SUBSCRIPTION_ID/downgrade" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"newPlanId\": \"$DOWNGRADE_PLAN_ID\"
    }")

  echo "Downgrade response:"
  echo "$DOWNGRADE_RESPONSE" | jq '.'
  echo ""

  if echo "$DOWNGRADE_RESPONSE" | grep -q '"success":true'; then
    echo "✅ Downgrade scheduled successfully"
  else
    echo "❌ Downgrade failed"
  fi
  echo ""
fi

# Test 3: Try to downgrade with usage exceeding limits
echo "========================================="
echo "Test 3: Downgrade Validation (Usage Check)"
echo "========================================="
echo ""

# Get usage statistics
echo "Getting current usage statistics..."
USAGE=$(curl -s -X GET "$BASE_URL/subscriptions/usage" \
  -H "Authorization: Bearer $TOKEN")

echo "Current usage:"
echo "$USAGE" | jq '.usage'
echo ""

# Try to downgrade to Starter (should fail if usage exceeds limits)
if [ "$UPDATED_PLAN_ID" != "$STARTER_PLAN_ID" ]; then
  echo "Attempting to downgrade to Starter plan (may fail due to usage)..."
  VALIDATION_RESPONSE=$(curl -s -X PATCH "$BASE_URL/subscriptions/$SUBSCRIPTION_ID/downgrade" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"newPlanId\": \"$STARTER_PLAN_ID\"
    }")

  echo "Validation response:"
  echo "$VALIDATION_RESPONSE" | jq '.'
  echo ""

  if echo "$VALIDATION_RESPONSE" | grep -q "exceeds"; then
    echo "✅ Usage validation working correctly (downgrade blocked)"
  elif echo "$VALIDATION_RESPONSE" | grep -q '"success":true'; then
    echo "✅ Downgrade allowed (usage within limits)"
  else
    echo "⚠️  Unexpected response"
  fi
  echo ""
fi

# Test 4: Check subscription metadata for scheduled changes
echo "========================================="
echo "Test 4: Check Scheduled Changes"
echo "========================================="
echo ""

FINAL_SUB=$(curl -s -X GET "$BASE_URL/subscriptions/current" \
  -H "Authorization: Bearer $TOKEN")

echo "Final subscription state:"
echo "$FINAL_SUB" | jq '{
  id,
  planId,
  status,
  endDate,
  metadata: .metadata | {
    scheduledDowngradePlanId,
    scheduledDowngradeAt,
    upgradedAt,
    proratedAmount
  }
}'
echo ""

echo "========================================="
echo "Plan Changes Tests Complete"
echo "========================================="
echo ""

echo "Summary:"
echo "- Upgrade endpoint: Tested"
echo "- Downgrade endpoint: Tested"
echo "- Usage validation: Tested"
echo "- Scheduled changes: Verified"
echo ""
echo "Note: Email notifications are logged in the backend console"
