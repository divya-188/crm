#!/bin/bash

# Test Subscription Plans Pagination API
# This script tests the pagination functionality for subscription plans

BASE_URL="http://localhost:3000"
API_URL="$BASE_URL/subscription-plans"

echo "================================"
echo "Subscription Plans Pagination Test"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# First, login to get token
echo "1. Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin123!"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo -e "${RED}✗ Failed to login${NC}"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✓ Login successful${NC}"
echo ""

# Test 1: Get first page
echo "2. Testing pagination - Page 1 (limit 5)..."
PAGE1_RESPONSE=$(curl -s -X GET "$API_URL?page=1&limit=5" \
  -H "Authorization: Bearer $TOKEN")

echo "Response:"
echo $PAGE1_RESPONSE | jq '.'

# Check if response has required fields
HAS_DATA=$(echo $PAGE1_RESPONSE | jq 'has("data")')
HAS_TOTAL=$(echo $PAGE1_RESPONSE | jq 'has("total")')
HAS_PAGE=$(echo $PAGE1_RESPONSE | jq 'has("page")')
HAS_LIMIT=$(echo $PAGE1_RESPONSE | jq 'has("limit")')
HAS_MORE=$(echo $PAGE1_RESPONSE | jq 'has("hasMore")')

if [ "$HAS_DATA" = "true" ] && [ "$HAS_TOTAL" = "true" ] && [ "$HAS_PAGE" = "true" ] && [ "$HAS_LIMIT" = "true" ] && [ "$HAS_MORE" = "true" ]; then
  echo -e "${GREEN}✓ Response has all required pagination fields${NC}"
  
  TOTAL=$(echo $PAGE1_RESPONSE | jq '.total')
  PAGE=$(echo $PAGE1_RESPONSE | jq '.page')
  LIMIT=$(echo $PAGE1_RESPONSE | jq '.limit')
  HAS_MORE_VALUE=$(echo $PAGE1_RESPONSE | jq '.hasMore')
  DATA_LENGTH=$(echo $PAGE1_RESPONSE | jq '.data | length')
  
  echo "  - Total: $TOTAL"
  echo "  - Page: $PAGE"
  echo "  - Limit: $LIMIT"
  echo "  - Has More: $HAS_MORE_VALUE"
  echo "  - Data Length: $DATA_LENGTH"
else
  echo -e "${RED}✗ Response missing required pagination fields${NC}"
  echo "  - has data: $HAS_DATA"
  echo "  - has total: $HAS_TOTAL"
  echo "  - has page: $HAS_PAGE"
  echo "  - has limit: $HAS_LIMIT"
  echo "  - has hasMore: $HAS_MORE"
fi
echo ""

# Test 2: Get second page
echo "3. Testing pagination - Page 2 (limit 5)..."
PAGE2_RESPONSE=$(curl -s -X GET "$API_URL?page=2&limit=5" \
  -H "Authorization: Bearer $TOKEN")

echo "Response:"
echo $PAGE2_RESPONSE | jq '.'
echo ""

# Test 3: Test with includeInactive filter
echo "4. Testing with includeInactive=true..."
INACTIVE_RESPONSE=$(curl -s -X GET "$API_URL?page=1&limit=10&includeInactive=true" \
  -H "Authorization: Bearer $TOKEN")

echo "Response:"
echo $INACTIVE_RESPONSE | jq '.'
echo ""

# Test 4: Verify hasMore logic
echo "5. Verifying hasMore logic..."
TOTAL=$(echo $PAGE1_RESPONSE | jq '.total')
PAGE=$(echo $PAGE1_RESPONSE | jq '.page')
LIMIT=$(echo $PAGE1_RESPONSE | jq '.limit')
HAS_MORE_VALUE=$(echo $PAGE1_RESPONSE | jq '.hasMore')

EXPECTED_HAS_MORE="false"
if [ $((PAGE * LIMIT)) -lt $TOTAL ]; then
  EXPECTED_HAS_MORE="true"
fi

if [ "$HAS_MORE_VALUE" = "$EXPECTED_HAS_MORE" ]; then
  echo -e "${GREEN}✓ hasMore flag is correct${NC}"
  echo "  - Expected: $EXPECTED_HAS_MORE"
  echo "  - Actual: $HAS_MORE_VALUE"
else
  echo -e "${RED}✗ hasMore flag is incorrect${NC}"
  echo "  - Expected: $EXPECTED_HAS_MORE"
  echo "  - Actual: $HAS_MORE_VALUE"
fi
echo ""

echo "================================"
echo "Test Complete"
echo "================================"
