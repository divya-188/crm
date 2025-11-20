#!/bin/bash

# Test Subscription Checkout Flow
# This script tests the new checkout session flow

echo "🧪 Testing Subscription Checkout Flow"
echo "======================================"
echo ""

# Get auth token (using admin user)
echo "📝 Step 1: Logging in as admin..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@whatscrm.com",
    "password": "Admin@123"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Login successful"
echo ""

# Get available plans
echo "📋 Step 2: Fetching subscription plans..."
PLANS_RESPONSE=$(curl -s -X GET http://localhost:3000/api/v1/subscription-plans \
  -H "Authorization: Bearer $TOKEN")

echo "Plans available:"
echo $PLANS_RESPONSE | grep -o '"name":"[^"]*' | cut -d'"' -f4
echo ""

# Get first plan ID
PLAN_ID=$(echo $PLANS_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$PLAN_ID" ]; then
  echo "❌ No plans found"
  exit 1
fi

echo "Using plan ID: $PLAN_ID"
echo ""

# Create subscription WITHOUT payment method (should return checkout URL)
echo "💳 Step 3: Creating subscription without payment method..."
SUBSCRIPTION_RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/subscriptions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"planId\": \"$PLAN_ID\",
    \"paymentProvider\": \"stripe\"
  }")

echo "Response:"
echo $SUBSCRIPTION_RESPONSE | jq '.' 2>/dev/null || echo $SUBSCRIPTION_RESPONSE
echo ""

# Check if checkout URL is present
CHECKOUT_URL=$(echo $SUBSCRIPTION_RESPONSE | grep -o '"checkoutUrl":"[^"]*' | cut -d'"' -f4)

if [ -z "$CHECKOUT_URL" ]; then
  echo "❌ No checkout URL returned"
  echo "This might indicate an error or the subscription was created directly"
  echo ""
  echo "Full response:"
  echo $SUBSCRIPTION_RESPONSE
  exit 1
fi

echo "✅ Checkout URL received!"
echo "🔗 Checkout URL: $CHECKOUT_URL"
echo ""
echo "======================================"
echo "✅ Test completed successfully!"
echo ""
echo "Next steps:"
echo "1. Open the checkout URL in your browser"
echo "2. Use test card: 4242 4242 4242 4242"
echo "3. Use any future expiry date and CVC"
echo "4. Complete the checkout"
echo "5. Stripe will redirect back to your app"
echo "6. Webhook will activate the subscription"
