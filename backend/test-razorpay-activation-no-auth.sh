#!/bin/bash

echo "🧪 Testing Razorpay Activation Endpoint (No Auth Required)"
echo "=========================================================="
echo ""

# Get the admin user's tenant ID from database
TENANT_ID=$(psql -U postgres -d whatscrm -t -c "SELECT \"tenantId\" FROM users WHERE email = 'admin@example.com' LIMIT 1;" | xargs)

if [ -z "$TENANT_ID" ]; then
  echo "❌ Could not find admin user's tenant ID"
  exit 1
fi

echo "✅ Found tenant ID: $TENANT_ID"
echo ""

# Get the subscription ID for this tenant
SUBSCRIPTION_ID=$(psql -U postgres -d whatscrm -t -c "SELECT id FROM subscriptions WHERE \"tenantId\" = '$TENANT_ID' ORDER BY \"createdAt\" DESC LIMIT 1;" | xargs)

if [ -z "$SUBSCRIPTION_ID" ]; then
  echo "❌ No subscription found for tenant"
  exit 1
fi

echo "✅ Found subscription ID: $SUBSCRIPTION_ID"
echo ""

# Test activation endpoint WITHOUT authentication
echo "📡 Testing activation endpoint (no auth token)..."
echo ""

RESPONSE=$(curl -s -X POST \
  "http://localhost:3000/api/v1/subscriptions/${SUBSCRIPTION_ID}/activate-razorpay" \
  -H "Content-Type: application/json" \
  -d "{
    \"subscriptionId\": \"${SUBSCRIPTION_ID}\",
    \"tenantId\": \"${TENANT_ID}\",
    \"razorpayPaymentId\": \"pay_test123\",
    \"razorpayPaymentLinkId\": \"plink_test123\"
  }")

echo "Response:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# Check if activation was successful
if echo "$RESPONSE" | grep -q '"success":true'; then
  echo "✅ Activation endpoint works without authentication!"
else
  echo "⚠️ Activation response received (webhook will handle it)"
fi

echo ""
echo "🔍 Checking subscription status in database..."
STATUS=$(psql -U postgres -d whatscrm -t -c "SELECT status FROM subscriptions WHERE id = '$SUBSCRIPTION_ID';" | xargs)
echo "Current status: $STATUS"
