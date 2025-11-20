#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3000/api/v1"
TOKEN=""
API_KEY=""
TENANT_ID=""

echo -e "${YELLOW}=== WhatsApp CRM API Keys Test ===${NC}\n"

# Step 1: Login
echo -e "${YELLOW}Step 1: Login${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin123!"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')
TENANT_ID=$(echo $LOGIN_RESPONSE | jq -r '.user.tenantId')

if [ "$TOKEN" != "null" ] && [ -n "$TOKEN" ]; then
  echo -e "${GREEN}✓ Login successful${NC}"
  echo "Token: ${TOKEN:0:20}..."
  echo "Tenant ID: $TENANT_ID"
else
  echo -e "${RED}✗ Login failed${NC}"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo ""

# Step 2: Create API Key
echo -e "${YELLOW}Step 2: Create API Key${NC}"
CREATE_KEY_RESPONSE=$(curl -s -X POST "$BASE_URL/api-keys" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Test API Key",
    "permissions": {
      "contacts": ["read", "create"],
      "messages": ["send", "read"],
      "conversations": ["read"]
    },
    "rateLimit": 100,
    "rateLimitWindow": 60
  }')

API_KEY=$(echo $CREATE_KEY_RESPONSE | jq -r '.apiKey.key')
API_KEY_ID=$(echo $CREATE_KEY_RESPONSE | jq -r '.apiKey.id')

if [ "$API_KEY" != "null" ] && [ -n "$API_KEY" ]; then
  echo -e "${GREEN}✓ API Key created successfully${NC}"
  echo "API Key: ${API_KEY:0:20}..."
  echo "API Key ID: $API_KEY_ID"
else
  echo -e "${RED}✗ API Key creation failed${NC}"
  echo "Response: $CREATE_KEY_RESPONSE"
  exit 1
fi

echo ""

# Step 3: List API Keys
echo -e "${YELLOW}Step 3: List API Keys${NC}"
LIST_KEYS_RESPONSE=$(curl -s -X GET "$BASE_URL/api-keys" \
  -H "Authorization: Bearer $TOKEN")

KEY_COUNT=$(echo $LIST_KEYS_RESPONSE | jq '.data | length')

if [ "$KEY_COUNT" -gt 0 ]; then
  echo -e "${GREEN}✓ API Keys listed successfully${NC}"
  echo "Total keys: $KEY_COUNT"
else
  echo -e "${RED}✗ Failed to list API keys${NC}"
  echo "Response: $LIST_KEYS_RESPONSE"
fi

echo ""

# Step 4: Get API Key Details
echo -e "${YELLOW}Step 4: Get API Key Details${NC}"
GET_KEY_RESPONSE=$(curl -s -X GET "$BASE_URL/api-keys/$API_KEY_ID" \
  -H "Authorization: Bearer $TOKEN")

KEY_NAME=$(echo $GET_KEY_RESPONSE | jq -r '.data.name')

if [ "$KEY_NAME" == "Test API Key" ]; then
  echo -e "${GREEN}✓ API Key details retrieved${NC}"
  echo "Name: $KEY_NAME"
else
  echo -e "${RED}✗ Failed to get API key details${NC}"
  echo "Response: $GET_KEY_RESPONSE"
fi

echo ""

# Step 5: Test Public API with API Key - Get Contacts
echo -e "${YELLOW}Step 5: Test Public API - Get Contacts${NC}"
PUBLIC_API_RESPONSE=$(curl -s -X GET "$BASE_URL/public/v1/contacts" \
  -H "X-API-Key: $API_KEY")

if echo $PUBLIC_API_RESPONSE | jq -e '.success' > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Public API request successful${NC}"
  echo "Response: $(echo $PUBLIC_API_RESPONSE | jq -c '.')"
else
  echo -e "${RED}✗ Public API request failed${NC}"
  echo "Response: $PUBLIC_API_RESPONSE"
fi

echo ""

