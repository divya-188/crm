#!/bin/bash

echo "🧪 Testing Payment Preference Feature"
echo "======================================"

# Login
echo "1. Logging in..."
TOKEN=$(curl -s -X POST "http://localhost:3000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@test.com", "password": "Admin123!"}' | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed"
  exit 1
fi
echo "✅ Logged in"

# Get payment config
echo ""
echo "2. Getting payment configuration..."
curl -s http://localhost:3000/api/v1/subscriptions/payment-config | python3 -m json.tool
echo ""

# Get plan ID
echo "3. Getting plan ID..."
PLAN_ID=$(curl -s -X GET "http://localhost:3000/api/v1/subscription-plans" \
  -H "Authorization: Bearer $TOKEN" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$PLAN_ID" ]; then
  echo "❌ No plans found"
  exit 1
fi
echo "✅ Plan ID: $PLAN_ID"

# Cancel existing subscription
echo ""
echo "4. Canceling existing subscriptions..."
npx ts-node backend/scripts/cancel-test-subscription.ts

# Test 1: Create subscription WITHOUT payment provider (should use default)
echo ""
echo "5. Creating subscription WITHOUT payment provider (should use default: razorpay)..."
RESPONSE=$(curl -s -X POST "http://localhost:3000/api/v1/subscriptions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"planId\": \"$PLAN_ID\"}")

echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"

# Check if razorpay was used
if echo "$RESPONSE" | grep -q "razorpaySubscriptionId"; then
  echo ""
  echo "✅ SUCCESS: Default provider (Razorpay) was used!"
else
  echo ""
  echo "❌ FAILED: Default provider was not used"
fi

echo ""
echo "======================================"
echo "Test complete!"
