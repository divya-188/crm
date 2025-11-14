#!/bin/bash

# Test WhatsApp Connections Pagination API
# This script tests the pagination functionality for WhatsApp connections

BASE_URL="http://localhost:3000/api"
TOKEN=""

echo "==================================="
echo "WhatsApp Connections Pagination Test"
echo "==================================="
echo ""

# Function to make authenticated requests
make_request() {
  local method=$1
  local endpoint=$2
  local data=$3
  
  if [ -z "$data" ]; then
    curl -s -X "$method" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      "$BASE_URL$endpoint"
  else
    curl -s -X "$method" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "$data" \
      "$BASE_URL$endpoint"
  fi
}

# Step 1: Login
echo "1. Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin123!"
  }' \
  "$BASE_URL/auth/login")

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Login successful"
echo ""

# Step 2: Test pagination - Page 1
echo "2. Testing pagination - Page 1 (limit 5)..."
PAGE1_RESPONSE=$(make_request GET "/whatsapp/connections?page=1&limit=5")
echo "$PAGE1_RESPONSE" | jq '.'
echo ""

# Step 3: Test pagination - Page 2
echo "3. Testing pagination - Page 2 (limit 5)..."
PAGE2_RESPONSE=$(make_request GET "/whatsapp/connections?page=2&limit=5")
echo "$PAGE2_RESPONSE" | jq '.'
echo ""

# Step 4: Test status filter
echo "4. Testing status filter (connected)..."
STATUS_RESPONSE=$(make_request GET "/whatsapp/connections?status=connected")
echo "$STATUS_RESPONSE" | jq '.'
echo ""

# Step 5: Test type filter
echo "5. Testing type filter (meta_api)..."
TYPE_RESPONSE=$(make_request GET "/whatsapp/connections?type=meta_api")
echo "$TYPE_RESPONSE" | jq '.'
echo ""

# Step 6: Test search
echo "6. Testing search..."
SEARCH_RESPONSE=$(make_request GET "/whatsapp/connections?search=test")
echo "$SEARCH_RESPONSE" | jq '.'
echo ""

# Step 7: Verify hasMore flag
echo "7. Verifying hasMore flag..."
HAS_MORE=$(echo $PAGE1_RESPONSE | jq -r '.hasMore')
TOTAL=$(echo $PAGE1_RESPONSE | jq -r '.total')
PAGE=$(echo $PAGE1_RESPONSE | jq -r '.page')
LIMIT=$(echo $PAGE1_RESPONSE | jq -r '.limit')

echo "Total: $TOTAL"
echo "Page: $PAGE"
echo "Limit: $LIMIT"
echo "Has More: $HAS_MORE"

if [ "$HAS_MORE" = "true" ] && [ "$TOTAL" -gt "$LIMIT" ]; then
  echo "✅ hasMore flag is correct"
elif [ "$HAS_MORE" = "false" ] && [ "$TOTAL" -le "$LIMIT" ]; then
  echo "✅ hasMore flag is correct"
else
  echo "❌ hasMore flag is incorrect"
fi

echo ""
echo "==================================="
echo "Test completed!"
echo "==================================="
