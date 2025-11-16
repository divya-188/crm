#!/bin/bash

echo "🧪 Testing Subscription API"
echo "============================"
echo ""

# Login first
echo "1️⃣ Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "Admin123!"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['accessToken'])" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to login"
  exit 1
fi

echo "✅ Logged in successfully"
echo ""

# Test current subscription
echo "2️⃣ Getting current subscription..."
curl -s http://localhost:3000/api/v1/subscriptions/current \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

echo ""
echo ""

# Test usage
echo "3️⃣ Getting usage statistics..."
curl -s http://localhost:3000/api/v1/subscriptions/usage \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