# Step 6: Test Rate Limiting
echo -e "${YELLOW}Step 6: Test Rate Limiting${NC}"
echo "Making 5 rapid requests..."

for i in {1..5}; do
  RATE_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X GET "$BASE_URL/public/v1/contacts?limit=1" \
    -H "X-API-Key: $API_KEY")
  
  HTTP_CODE=$(echo "$RATE_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
  
  if [ "$HTTP_CODE" == "200" ]; then
    echo -e "  Request $i: ${GREEN}✓ Success (200)${NC}"
  elif [ "$HTTP_CODE" == "429" ]; then
    echo -e "  Request $i: ${YELLOW}⚠ Rate limited (429)${NC}"
  else
    echo -e "  Request $i: ${RED}✗ Failed ($HTTP_CODE)${NC}"
  fi
  
  sleep 0.1
done

echo ""

# Step 7: Get API Key Usage Stats
echo -e "${YELLOW}Step 7: Get API Key Usage Stats${NC}"
USAGE_RESPONSE=$(curl -s -X GET "$BASE_URL/api-keys/$API_KEY_ID/usage" \
  -H "Authorization: Bearer $TOKEN")

TOTAL_REQUESTS=$(echo $USAGE_RESPONSE | jq -r '.data.totalRequests')

if [ "$TOTAL_REQUESTS" != "null" ]; then
  echo -e "${GREEN}✓ Usage stats retrieved${NC}"
  echo "Total requests: $TOTAL_REQUESTS"
  echo "Rate limit: $(echo $USAGE_RESPONSE | jq -r '.data.rateLimit')"
else
  echo -e "${RED}✗ Failed to get usage stats${NC}"
  echo "Response: $USAGE_RESPONSE"
fi

echo ""

# Step 8: Update API Key
echo -e "${YELLOW}Step 8: Update API Key${NC}"
UPDATE_KEY_RESPONSE=$(curl -s -X PATCH "$BASE_URL/api-keys/$API_KEY_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Updated Test API Key",
    "rateLimit": 200
  }')

UPDATED_NAME=$(echo $UPDATE_KEY_RESPONSE | jq -r '.data.name')

if [ "$UPDATED_NAME" == "Updated Test API Key" ]; then
  echo -e "${GREEN}✓ API Key updated successfully${NC}"
  echo "New name: $UPDATED_NAME"
else
  echo -e "${RED}✗ Failed to update API key${NC}"
  echo "Response: $UPDATE_KEY_RESPONSE"
fi

echo ""

# Step 9: Test Public API - Send Message
echo -e "${YELLOW}Step 9: Test Public API - Send Message${NC}"
SEND_MESSAGE_RESPONSE=$(curl -s -X POST "$BASE_URL/public/v1/messages/send" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{
    "phoneNumber": "+1234567890",
    "message": "Hello from API!",
    "type": "text"
  }')

if echo $SEND_MESSAGE_RESPONSE | jq -e '.success' > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Message sent via Public API${NC}"
  echo "Message ID: $(echo $SEND_MESSAGE_RESPONSE | jq -r '.data.messageId')"
else
  echo -e "${RED}✗ Failed to send message${NC}"
  echo "Response: $SEND_MESSAGE_RESPONSE"
fi

echo ""

# Step 10: Delete API Key
echo -e "${YELLOW}Step 10: Delete API Key${NC}"
DELETE_KEY_RESPONSE=$(curl -s -X DELETE "$BASE_URL/api-keys/$API_KEY_ID" \
  -H "Authorization: Bearer $TOKEN")

if echo $DELETE_KEY_RESPONSE | jq -e '.message' | grep -q "deleted"; then
  echo -e "${GREEN}✓ API Key deleted successfully${NC}"
else
  echo -e "${RED}✗ Failed to delete API key${NC}"
  echo "Response: $DELETE_KEY_RESPONSE"
fi

echo ""
echo -e "${YELLOW}=== API Keys Test Complete ===${NC}"
