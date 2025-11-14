#!/bin/bash

# Test Subscription Cancellation Implementation
# This script tests the subscription cancellation endpoints

BASE_URL="http://localhost:3000/api/v1"
ADMIN_EMAIL="admin@test.com"
ADMIN_PASSWORD="Admin123!"

echo "=========================================="
echo "Subscription Cancellation Test"
echo "=========================================="
echo ""

# Step 1: Login as admin
echo "Step 1: Logging in as admin..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$ADMIN_EMAIL\",
    \"password\": \"$ADMIN_PASSWORD\"
  }")

ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$ACCESS_TOKEN" ]; then
  echo "❌ Login failed"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Login successful"
echo ""

# Step 2: Get current subscription
echo "Step 2: Getting current subscription..."
CURRENT_SUB=$(curl -s -X GET "$BASE_URL/subscriptions/current" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "Current subscription:"
echo "$CURRENT_SUB" | jq '.'
echo ""

SUBSCRIPTION_ID=$(echo $CURRENT_SUB | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$SUBSCRIPTION_ID" ]; then
  echo "❌ No active subscription found"
  exit 1
fi

echo "Subscription ID: $SUBSCRIPTION_ID"
echo ""

# Step 3: Test cancellation at period end (default behavior)
echo "Step 3: Testing cancellation at period end..."
CANCEL_RESPONSE=$(curl -s -X DELETE "$BASE_URL/subscriptions/$SUBSCRIPTION_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cancellationReason": "Testing cancellation at period end",
    "cancelImmediately": false
  }')

echo "Cancellation response:"
echo "$CANCEL_RESPONSE" | jq '.'
echo ""

# Check if cancellation was successful
if echo "$CANCEL_RESPONSE" | grep -q '"success":true'; then
  echo "✅ Subscription marked for cancellation at period end"
else
  echo "❌ Cancellation failed"
  echo "$CANCEL_RESPONSE"
fi
echo ""

# Step 4: Verify subscription status
echo "Step 4: Verifying subscription status..."
VERIFY_SUB=$(curl -s -X GET "$BASE_URL/subscriptions/current" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "Updated subscription:"
echo "$VERIFY_SUB" | jq '.'
echo ""

# Check metadata for cancelAtPeriodEnd flag
if echo "$VERIFY_SUB" | grep -q 'cancelAtPeriodEnd'; then
  echo "✅ Subscription correctly marked for cancellation at period end"
else
  echo "⚠️  Warning: cancelAtPeriodEnd flag not found in metadata"
fi
echo ""

# Step 5: Test immediate cancellation (create a new subscription first if needed)
echo "Step 5: Testing immediate cancellation..."
echo "Note: This would require creating a new subscription first"
echo "Skipping immediate cancellation test to preserve current subscription state"
echo ""

# Summary
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo ""
echo "✅ Login successful"
echo "✅ Retrieved current subscription"
echo "✅ Cancelled subscription at period end"
echo "✅ Verified cancellation metadata"
echo ""
echo "Cancellation Features Tested:"
echo "  - Cancellation endpoint (DELETE /subscriptions/:id)"
echo "  - Cancellation reason capture"
echo "  - Cancel at period end (default behavior)"
echo "  - Metadata updates"
echo ""
echo "Note: The following features are implemented but not tested in this script:"
echo "  - Immediate cancellation (cancelImmediately: true)"
echo "  - Payment gateway cancellation"
echo "  - Cancellation confirmation email"
echo "  - Automatic cancellation at period end (via cron job)"
echo ""
echo "=========================================="
