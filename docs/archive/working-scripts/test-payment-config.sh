#!/bin/bash

# Test Payment Config Endpoint

echo "🧪 Testing Payment Config Endpoint"
echo "=================================="
echo ""

# Login to get token
echo "📝 Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@whatscrm.com",
    "password": "SuperAdmin123!"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to get auth token"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Got auth token"
echo ""

# Get payment config
echo "🔍 Fetching payment config..."
CONFIG_RESPONSE=$(curl -s -X GET http://localhost:3000/api/v1/subscriptions/payment-config \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "📊 Payment Config Response:"
echo "$CONFIG_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$CONFIG_RESPONSE"
echo ""

# Extract values
DEFAULT_PROVIDER=$(echo $CONFIG_RESPONSE | grep -o '"defaultProvider":"[^"]*' | cut -d'"' -f4)
PAYMENT_MODE=$(echo $CONFIG_RESPONSE | grep -o '"paymentMode":"[^"]*' | cut -d'"' -f4)

echo "✅ Default Provider: $DEFAULT_PROVIDER"
echo "✅ Payment Mode: $PAYMENT_MODE"
echo ""

if [ "$DEFAULT_PROVIDER" = "razorpay" ]; then
  echo "🎉 SUCCESS! Payment preference is set to Razorpay!"
else
  echo "⚠️  WARNING: Payment preference is $DEFAULT_PROVIDER, expected razorpay"
fi
