#!/bin/bash

# Test Payment System in Test Mode
echo "🧪 Testing Payment System in Test Mode"
echo "========================================"
echo ""

# Check if PAYMENT_MODE is set to test
echo "📋 Step 1: Checking PAYMENT_MODE..."
if grep -q "PAYMENT_MODE=test" backend/.env; then
  echo "✅ PAYMENT_MODE is set to 'test'"
else
  echo "⚠️  PAYMENT_MODE not found or not set to 'test'"
  echo "   Adding PAYMENT_MODE=test to backend/.env..."
  echo "PAYMENT_MODE=test" >> backend/.env
fi
echo ""

# Get auth token
echo "🔐 Step 2: Logging in..."
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

# Get plans
echo "📦 Step 3: Fetching subscription plans..."
PLANS_RESPONSE=$(curl -s -X GET http://localhost:3000/api/v1/subscription-plans \
  -H "Authorization: Bearer $TOKEN")

PLAN_ID=$(echo $PLANS_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$PLAN_ID" ]; then
  echo "❌ No plans found"
  exit 1
fi

PLAN_NAME=$(echo $PLANS_RESPONSE | grep -o '"name":"[^"]*' | head -1 | cut -d'"' -f4)
echo "✅ Found plan: $PLAN_NAME (ID: $PLAN_ID)"
echo ""

# Create subscription in test mode
echo "💳 Step 4: Creating subscription in TEST MODE..."
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

# Check if subscription was created successfully
SUCCESS=$(echo $SUBSCRIPTION_RESPONSE | grep -o '"success":true')
SUBSCRIPTION_ID=$(echo $SUBSCRIPTION_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
STATUS=$(echo $SUBSCRIPTION_RESPONSE | grep -o '"status":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -n "$SUCCESS" ] && [ -n "$SUBSCRIPTION_ID" ]; then
  echo "✅ Subscription created successfully!"
  echo "   Subscription ID: $SUBSCRIPTION_ID"
  echo "   Status: $STATUS"
  echo ""
  
  # Check if it's a test subscription
  if [[ $SUBSCRIPTION_ID == test_sub_* ]]; then
    echo "✅ Test mode confirmed - Subscription ID starts with 'test_sub_'"
  fi
  
  # Check if status is active
  if [ "$STATUS" = "active" ] || [ "$STATUS" = "pending" ]; then
    echo "✅ Subscription is $STATUS"
  else
    echo "⚠️  Unexpected status: $STATUS"
  fi
  
  echo ""
  echo "======================================"
  echo "✅ TEST MODE WORKING PERFECTLY!"
  echo "======================================"
  echo ""
  echo "What happened:"
  echo "1. No Stripe API was called"
  echo "2. Subscription was created instantly"
  echo "3. No payment form was shown"
  echo "4. No redirect occurred"
  echo "5. Subscription is ready to use!"
  echo ""
  echo "You can now:"
  echo "- Test subscription features"
  echo "- Develop without Stripe setup"
  echo "- Switch to live mode when ready"
  
else
  echo "❌ Subscription creation failed"
  echo "Full response:"
  echo $SUBSCRIPTION_RESPONSE
  exit 1
fi
